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
  deploymentReadyMessage,
  getDisclaimer,
  getSafetyBriefLines,
  missionCompleteMessage,
  pairStartMessage,
  premiumCta,
  randomTip,
} from './flavor';
import { clearSave, loadBundle, normalizeGameState, saveBundle } from './storage';
import {
  activeStrength,
  advanceGrowth,
  buyReinforcement,
  canPrestige,
  createInitialState,
  lineageDepth,
  prestige,
  pickBloodlineTrait,
  REINFORCEMENT_COST,
  slipMultiplier,
  startMission,
  startPair,
  tick,
  type BranchSlug,
  type GameState,
  type Soldier,
} from './sim';

const BRIEF_KEY = 'mustermill-brief-seen-v1';
const TIP_INTERVAL_MS = 18_000;

let branchSlug: BranchSlug = DEFAULT_BRANCH as BranchSlug;
let demoUnlock = new URLSearchParams(location.search).get('demo') !== '0';
let activeSkin: BranchSkin = getBranchSkin(branchSlug);
const state: { current: GameState } = { current: createInitialState() };
let selected = new Set<number>();
let lastTick = Date.now();
let lastSaveAt = 0;
let lastRenderAt = 0;
let lastTipAt = 0;
let toastTimer: ReturnType<typeof setTimeout> | null = null;
let prevStrength = 0;
let prevSlips = 0;
let prevMissionEnd: number | null = null;
let prevSoldierCount = 0;

const els = {
  title: document.getElementById('title')!,
  tagline: document.getElementById('tagline')!,
  strength: document.getElementById('strength')!,
  slips: document.getElementById('slips')!,
  lineage: document.getElementById('lineage')!,
  deployments: document.getElementById('deployments')!,
  deployBtn: document.getElementById('deploy-btn') as HTMLButtonElement,
  deployStatus: document.getElementById('deploy-status')!,
  roster: document.getElementById('roster')!,
  pairBtn: document.getElementById('pair-btn') as HTMLButtonElement,
  reinforceBtn: document.getElementById('reinforce-btn') as HTMLButtonElement,
  missionBtn: document.getElementById('mission-btn') as HTMLButtonElement,
  missionStatus: document.getElementById('mission-status')!,
  branchPicker: document.getElementById('branch-picker')!,
  demoUnlock: document.getElementById('demo-unlock') as HTMLInputElement,
  resetBtn: document.getElementById('reset-btn') as HTMLButtonElement,
  saveStatus: document.getElementById('save-status')!,
  toast: document.getElementById('toast')!,
  fieldTip: document.getElementById('field-tip')!,
  disclaimerText: document.getElementById('disclaimer-text')!,
  safetyBrief: document.getElementById('safety-brief') as HTMLDialogElement,
  briefLines: document.getElementById('brief-lines')!,
  briefDisclaimer: document.getElementById('brief-disclaimer')!,
};

function mascotFor(soldier: Soldier): string {
  return getBranchSkin(soldier.branch).mascot_emoji;
}

function stageLabel(s: Soldier): string {
  if (s.pairedUntil) return 'mustering…';
  if (s.onMission) return 'KP duty';
  return s.stage;
}

function growthPct(s: Soldier): number {
  if (s.stage === 'specialist') return 100;
  return Math.round(s.growthProgress * 100);
}

function truncateTraits(traits: string[]): string {
  return traits.join(' · ');
}

function showToast(message: string, ms = 4500): void {
  els.toast.textContent = message;
  els.toast.classList.remove('hidden');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.add('hidden'), ms);
}

function rotateTip(): void {
  const manualOn = isBranchUnlocked(branchSlug, demoUnlock) && branchSlug !== 'ocp';
  els.fieldTip.textContent = `📋 ${randomTip(branchSlug, manualOn)}`;
  lastTipAt = Date.now();
}

function renderBranchPicker(): void {
  els.branchPicker.innerHTML = '';
  for (const skin of listBranchSkins()) {
    const btn = document.createElement('button');
    btn.type = 'button';
    const locked = !isBranchUnlocked(skin.slug, demoUnlock);
    btn.className =
      'branch-chip' +
      (skin.slug === branchSlug ? ' active' : '') +
      (locked ? ' locked' : '') +
      (skin.premium ? ' premium' : '');
    const label = skin.short_label || skin.label;
    btn.innerHTML = `
      <span class="chip-emoji">${skin.mascot_emoji}</span>
      <span class="chip-label" title="${skin.label}">${label}</span>
      ${skin.premium ? '<span class="chip-badge">Pack</span>' : '<span class="chip-badge free">Free</span>'}
    `;
    btn.title = locked ? `${skin.subtitle} — ${premiumCta()}` : skin.subtitle;
    btn.addEventListener('click', () => {
      if (!isBranchUnlocked(skin.slug, demoUnlock)) {
        showToast(premiumCta(), 6000);
        return;
      }
      branchSlug = skin.slug as BranchSlug;
      activeSkin = applyBranchTheme(branchSlug);
      els.title.textContent = `MusterMill · ${activeSkin.label}`;
      els.tagline.textContent = activeSkin.subtitle;
      rotateTip();
      renderBranchPicker();
      persistSoon();
    });
    els.branchPicker.appendChild(btn);
  }
}

