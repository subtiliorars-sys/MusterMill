import {
  applyBranchTheme,
  DEFAULT_BRANCH,
  getBranchSkin,
  isBranchUnlocked,
  listBranchSkins,
  type BranchSkin,
} from './branches';
import {
  birthMessage,
  deploymentMessage,
  getDisclaimer,
  getSafetyBriefLines,
  missionCompleteMessage,
  pairStartMessage,
  premiumCta,
  randomTip,
} from './flavor';
import {
  canvasCoords,
  defaultButtons,
  drawGameFrame,
  hitTestHudButton,
  hitTestSoldier,
  updateWorldEntities,
  type GameViewSoldier,
  type GameViewState,
  type HudAction,
} from './game-view';
import {
  activeStrength,
  advanceGrowth,
  buyReinforcement,
  canPrestige,
  createInitialState,
  lineageDepth,
  pickBloodlineTrait,
  prestige,
  REINFORCEMENT_COST,
  slipMultiplier,
  startMission,
  startPair,
  tick,
  type BranchSlug,
  type Soldier,
} from './sim';
import { clearSave, loadBundle, normalizeGameState, saveBundle } from './storage';
import { soldierActivity } from './visuals';
import type { WorldEntity } from './world-map';

const BRIEF_KEY = 'mustermill-brief-seen-v1';
const TIP_INTERVAL_MS = 18_000;

let branchSlug: BranchSlug = DEFAULT_BRANCH as BranchSlug;
let demoUnlock = new URLSearchParams(location.search).get('demo') !== '0';
let activeSkin: BranchSkin = getBranchSkin(branchSlug);
const state: { current: ReturnType<typeof createInitialState> } = { current: createInitialState() };
let selected = new Set<number>();
let lastTick = Date.now();
let lastSaveAt = 0;
let lastTipAt = 0;
let animFrame = 0;
let toastTimer: ReturnType<typeof setTimeout> | null = null;
let prevSoldierCount = 0;
let prevSlips = 0;
let prevMissionEnd: number | null = null;
let currentTip = '';
const worldEntities = new Map<number, WorldEntity>();

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const toast = document.getElementById('toast')!;
const skinMenu = document.getElementById('skin-menu') as HTMLDialogElement;
const branchPicker = document.getElementById('branch-picker')!;
const demoUnlockEl = document.getElementById('demo-unlock') as HTMLInputElement;
const safetyBrief = document.getElementById('safety-brief') as HTMLDialogElement;
const briefLines = document.getElementById('brief-lines')!;
const briefDisclaimer = document.getElementById('brief-disclaimer')!;

function showToast(message: string, ms = 4000): void {
  toast.textContent = message;
  toast.classList.remove('hidden');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), ms);
}

function viewSoldiers(): GameViewSoldier[] {
  return state.current.soldiers.map((s) => ({
    id: s.id,
    branch: s.branch,
    stage: s.stage,
    activity: soldierActivity(s, state.current),
    name: s.name,
    selectable: s.stage === 'specialist' && !s.onMission && !s.pairedUntil,
  }));
}

function buildViewState(): GameViewState {
  const s = state.current;
  const deployCheck = canPrestige(s);
  const onMission = !!(s.missionEndsAt && Date.now() < s.missionEndsAt);
  const missionLeft = onMission ? Math.ceil((s.missionEndsAt! - Date.now()) / 1000) : null;

  const buttons = defaultButtons({
    skins: true,
    muster: selected.size === 2,
    kp: !onMission,
    reinforce: s.slips >= REINFORCEMENT_COST && s.soldiers.length < 10,
    deploy: deployCheck.ok,
    reset: true,
  });

  const manualOn = isBranchUnlocked(branchSlug, demoUnlock) && branchSlug !== 'ocp';
  if (!currentTip) currentTip = randomTip(branchSlug, manualOn);

  return {
    soldiers: viewSoldiers(),
    selected: new Set(selected),
    frame: animFrame,
    stats: {
      strength: activeStrength(s),
      slips: Math.floor(s.slips),
      lineage: lineageDepth(s),
      deploys: s.deployments,
      slipPct: Math.round((slipMultiplier(s) - 1) * 100),
    },
    tip: currentTip,
    title: `MusterMill · ${activeSkin.label}`,
    subtitle: activeSkin.subtitle,
    buttons,
    missionLeft,
    deployReady: deployCheck.ok,
  };
}

