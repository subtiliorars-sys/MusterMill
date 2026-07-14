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
  hitTestBuilding,
  hitTestHudButton,
  hitTestSoldier,
  updateWorldEntities,
  type GameViewSoldier,
  type GameViewState,
  type HudAction,
  type WorldVignette,
} from './game-view';
import {
  activeStrength,
  advanceGrowth,
  buyReinforcement,
  canPrestige,
  createInitialState,
  estimateKpPayout,
  kpEligibleSoldiers,
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
import { computeUiUnlocks, hudVisibility, normalizeUiProgress, withUiProgress } from './ui-unlocks';
import type { BuildingHit, WorldEntity } from './world-map';
import { ZONES } from './world-map';

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
let prevLineage = 0;
let currentTip = '';
const worldEntities = new Map<number, WorldEntity>();
const vignettes: WorldVignette[] = [];
const VIGNETTE_MAX_AGE = 120;
const DEPLOY_VIGNETTE_MAX_AGE = 160;

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
  const unlocks = computeUiUnlocks(s);
  const visible = hudVisibility(unlocks);

  const buttons = defaultButtons(
    {
      skins: true,
      muster: selected.size === 2,
      kp: unlocks.kp && !onMission,
      reinforce: unlocks.reinforce && s.slips >= REINFORCEMENT_COST && s.soldiers.length < 10,
      deploy: unlocks.deploy && deployCheck.ok,
      reset: true,
    },
    visible,
  );

  const manualOn = isBranchUnlocked(branchSlug, demoUnlock) && branchSlug !== 'ocp';
  if (!currentTip) currentTip = randomTip(branchSlug, manualOn);

  const kpHeadcount = onMission
    ? s.missionSoldierIds.length
    : kpEligibleSoldiers(s).length;
  const slips = Math.floor(s.slips);

  return {
    soldiers: viewSoldiers(),
    selected: new Set(selected),
    frame: animFrame,
    stats: {
      strength: activeStrength(s),
      slips,
      lineage: lineageDepth(s),
      deploys: s.deployments,
      slipPct: Math.round((slipMultiplier(s) - 1) * 100),
    },
    economics: {
      kpPayout: estimateKpPayout(s),
      kpHeadcount,
      reinforceCost: REINFORCEMENT_COST,
      reinforceProgress: Math.min(1, slips / REINFORCEMENT_COST),
    },
    tip: currentTip,
    title: `MusterMill · ${activeSkin.label}`,
    subtitle: activeSkin.subtitle,
    buttons,
    missionLeft,
    deployReady: deployCheck.ok,
    kpActive: onMission,
    unlocks,
    vignettes: vignettes.map((v) => ({ ...v })),
  };
}

function spawnConfetti(): void {
  const colors = ['#d4a017', '#e94560', '#87ceeb', '#9ab878', '#c4b581'];
  for (let i = 0; i < 14; i++) {
    vignettes.push({
      kind: 'confetti',
      x: 40 + i * 30,
      y: 50 + (i % 4) * 6,
      age: i * 2,
      color: colors[i % colors.length]!,
    });
  }
}

function spawnDeployCeremony(trait: string): void {
  const pad = ZONES.find((z) => z.id === 'deploy_pad');
  vignettes.push({
    kind: 'deploy_ceremony',
    x: pad?.x ?? 430,
    y: pad?.y ?? 235,
    age: 0,
    label: trait,
  });
}

function spawnMusterVignette(): void {
  const heritage = ZONES.find((z) => z.id === 'heritage_muster');
  vignettes.push({
    kind: 'muster_duffel',
    x: heritage?.x ?? 268,
    y: (heritage?.y ?? 138) - 8,
    age: 0,
  });
}

function tickVignettes(): void {
  for (let i = vignettes.length - 1; i >= 0; i--) {
    vignettes[i]!.age += 1;
    const max = vignettes[i]!.kind === 'deploy_ceremony' ? DEPLOY_VIGNETTE_MAX_AGE : VIGNETTE_MAX_AGE;
    if (vignettes[i]!.age > max) vignettes.splice(i, 1);
  }
}