function render(): void {
  const s = state.current;
  els.strength.textContent = String(activeStrength(s));
  els.slips.textContent = String(Math.floor(s.slips));
  els.lineage.textContent = String(lineageDepth(s));
  els.deployments.textContent = String(s.deployments);

  const deployCheck = canPrestige(s);
  const mult = Math.round(slipMultiplier(s) * 100);
  const parts: string[] = [`Slip bonus ${mult}%`];
  if (s.bloodlineTrait) {
    parts.push(`${s.bloodlineTrait} @ ${Math.round(s.bloodlineStrength * 100)}%`);
  }
  parts.push(deployCheck.ok ? deploymentReadyMessage() : deployCheck.reason);
  els.deployStatus.textContent = parts.join(' · ');
  els.deployBtn.disabled = !deployCheck.ok;
  els.deployBtn.title = deployCheck.reason;

  els.roster.innerHTML = '';
  for (const soldier of s.soldiers) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'soldier' + (selected.has(soldier.id) ? ' selected' : '');
    card.disabled = soldier.stage !== 'specialist' || !!soldier.onMission || !!soldier.pairedUntil;
    const pct = growthPct(soldier);
    const traits = truncateTraits(soldier.traits);
    card.innerHTML = `
      <span class="emoji">${mascotFor(soldier)}</span>
      <span class="name" title="${soldier.name}">${soldier.name}</span>
      <span class="stage">${stageLabel(soldier)}</span>
      <span class="growth" aria-hidden="true"><span style="width:${pct}%"></span></span>
      <span class="traits" title="${traits}">${traits}</span>
      <span class="gen">Gen ${soldier.generation}</span>
    `;
    card.addEventListener('click', () => {
      if (selected.has(soldier.id)) selected.delete(soldier.id);
      else {
        if (selected.size >= 2) selected.clear();
        selected.add(soldier.id);
      }
      updateActionButtons();
      render();
    });
    els.roster.appendChild(card);
  }

  if (s.missionEndsAt && Date.now() < s.missionEndsAt) {
    const left = Math.ceil((s.missionEndsAt - Date.now()) / 1000);
    els.missionStatus.textContent = `${s.missionSoldierIds.length} on KP — ${left}s left`;
    els.missionBtn.disabled = true;
  } else {
    els.missionStatus.textContent =
      s.slips > 0 ? 'KP complete — slips in treasury.' : 'Send adults to earn muster slips.';
    els.missionBtn.disabled = false;
  }

  updateActionButtons();
}

function updateActionButtons(): void {
  const ids = [...selected];
  els.pairBtn.disabled = ids.length !== 2;
  els.reinforceBtn.disabled =
    state.current.slips < REINFORCEMENT_COST || state.current.soldiers.length >= 10;
}

function persistSoon(): void {
  const now = Date.now();
  if (now - lastSaveAt < 2500) return;
  lastSaveAt = now;
  saveBundle({
    game: state.current,
    branchSlug,
    demoUnlock,
    savedAt: now,
  });
  els.saveStatus.textContent = 'Saved';
}

function detectEvents(): void {
  const s = state.current;
  const strength = activeStrength(s);
  const slips = Math.floor(s.slips);

  if (strength > prevSoldierCount && prevSoldierCount > 0) {
    showToast(birthMessage(branchSlug));
  }
  if (slips > prevSlips && prevMissionEnd !== null && s.missionEndsAt === null) {
    showToast(missionCompleteMessage(branchSlug));
  }

  prevStrength = strength;
  prevSlips = slips;
  prevMissionEnd = s.missionEndsAt;
  prevSoldierCount = strength;
}

function showSafetyBrief(): void {
  if (localStorage.getItem(BRIEF_KEY)) return;
  els.briefLines.innerHTML = getSafetyBriefLines().map((l) => `<li>${l}</li>`).join('');
  els.briefDisclaimer.textContent = getDisclaimer();
  els.safetyBrief.showModal();
  els.safetyBrief.addEventListener(
    'close',
    () => {
      localStorage.setItem(BRIEF_KEY, '1');
    },
    { once: true },
  );
}