function renderBranchPicker(): void {
  branchPicker.innerHTML = '';
  for (const skin of listBranchSkins()) {
    const btn = document.createElement('button');
    btn.type = 'button';
    const locked = !isBranchUnlocked(skin.slug, demoUnlock);
    btn.className =
      'branch-chip' +
      (skin.slug === branchSlug ? ' active' : '') +
      (locked ? ' locked' : '');
    btn.textContent = `${skin.mascot_emoji} ${skin.short_label || skin.label}`;
    btn.addEventListener('click', () => {
      if (locked) {
        showToast(premiumCta(), 5000);
        return;
      }
      branchSlug = skin.slug as BranchSlug;
      activeSkin = applyBranchTheme(branchSlug);
      renderBranchPicker();
      persistSoon();
    });
    branchPicker.appendChild(btn);
  }
}

function persistSoon(): void {
  const now = Date.now();
  if (now - lastSaveAt < 2500) return;
  lastSaveAt = now;
  saveBundle({ game: state.current, branchSlug, demoUnlock, savedAt: now });
}

function detectEvents(): void {
  const s = state.current;
  const strength = activeStrength(s);
  const slips = Math.floor(s.slips);
  if (strength > prevSoldierCount && prevSoldierCount > 0) showToast(birthMessage(branchSlug));
  if (slips > prevSlips && prevMissionEnd !== null && s.missionEndsAt === null) {
    showToast(missionCompleteMessage(branchSlug));
  }
  prevSlips = slips;
  prevMissionEnd = s.missionEndsAt;
  prevSoldierCount = strength;
}

function tapSoldier(id: number): void {
  const soldier = state.current.soldiers.find((x) => x.id === id);
  if (!soldier) return;
  if (soldier.stage !== 'specialist' || soldier.onMission || soldier.pairedUntil) {
    showToast(`${soldier.name} is busy — ${soldier.stage}`);
    return;
  }
  if (selected.has(id)) selected.delete(id);
  else {
    if (selected.size >= 2) selected.clear();
    selected.add(id);
  }
}

function handleAction(action: HudAction): void {
  switch (action) {
    case 'skins':
      renderBranchPicker();
      skinMenu.showModal();
      break;
    case 'muster': {
      const ids = [...selected];
      if (ids.length !== 2) {
        showToast('Tap two specialists on the base.');
        return;
      }
      state.current = startPair(state.current, ids[0]!, ids[1]!, branchSlug);
      selected.clear();
      showToast(pairStartMessage(branchSlug));
      persistSoon();
      break;
    }
    case 'kp': {
      const before = state.current.missionSoldierIds.length;
      state.current = startMission(state.current);
      const sent = state.current.missionSoldierIds.length;
      if (sent > 0) showToast(`${sent} sent to mess hall.`);
      else if (!before) showToast('Nobody available for KP.');
      persistSoon();
      break;
    }
    case 'reinforce':
      if (state.current.slips < REINFORCEMENT_COST) {
        showToast(`Need ${REINFORCEMENT_COST} slips.`);
        return;
      }
      state.current = buyReinforcement(state.current, branchSlug);
      showToast(`Reinforcement arrived (${REINFORCEMENT_COST} slips).`);
      persistSoon();
      break;
    case 'deploy': {
      const check = canPrestige(state.current);
      if (!check.ok) {
        showToast(check.reason);
        return;
      }
      const trait = pickBloodlineTrait(state.current);
      if (!confirm(`Deploy battalion?\n\nReset roster. Keep ${trait} at 50%.\n+10% slip bonus.`)) return;
      state.current = prestige(state.current, branchSlug);
      selected.clear();
      worldEntities.clear();
      showToast(deploymentMessage());
      persistSoon();
      break;
    }
    case 'reset':
      if (!confirm('Reset save?')) return;
      clearSave();
      localStorage.removeItem(BRIEF_KEY);
      state.current = createInitialState();
      selected.clear();
      worldEntities.clear();
      branchSlug = DEFAULT_BRANCH as BranchSlug;
      activeSkin = applyBranchTheme(branchSlug);
      showSafetyBrief();
      break;
  }
}