function markMilestone(id: string, message: string): void {
  const seen = state.current.milestonesSeen ?? [];
  if (seen.includes(id)) return;
  state.current = { ...state.current, milestonesSeen: [...seen, id] };
  showToast(message, 5000);
  spawnConfetti();
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
  const lineage = lineageDepth(s);
  const unlocksBefore = computeUiUnlocks(s);

  if (strength > prevSoldierCount && prevSoldierCount > 0) {
    const newest = s.soldiers.reduce((a, b) => (b.id > a.id ? b : a));
    if (newest.stage === 'recruit') {
      const prog = normalizeUiProgress(s);
      state.current = withUiProgress(s, { pairsCompleted: prog.pairsCompleted + 1 });
      showToast(birthMessage(branchSlug));
      if (computeUiUnlocks(state.current).kp && !unlocksBefore.kp) {
        showToast('KP DUTY unlocked — tap Mess Hall.');
      }
    }
  }

  if (slips > prevSlips && prevMissionEnd !== null && s.missionEndsAt === null) {
    const prog = normalizeUiProgress(state.current);
    state.current = withUiProgress(state.current, { kpRunsCompleted: prog.kpRunsCompleted + 1 });
    showToast(missionCompleteMessage(branchSlug));
    if (computeUiUnlocks(state.current).reinforce && !unlocksBefore.reinforce) {
      showToast('+REC unlocked — hoard 40 slips.');
    }
  }

  if (lineage >= 3 && prevLineage < 3) {
    showToast('DEPLOY PAD unlocked at generation 3.');
  }

  if (lineage >= 3) markMilestone('gen3', 'Milestone: Generation 3 lineage.');
  if (strength >= 10) markMilestone('roster10', 'Milestone: Full roster (10 soldiers).');
  if (s.deployments >= 1) markMilestone('first_deploy', 'Milestone: First deployment complete.');

  prevSlips = slips;
  prevMissionEnd = s.missionEndsAt;
  prevSoldierCount = strength;
  prevLineage = lineage;
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
      spawnMusterVignette();
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
      spawnDeployCeremony(trait);
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

function handleBuilding(building: BuildingHit): void {
  const unlocks = computeUiUnlocks(state.current);
  switch (building.action) {
    case 'muster':
      if (selected.size !== 2) {
        showToast('Select two specialists, then tap Heritage or MUSTER.');
        return;
      }
      handleAction('muster');
      break;
    case 'kp':
      if (!unlocks.kp) {
        showToast('Complete a Legacy Muster first.');
        return;
      }
      handleAction('kp');
      break;
    case 'deploy':
      if (!unlocks.deploy) {
        showToast('Reach generation 3 to unlock Deploy Pad.');
        return;
      }
      handleAction('deploy');
      break;
    case 'hint':
      if (building.hint) showToast(building.hint);
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
  const building = hitTestBuilding(x, y);
  if (building) {
    handleBuilding(building);
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

function showAwayRecap(savedAt: number): void {
  const away = Date.now() - savedAt;
  if (away < 60_000) return;
  const mins = Math.floor(away / 60_000);
  const label = mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h`;
  setTimeout(
    () => showToast(`While away (${label}): battalion held position. +0 slips (no passive KP).`, 5500),
    900,
  );
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
    showAwayRecap(saved.savedAt);
  } else {
    setTimeout(
      () => showToast('Tap two specialists on the base, then MUSTER.', 6000),
      1400,
    );
  }
  activeSkin = applyBranchTheme(branchSlug);
  prevSoldierCount = activeStrength(state.current);
  prevSlips = Math.floor(state.current.slips);
  prevMissionEnd = state.current.missionEndsAt;
  prevLineage = lineageDepth(state.current);
  showSafetyBrief();
}

function gameLoop(): void {
  const now = Date.now();
  const delta = now - lastTick;
  lastTick = now;
  animFrame += 1;
  tickVignettes();

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