function boot(): void {
  els.disclaimerText.textContent = getDisclaimer();
  els.demoUnlock.checked = demoUnlock;

  const saved = loadBundle();
  if (saved) {
    branchSlug = (saved.branchSlug as BranchSlug) ?? (DEFAULT_BRANCH as BranchSlug);
    demoUnlock = saved.demoUnlock ?? demoUnlock;
    els.demoUnlock.checked = demoUnlock;
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
  els.title.textContent = `MusterMill · ${activeSkin.label}`;
  els.tagline.textContent = activeSkin.subtitle;
  renderBranchPicker();
  rotateTip();
  updateActionButtons();
  render();

  prevStrength = activeStrength(state.current);
  prevSlips = Math.floor(state.current.slips);
  prevMissionEnd = state.current.missionEndsAt;
  prevSoldierCount = prevStrength;

  showSafetyBrief();
}

els.pairBtn.addEventListener('click', () => {
  const ids = [...selected];
  if (ids.length !== 2) return;
  state.current = startPair(state.current, ids[0]!, ids[1]!, branchSlug);
  selected.clear();
  showToast(pairStartMessage(branchSlug));
  updateActionButtons();
  render();
  persistSoon();
});

els.reinforceBtn.addEventListener('click', () => {
  state.current = buyReinforcement(state.current, branchSlug);
  showToast(`Reinforcement mustered — ${REINFORCEMENT_COST} slips spent.`);
  render();
  persistSoon();
});

els.missionBtn.addEventListener('click', () => {
  const before = state.current.missionSoldierIds.length;
  state.current = startMission(state.current);
  const sent = state.current.missionSoldierIds.length;
  if (sent > 0) {
    showToast(`${sent} soldier${sent === 1 ? '' : 's'} sent to KP. Mess hall awaits.`);
  } else if (before === 0) {
    showToast('No available adults — wait for growth or finish muster.');
  }
  render();
  persistSoon();
});

els.deployBtn.addEventListener('click', () => {
  const check = canPrestige(state.current);
  if (!check.ok) {
    showToast(check.reason);
    return;
  }
  const trait = pickBloodlineTrait(state.current);
  if (
    !confirm(
      `Deploy battalion?\n\nReset all soldiers and slips.\nKeep bloodline trait at 50%.\n+10% permanent slip bonus.\n\nNext carry: ${trait}`,
    )
  ) {
    return;
  }
  state.current = prestige(state.current, branchSlug);
  selected.clear();
  showToast(deploymentMessage());
  rotateTip();
  render();
  persistSoon();
});

els.demoUnlock.addEventListener('change', () => {
  demoUnlock = els.demoUnlock.checked;
  renderBranchPicker();
  if (!demoUnlock && getBranchSkin(branchSlug).premium) {
    branchSlug = DEFAULT_BRANCH as BranchSlug;
    activeSkin = applyBranchTheme(branchSlug);
    els.title.textContent = `MusterMill · ${activeSkin.label}`;
    els.tagline.textContent = activeSkin.subtitle;
  }
  persistSoon();
});

els.resetBtn.addEventListener('click', () => {
  if (!confirm('Reset battalion and clear save?')) return;
  clearSave();
  localStorage.removeItem(BRIEF_KEY);
  state.current = createInitialState();
  branchSlug = DEFAULT_BRANCH as BranchSlug;
  selected.clear();
  activeSkin = applyBranchTheme(branchSlug);
  els.title.textContent = `MusterMill · ${activeSkin.label}`;
  els.tagline.textContent = activeSkin.subtitle;
  renderBranchPicker();
  rotateTip();
  render();
  els.saveStatus.textContent = 'Cleared';
  showSafetyBrief();
});

function needsRender(now: number): boolean {
  const s = state.current;
  if (now - lastRenderAt > 400) return true;
  if (s.missionEndsAt && now < s.missionEndsAt) return true;
  return s.soldiers.some((x) => x.pairedUntil || (x.stage !== 'specialist' && !x.onMission));
}

function gameLoop(): void {
  const now = Date.now();
  const delta = now - lastTick;
  lastTick = now;

  state.current = advanceGrowth(state.current, delta);
  state.current = tick(state.current, now);
  detectEvents();

  if (needsRender(now)) {
    render();
    lastRenderAt = now;
    persistSoon();
  }

  if (now - lastTipAt > TIP_INTERVAL_MS) rotateTip();

  requestAnimationFrame(gameLoop);
}

boot();
requestAnimationFrame(gameLoop);