function onCanvasPointer(clientX: number, clientY: number): void {
  const { x, y } = canvasCoords(canvas, clientX, clientY);
  const vs = buildViewState();
  const hudHit = hitTestHudButton(vs.buttons, x, y);
  if (hudHit) {
    handleAction(hudHit);
    return;
  }
  const soldierId = hitTestSoldier(worldEntities, vs.soldiers, x, y);
  if (soldierId !== null) tapSoldier(soldierId);
}

canvas.addEventListener('click', (e) => onCanvasPointer(e.clientX, e.clientY));
canvas.addEventListener(
  'touchstart',
  (e) => {
    e.preventDefault();
    const t = e.touches[0];
    if (t) onCanvasPointer(t.clientX, t.clientY);
  },
  { passive: false },
);

demoUnlockEl.addEventListener('change', () => {
  demoUnlock = demoUnlockEl.checked;
  if (!demoUnlock && getBranchSkin(branchSlug).premium) {
    branchSlug = DEFAULT_BRANCH as BranchSlug;
    activeSkin = applyBranchTheme(branchSlug);
  }
  renderBranchPicker();
  persistSoon();
});

function showSafetyBrief(): void {
  if (localStorage.getItem(BRIEF_KEY)) return;
  briefLines.innerHTML = getSafetyBriefLines().map((l) => `<li>${l}</li>`).join('');
  briefDisclaimer.textContent = getDisclaimer();
  safetyBrief.showModal();
  safetyBrief.addEventListener('close', () => localStorage.setItem(BRIEF_KEY, '1'), { once: true });
}

function boot(): void {
  demoUnlockEl.checked = demoUnlock;
  const saved = loadBundle();
  if (saved) {
    branchSlug = (saved.branchSlug as BranchSlug) ?? DEFAULT_BRANCH;
    demoUnlock = saved.demoUnlock ?? demoUnlock;
    demoUnlockEl.checked = demoUnlock;
    state.current = normalizeGameState({
      ...saved.game,
      heritageBranch: (saved.game.heritageBranch as BranchSlug) ?? branchSlug,
      soldiers: saved.game.soldiers.map((s) => ({
        ...s,
        branch: (s as Soldier).branch ?? branchSlug,
      })),
    });
  }
  activeSkin = applyBranchTheme(branchSlug);
  prevSoldierCount = activeStrength(state.current);
  prevSlips = Math.floor(state.current.slips);
  prevMissionEnd = state.current.missionEndsAt;
  showSafetyBrief();
}

function gameLoop(): void {
  const now = Date.now();
  const delta = now - lastTick;
  lastTick = now;
  animFrame += 1;

  state.current = advanceGrowth(state.current, delta);
  state.current = tick(state.current, now);
  detectEvents();

  const vs = buildViewState();
  updateWorldEntities(worldEntities, vs.soldiers, animFrame);
  drawGameFrame(canvas, vs, worldEntities);

  if (now - lastTipAt > TIP_INTERVAL_MS) {
    const manualOn = isBranchUnlocked(branchSlug, demoUnlock) && branchSlug !== 'ocp';
    currentTip = randomTip(branchSlug, manualOn);
    lastTipAt = now;
  }
  if (animFrame % 120 === 0) persistSoon();

  requestAnimationFrame(gameLoop);
}

boot();
requestAnimationFrame(gameLoop);
