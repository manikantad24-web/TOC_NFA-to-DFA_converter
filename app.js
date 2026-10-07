// ══════════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════════
let nfa = { states: [], alphabet: [], start: '', finals: new Set(), transitions: {} };
let dfa = { states: [], alphabet: [], start: '', finals: new Set(), transitions: {}, stateMap: {} };
let minDFA = { states: [], alphabet: [], start: '', finals: new Set(), transitions: {} };
let conversionSteps = [];
let currentStep = 0;
let autoTimer = null;
let animSpeed = 700;
let activeTab = 'nfa';
let activeMiniTab = 'log';
let startTime = 0;
let timerInterval = null;
let simData = { steps: [], pos: 0, active: false };
let canvasHighlight = { dfaState: null, edge: null };
const STORAGE_KEYS = {
  theme: 'nfa-dfa-theme',
  currentNFA: 'nfa-dfa-current',
  recent: 'nfa-dfa-recent'
};
const isMacOS = navigator.platform.toLowerCase().includes('mac') || navigator.userAgent.includes('Mac');

// ══════════════════════════════════════════════════
// CANVAS
// ══════════════════════════════════════════════════
const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');
let nodes = [];
let edges = [];

function resizeCanvas() {
  const rect = canvas.parentElement.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.round(rect.width * dpr));
  canvas.height = Math.max(1, Math.round(rect.height * dpr));
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawGraph();
}
window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', resizeCanvas);

function getCanvasSize() {
  return { w: canvas.width / devicePixelRatio, h: canvas.height / devicePixelRatio };
}

function layoutNodes(states, cx, cy, radius) {
  const n = states.length;
  if (n === 0) return [];
  if (n === 1) return [{ id: states[0], x: cx, y: cy }];
  return states.map((s, i) => ({
    id: s,
    x: cx + radius * Math.cos(2 * Math.PI * i / n - Math.PI / 2),
    y: cy + radius * Math.sin(2 * Math.PI * i / n - Math.PI / 2)
  }));
}

function buildNFAGraph() {
  const { w, h } = getCanvasSize();
  const cx = w / 2, cy = h / 2;
  const radius = Math.min(w, h) * 0.32;
  nodes = layoutNodes(nfa.states, cx, cy, radius).map(n => ({
    ...n,
    label: n.id,
    isFinal: nfa.finals.has(n.id),
    isStart: n.id === nfa.start,
    type: 'nfa'
  }));
  edges = buildEdges(nfa.transitions, nfa.states);
}

function buildDFAGraph() {
  const { w, h } = getCanvasSize();
  const cx = w / 2, cy = h / 2;
  const radius = Math.min(w, h) * 0.32;
  const states = dfa.states;
  nodes = layoutNodes(states, cx, cy, radius).map((n, i) => ({
    ...n,
    label: 'D' + i,
    fullLabel: '{' + (dfa.stateMap[n.id] || n.id).replace(/,/g, ',') + '}',
    isFinal: dfa.finals.has(n.id),
    isStart: n.id === dfa.start,
    type: 'dfa'
  }));
  edges = buildEdgesForDFA();
}

function buildMinDFAGraph() {
  const { w, h } = getCanvasSize();
  const cx = w / 2, cy = h / 2;
  const radius = Math.min(w, h) * 0.32;
  nodes = layoutNodes(minDFA.states, cx, cy, radius).map((n, i) => ({
    ...n,
    label: 'M' + i,
    isFinal: minDFA.finals.has(n.id),
    isStart: n.id === minDFA.start,
    type: 'min'
  }));
  edges = buildEdgesForMin();
}

function buildEdges(transitions, states) {
  const edgeMap = {};
  for (const state of states) {
    const t = transitions[state] || {};
    for (const sym in t) {
      const targets = t[sym];
      for (const target of targets) {
        const key = state + '|' + target;
        if (!edgeMap[key]) edgeMap[key] = { from: state, to: target, labels: [] };
        edgeMap[key].labels.push(sym);
      }
    }
  }
  const edges = Object.values(edgeMap).map(e => ({
    from: e.from, to: e.to,
    label: e.labels.join(','),
    selfLoop: e.from === e.to,
    curve: 0
  }));
  const pairSet = new Set(edges.map(e => e.from + '|' + e.to));
  for (const e of edges) {
    if (!e.selfLoop && pairSet.has(e.to + '|' + e.from)) {
      e.curve = 38;
    }
  }
  return edges;
}

function buildEdgesForDFA() {
  const edgeMap = {};
  for (const state of dfa.states) {
    const t = dfa.transitions[state] || {};
    for (const sym in t) {
      const target = t[sym];
      if (!target) continue;
      const key = state + '|' + target;
      if (!edgeMap[key]) edgeMap[key] = { from: state, to: target, labels: [] };
      edgeMap[key].labels.push(sym);
    }
  }
  const edges = Object.values(edgeMap).map(e => ({
    from: e.from, to: e.to,
    label: e.labels.join(','),
    selfLoop: e.from === e.to,
    curve: 0
  }));
  const pairSet = new Set(edges.map(e => e.from + '|' + e.to));
  for (const e of edges) {
    if (!e.selfLoop && pairSet.has(e.to + '|' + e.from)) {
      e.curve = 38;
    }
  }
  return edges;
}

function buildEdgesForMin() {
  const edgeMap = {};
  for (const state of minDFA.states) {
    const t = minDFA.transitions[state] || {};
    for (const sym in t) {
      const target = t[sym];
      if (!target) continue;
      const key = state + '|' + target;
      if (!edgeMap[key]) edgeMap[key] = { from: state, to: target, labels: [] };
      edgeMap[key].labels.push(sym);
    }
  }
  const edges = Object.values(edgeMap).map(e => ({
    from: e.from, to: e.to,
    label: e.labels.join(','),
    selfLoop: e.from === e.to,
    curve: 0
  }));
  const pairSet = new Set(edges.map(e => e.from + '|' + e.to));
  for (const e of edges) {
    if (!e.selfLoop && pairSet.has(e.to + '|' + e.from)) {
      e.curve = 38;
    }
  }
  return edges;
}

function getNodePos(id) {
  return nodes.find(n => n.id === id);
}

function drawArrow(x1, y1, x2, y2, label, color, curve, highlight) {
  const r = 24;
  ctx.save();
  ctx.strokeStyle = highlight ? '#fff' : color;
  ctx.lineWidth = highlight ? 2 : 1.2;
  ctx.setLineDash([]);

  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / len, uy = dy / len;

  const sx = x1 + ux * r, sy = y1 + uy * r;
  const ex = x2 - ux * r, ey = y2 - uy * r;

  if (curve && Math.abs(curve) > 0) {
    const mx = (sx + ex) / 2, my = (sy + ey) / 2;
    const cpx = mx - uy * curve;
    const cpy = my + ux * curve;

    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(cpx, cpy, ex, ey);
    ctx.stroke();

    const t = 0.97;
    const qx = (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * cpx + t * t * ex;
    const qy = (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * cpy + t * t * ey;
    const angle = Math.atan2(ey - qy, ex - qx);
    ctx.fillStyle = highlight ? '#fff' : color;
    drawArrowHead(ex, ey, angle);

    if (label) {
      const lx = 0.25 * sx + 0.5 * cpx + 0.25 * ex;
      const ly = 0.25 * sy + 0.5 * cpy + 0.25 * ey;
      const offx = lx + (-uy) * 14;
      const offy = ly + ( ux) * 14;
      ctx.fillStyle = highlight ? '#fff' : '#aab';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, offx, offy);
      ctx.textBaseline = 'alphabetic';
    }
  } else {
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();

    const angle = Math.atan2(dy, dx);
    ctx.fillStyle = highlight ? '#fff' : color;
    drawArrowHead(ex, ey, angle);

    if (label) {
      const mx = (sx + ex) / 2, my = (sy + ey) / 2;
      const lx = mx - uy * 14;
      const ly = my + ux * 14;
      ctx.fillStyle = highlight ? '#fff' : '#aab';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, lx, ly);
      ctx.textBaseline = 'alphabetic';
    }
  }
  ctx.restore();
}

function drawArrowHead(x, y, angle) {
  const size = 9;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - size * Math.cos(angle - 0.38), y - size * Math.sin(angle - 0.38));
  ctx.lineTo(x - size * Math.cos(angle + 0.38), y - size * Math.sin(angle + 0.38));
  ctx.closePath();
  ctx.fill();
}

function drawSelfLoop(x, y, label, color, highlight) {
  ctx.save();
  ctx.strokeStyle = highlight ? '#fff' : color;
  ctx.lineWidth = highlight ? 2.2 : 1.5;
  ctx.setLineDash([]);

  const NR = 24;
  const startX = x - NR * 0.55;
  const startY = y - NR * 0.83;
  const endX = x + NR * 0.1;
  const endY = y - NR * 1.0;
  const cp1x = x - NR * 1.5;
  const cp1y = y - NR * 2.4;
  const cp2x = x - NR * 0.3;
  const cp2y = y - NR * 2.6;

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
  ctx.stroke();

  const t = 0.97;
  function bez(t, p0, p1, p2, p3) {
    return (1-t)*(1-t)*(1-t)*p0 + 3*(1-t)*(1-t)*t*p1 + 3*(1-t)*t*t*p2 + t*t*t*p3;
  }
  const nearX = bez(t, startX, cp1x, cp2x, endX);
  const nearY = bez(t, startY, cp1y, cp2y, endY);
  const headAngle = Math.atan2(endY - nearY, endX - nearX);

  ctx.fillStyle = highlight ? '#fff' : color;
  drawArrowHead(endX, endY, headAngle);

  if (label) {
    const peakX = bez(0.5, startX, cp1x, cp2x, endX);
    const peakY = bez(0.5, startY, cp1y, cp2y, endY) - 8;
    ctx.fillStyle = highlight ? '#fff' : '#aab';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, peakX, peakY);
    ctx.textBaseline = 'alphabetic';
  }

  ctx.restore();
}

function getEdgeColor(edge) {
  if (canvasHighlight.edge && canvasHighlight.edge.from === edge.from && canvasHighlight.edge.to === edge.to) return '#fff';
  if (edge.label && edge.label.includes('ε')) return '#7c5fff';
  return '#4f8ef7';
}

function drawGraph() {
  const { w, h } = getCanvasSize();
  ctx.clearRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(42,48,69,0.5)';
  ctx.lineWidth = 0.5;
  const gs = 40;
  for (let x = 0; x < w; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y < h; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

  if (nodes.length === 0) {
    ctx.fillStyle = '#3a4560';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('No graph to display. Build transition table first.', w / 2, h / 2);
    return;
  }

  for (const e of edges) {
    const from = getNodePos(e.from);
    const to = getNodePos(e.to);
    if (!from || !to) continue;
    const isHighlight = canvasHighlight.edge && canvasHighlight.edge.from === e.from && canvasHighlight.edge.to === e.to;
    const color = getEdgeColor(e);
    if (e.selfLoop) {
      drawSelfLoop(from.x, from.y, e.label, color, isHighlight);
    } else {
      drawArrow(from.x, from.y, to.x, to.y, e.label, color, e.curve, isHighlight);
    }
  }

  for (const node of nodes) {
    const isHighlighted = canvasHighlight.dfaState === node.id || canvasHighlight.nfaState === node.id;
    const r = 24;

    if (node.isStart) {
      ctx.strokeStyle = '#3ecf8e';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      ctx.fillStyle = '#3ecf8e';
      ctx.beginPath();
      ctx.moveTo(node.x - r, node.y);
      ctx.lineTo(node.x - r - 22, node.y);
      ctx.stroke();
      drawArrowHead(node.x - r, node.y, 0);
    }

    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
    if (isHighlighted) {
      ctx.fillStyle = '#4f8ef7';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#4f8ef7';
    } else {
      ctx.fillStyle = node.isFinal ? 'rgba(247,169,79,0.15)' : 'rgba(26,30,42,0.9)';
      ctx.shadowBlur = 0;
    }
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = isHighlighted ? '#fff' : (node.isFinal ? '#f7a94f' : (node.isStart ? '#3ecf8e' : '#4f8ef7'));
    ctx.lineWidth = isHighlighted ? 2.5 : 1.5;
    ctx.setLineDash([]);
    ctx.stroke();

    if (node.isFinal) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, r - 4, 0, Math.PI * 2);
      ctx.strokeStyle = isHighlighted ? '#fff' : '#f7a94f';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.fillStyle = isHighlighted ? '#fff' : '#e8ecf5';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.label, node.x, node.y);
  }

  ctx.textBaseline = 'alphabetic';
}

// ══════════════════════════════════════════════════
// NFA LOGIC
// ══════════════════════════════════════════════════
function epsilonClosure(states, transitions) {
  const closure = new Set(states);
  const stack = [...states];
  const steps = [];
  while (stack.length > 0) {
    const s = stack.pop();
    const epsTrans = (transitions[s] || {})['ε'] || [];
    for (const t of epsTrans) {
      if (!closure.has(t)) {
        closure.add(t);
        stack.push(t);
        steps.push({ from: s, to: t });
      }
    }
  }
  return { closure: [...closure].sort(), steps };
}

function move(states, symbol, transitions) {
  const result = new Set();
  for (const s of states) {
    const targets = (transitions[s] || {})[symbol] || [];
    for (const t of targets) result.add(t);
  }
  return [...result].sort();
}

function subsetConstruction(nfa) {
  const { states, alphabet, start, finals, transitions } = nfa;
  const nonEpsAlpha = alphabet.filter(a => a !== 'ε');
  const steps = [];
  const dfaStates = {};
  const dfaTransitions = {};
  const dfaFinals = new Set();
  const worklist = [];
  const visited = new Set();

  const startClosure = epsilonClosure([start], transitions);
  const startKey = startClosure.closure.join(',');
  dfaStates[startKey] = startClosure.closure;
  worklist.push(startClosure.closure);
  const dfaStart = startKey;

  steps.push({
    type: 'init',
    msg: `Initial ε-closure({${start}}) = {${startClosure.closure.join(',')}} → D0`,
    dfaState: startKey,
    nfaStates: startClosure.closure,
    closureSteps: startClosure.steps
  });

  let dfaStateCount = 0;
  const stateNames = { [startKey]: 'D0' };

  while (worklist.length > 0) {
    const current = worklist.shift();
    const currentKey = current.join(',');
    if (visited.has(currentKey)) continue;
    visited.add(currentKey);
    dfaTransitions[currentKey] = {};

    const dname = stateNames[currentKey] || ('D' + (++dfaStateCount));
    stateNames[currentKey] = dname;

    if (current.some(s => finals.has(s))) {
      dfaFinals.add(currentKey);
      steps.push({ type: 'final', msg: `${dname} = {${current.join(',')}} is a FINAL state (contains NFA final state)`, dfaState: currentKey });
    }

    for (const sym of nonEpsAlpha) {
      const moved = move(current, sym, transitions);
      steps.push({ type: 'move', msg: `move({${current.join(',')}}, ${sym}) = {${moved.join(',') || '∅'}}`, sym, from: currentKey });

      if (moved.length === 0) {
        dfaTransitions[currentKey][sym] = null;
        steps.push({ type: 'dead', msg: `ε-closure(∅) = ∅ → Dead state (∅)`, sym, from: currentKey, to: null });
        continue;
      }

      const { closure, steps: csteps } = epsilonClosure(moved, transitions);
      const closureKey = closure.join(',');

      if (!stateNames[closureKey]) {
        stateNames[closureKey] = 'D' + (Object.keys(stateNames).length);
      }
      const newName = stateNames[closureKey];

      steps.push({
        type: 'closure',
        msg: `ε-closure({${moved.join(',')}}) = {${closure.join(',')}} → ${newName}`,
        sym, from: currentKey, to: closureKey, closureSteps: csteps
      });

      dfaTransitions[currentKey][sym] = closureKey;

      if (!dfaStates[closureKey]) {
        dfaStates[closureKey] = closure;
        worklist.push(closure);
        steps.push({ type: 'new', msg: `New DFA state: ${newName} = {${closure.join(',')}}`, dfaState: closureKey, nfaStates: closure });
      } else {
        steps.push({ type: 'exists', msg: `${newName} = {${closure.join(',')}} already in DFA`, dfaState: closureKey });
      }
    }
  }

  return {
    states: Object.keys(dfaStates),
    alphabet: nonEpsAlpha,
    start: dfaStart,
    finals: dfaFinals,
    transitions: dfaTransitions,
    stateMap: stateNames,
    steps
  };
}

function minimizeDFA(dfa) {
  const { states, alphabet, finals, transitions } = dfa;
  const nonFinals = states.filter(s => !finals.has(s));
  const finalsArr = [...finals].filter(s => states.includes(s));
  const minSteps = [];
  let partitions = [];
  if (finalsArr.length > 0) partitions.push(new Set(finalsArr));
  if (nonFinals.length > 0) partitions.push(new Set(nonFinals));

  minSteps.push({ msg: `Initial partition: [${partitions.map(p => '{' + [...p].join(',') + '}').join(', ')}]`, partitions: partitions.map(p => [...p]) });

  let changed = true;
  let iteration = 0;
  while (changed && iteration < 100) {
    changed = false;
    iteration++;
    const newPartitions = [];
    for (const group of partitions) {
      if (group.size <= 1) { newPartitions.push(group); continue; }
      const groupArr = [...group];
      const split = [];
      const used = new Set();
      for (const s of groupArr) {
        if (used.has(s)) continue;
        const partition = [s];
        used.add(s);
        for (const t of groupArr) {
          if (used.has(t)) continue;
          let equiv = true;
          for (const sym of alphabet) {
            const ts = transitions[s]?.[sym];
            const tt = transitions[t]?.[sym];
            if (ts === tt) continue;
            if (!ts || !tt) { equiv = false; break; }
            const ps = partitions.findIndex(p => p.has(ts));
            const pt = partitions.findIndex(p => p.has(tt));
            if (ps !== pt) { equiv = false; break; }
          }
          if (equiv) { partition.push(t); used.add(t); }
        }
        split.push(new Set(partition));
      }
      if (split.length > 1) changed = true;
      newPartitions.push(...split);
    }
    partitions = newPartitions;
    if (changed) minSteps.push({ msg: `Iteration ${iteration}: [${partitions.map(p => '{' + [...p].join(',') + '}').join(', ')}]`, partitions: partitions.map(p => [...p]) });
  }

  minSteps.push({ msg: `Stable partition: [${partitions.map(p => '{' + [...p].join(',') + '}').join(', ')}]`, partitions: partitions.map(p => [...p]) });

  const repMap = {};
  for (const group of partitions) {
    const rep = [...group][0];
    for (const s of group) repMap[s] = rep;
  }

  const minStates = [...new Set(Object.values(repMap))];
  const minStart = repMap[dfa.start];
  const minFinals = new Set(minStates.filter(s => finals.has(s)));
  const minTransitions = {};
  for (const s of minStates) {
    minTransitions[s] = {};
    for (const sym of alphabet) {
      const t = transitions[s]?.[sym];
      minTransitions[s][sym] = t ? repMap[t] : null;
    }
  }

  return { states: minStates, alphabet, start: minStart, finals: minFinals, transitions: minTransitions, steps: minSteps };
}

function simulateDFA(dfaObj, inputStr) {
  let current = dfaObj.start;
  const steps = [{ state: current, char: null, remaining: inputStr, stepNum: 0 }];
  for (let i = 0; i < inputStr.length; i++) {
    const ch = inputStr[i];
    const next = dfaObj.transitions[current]?.[ch];
    if (next === undefined || next === null) {
      steps.push({ state: null, char: ch, remaining: inputStr.slice(i + 1), stepNum: i + 1, dead: true });
      break;
    }
    current = next;
    steps.push({ state: current, char: ch, remaining: inputStr.slice(i + 1), stepNum: i + 1 });
  }
  const last = steps[steps.length - 1];
  const accepted = !last.dead && dfaObj.finals.has(last.state);
  return { steps, accepted };
}

// ══════════════════════════════════════════════════
// TOAST NOTIFICATION SYSTEM
// ══════════════════════════════════════════════════
function showToast(type, title, msg, duration = 4000) {
  const container = document.getElementById('toast-container');
  const icons = { error: '✖', warn: '⚠', success: '✔' };
  const t = document.createElement('div');
  const role = type === 'error' ? 'alert' : 'status';
  t.className = 'toast ' + type;
  t.setAttribute('role', role);
  t.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
  t.innerHTML = `
    <span class="toast-icon" aria-hidden="true">${icons[type] || '●'}</span>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      <div class="toast-msg">${msg}</div>
    </div>
    <span class="toast-close" onclick="dismissToast(this.parentElement)" aria-label="Dismiss notification">✕</span>`;
  container.appendChild(t);
  if (duration > 0) {
    const existing = Number(t.dataset.timeoutId || 0);
    if (existing) clearTimeout(existing);
    const timeoutId = setTimeout(() => dismissToast(t), duration);
    t.dataset.timeoutId = String(timeoutId);
  }
  return t;
}
function dismissToast(t) {
  if (!t || !t.parentElement) return;
  const timeoutId = Number(t.dataset.timeoutId || 0);
  if (timeoutId) clearTimeout(timeoutId);
  t.style.animation = 'toastOut .2s ease forwards';
  setTimeout(() => t.remove(), 200);
}

function parseStoredJSON(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn(`Invalid localStorage data for ${key}:`, error);
    return null;
  }
}

function saveStoredJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Unable to save ${key}:`, error);
    return false;
  }
}

function isTypingTarget(target) {
  if (!target) return false;
  if (target.isContentEditable) return true;
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

function getShortcutLabel() {
  return isMacOS ? 'Cmd' : 'Ctrl';
}

function normalizeNFAData(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const states = Array.isArray(raw.states) ? raw.states.map(String).map(s => s.trim()).filter(Boolean) : [];
  const alphabet = Array.isArray(raw.alphabet) ? raw.alphabet.map(String).map(s => s.trim()).filter(Boolean) : [];
  if (!states.length || !alphabet.length) return null;
  const seenStates = new Set();
  const uniqueStates = [];
  for (const state of states) {
    if (!seenStates.has(state)) {
      seenStates.add(state);
      uniqueStates.push(state);
    }
  }
  const start = String(raw.start || '').trim();
  if (!start || !uniqueStates.includes(start)) return null;
  const finals = Array.isArray(raw.finals) ? raw.finals.map(String).map(s => s.trim()).filter(Boolean) : [];
  const validFinals = finals.filter(f => uniqueStates.includes(f));
  if (!validFinals.length) return null;
  const transitions = raw.transitions && typeof raw.transitions === 'object' ? raw.transitions : {};
  const cleanedTransitions = {};
  for (const state of uniqueStates) {
    const stateMap = transitions[state] && typeof transitions[state] === 'object' ? transitions[state] : {};
    cleanedTransitions[state] = {};
    for (const symbol of alphabet) {
      const value = stateMap[symbol];
      const targets = Array.isArray(value) ? value.map(String).map(v => v.trim()).filter(Boolean) : [];
      const safeTargets = targets.filter(t => uniqueStates.includes(t));
      cleanedTransitions[state][symbol] = safeTargets;
    }
  }
  return {
    states: uniqueStates,
    alphabet,
    start,
    finals: validFinals,
    transitions: cleanedTransitions
  };
}

function collectionSummaryForNFA(nfaData) {
  const states = nfaData?.states || [];
  const alphabet = nfaData?.alphabet || [];
  return `${states.length} states · ${alphabet.length} symbols · start ${nfaData.start || '—'}`;
}

function buildRecentList() {
  const recentList = document.getElementById('recentList');
  if (!recentList) return;
  const recent = parseStoredJSON(STORAGE_KEYS.recent) || [];
  if (!Array.isArray(recent) || !recent.length) {
    recentList.innerHTML = '<div class="recent-empty">No recent automata saved yet.</div>';
    return;
  }
  const validRecent = recent.filter(item => item && item.nfa && item.label);
  if (!validRecent.length) {
    recentList.innerHTML = '<div class="recent-empty">No recent automata saved yet.</div>';
    return;
  }
  recentList.innerHTML = validRecent.slice(0, 5).map((item, index) => `
    <button type="button" class="recent-item" data-index="${index}" aria-label="Load recent automaton ${item.label}">
      ${item.label}
    </button>
  `).join('');
  recentList.querySelectorAll('.recent-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = Number(btn.dataset.index);
      const entry = validRecent[index];
      const nfaData = normalizeNFAData(entry.nfa);
      if (!nfaData) return;
      restoreNFAState(nfaData, false);
      showToast('success', 'Recent Automaton Loaded', `Loaded ${entry.label}.`);
    });
  });
}

function saveRecentAutomaton(nfaData) {
  const safe = normalizeNFAData(nfaData);
  if (!safe) return;
  const recent = parseStoredJSON(STORAGE_KEYS.recent) || [];
  const entry = {
    label: `${safe.states.join(',')} · ${safe.alphabet.join(',')}`,
    nfa: {
      states: safe.states,
      alphabet: safe.alphabet,
      start: safe.start,
      finals: safe.finals,
      transitions: safe.transitions
    }
  };
  const deduped = Array.isArray(recent) ? recent.filter(item => item && item.nfa && JSON.stringify(item.nfa) !== JSON.stringify(entry.nfa)) : [];
  deduped.unshift(entry);
  const trimmed = deduped.slice(0, 5);
  saveStoredJSON(STORAGE_KEYS.recent, trimmed);
  buildRecentList();
}

function persistThemePreference() {
  saveStoredJSON(STORAGE_KEYS.theme, isDark ? 'dark' : 'light');
}

function applyThemePreference(theme) {
  const dark = theme !== 'light';
  isDark = dark;
  document.body.classList.toggle('light', !dark);
  const toggle = document.getElementById('darkToggle');
  const label = document.getElementById('darkLabel');
  if (toggle) toggle.classList.toggle('on', dark);
  if (label) label.textContent = dark ? 'Dark' : 'Light';
  const toggleWrap = document.querySelector('.toggle');
  if (toggleWrap) toggleWrap.setAttribute('aria-pressed', String(dark));
  drawGraph();
}

function restoreThemePreference() {
  const rawTheme = parseStoredJSON(STORAGE_KEYS.theme);
  const theme = rawTheme === 'light' ? 'light' : 'dark';
  applyThemePreference(theme);
}

function getCurrentNFAState() {
  const states = document.getElementById('states').value.split(',').map(s => s.trim()).filter(Boolean);
  const alphabet = document.getElementById('alphabet').value.split(',').map(a => a.trim()).filter(Boolean);
  const start = document.getElementById('startState').value.trim();
  const finals = document.getElementById('finalStates').value.split(',').map(s => s.trim()).filter(Boolean);
  const valid = normalizeNFAData({ states, alphabet, start, finals, transitions: nfa.transitions || {} });
  return valid;
}

function persistCurrentNFA() {
  const current = getCurrentNFAState();
  if (!current) return false;
  saveStoredJSON(STORAGE_KEYS.currentNFA, current);
  saveRecentAutomaton(current);
  return true;
}

function restoreNFAState(data, announce = true) {
  const nfaData = normalizeNFAData(data);
  if (!nfaData) return false;

  document.getElementById('states').value = nfaData.states.join(',');
  document.getElementById('alphabet').value = nfaData.alphabet.join(',');
  document.getElementById('startState').value = nfaData.start;
  document.getElementById('finalStates').value = nfaData.finals.join(',');

  nfa.states = nfaData.states;
  nfa.alphabet = nfaData.alphabet;
  nfa.start = nfaData.start;
  nfa.finals = new Set(nfaData.finals);
  nfa.transitions = nfaData.transitions || {};

  for (const state of nfa.states) {
    if (!nfa.transitions[state]) nfa.transitions[state] = {};
  }

  renderTransitionTable();
  buildNFAGraph();
  drawGraph();
  updateEpsilonClosureDisplay();
  updateStats();
  document.getElementById('transitionSection').style.display = 'block';
  validateStates(); validateAlphabet(); validateStart(); validateFinals();
  if (announce) {
    showToast('success', 'Saved NFA Restored', `Loaded ${nfaData.states.length} states from local storage.`);
  }
  return true;
}

function restoreSavedNFA() {
  const saved = parseStoredJSON(STORAGE_KEYS.currentNFA);
  const valid = normalizeNFAData(saved);
  if (!valid) {
    buildRecentList();
    return false;
  }
  restoreNFAState(valid, false);
  buildRecentList();
  return true;
}

function showKeyboardHelp(forceOpen = true) {
  const overlay = document.getElementById('shortcut-help-overlay');
  if (!overlay) return;
  if (isMacOS) {
    document.getElementById('shortcut-ctrl-enter').textContent = 'Cmd + Enter';
    document.getElementById('shortcut-ctrl-shift-m').textContent = 'Cmd + Shift + M';
    document.getElementById('shortcut-ctrl-shift-r').textContent = 'Cmd + Shift + R';
  }
  overlay.classList.toggle('hidden', !forceOpen);
  overlay.setAttribute('aria-hidden', String(!forceOpen));
}

function closeKeyboardHelp() {
  showKeyboardHelp(false);
}

function handleKeyboardShortcuts(event) {
  if (event.defaultPrevented) return;
  if (isTypingTarget(event.target)) return;

  const isModifier = event.ctrlKey || event.metaKey;
  const isShift = event.shiftKey;

  if (event.key === '?' || (event.key === '/' && event.shiftKey)) {
    event.preventDefault();
    showKeyboardHelp(true);
    return;
  }

  if (event.key === 'Escape') {
    const overlay = document.getElementById('shortcut-help-overlay');
    if (overlay && !overlay.classList.contains('hidden')) {
      event.preventDefault();
      closeKeyboardHelp();
      return;
    }
    event.preventDefault();
    resetAll();
    return;
  }

  if (isModifier && event.key === 'Enter') {
    event.preventDefault();
    startConversion();
    return;
  }

  if (isModifier && isShift && event.key.toLowerCase() === 'm') {
    event.preventDefault();
    minimizeDFAAction();
    return;
  }

  if (isModifier && isShift && event.key.toLowerCase() === 'r') {
    event.preventDefault();
    startSim();
    return;
  }
}
function clearToasts() {
  document.getElementById('toast-container').innerHTML = '';
}

// ══════════════════════════════════════════════════
// FIELD-LEVEL LIVE VALIDATION HELPERS
// ══════════════════════════════════════════════════
function setFieldState(inputId, hintId, isOk, msg) {
  const inp = document.getElementById(inputId);
  const hint = document.getElementById(hintId);
  if (!inp) return;
  inp.classList.toggle('fi-error', !isOk);
  inp.classList.toggle('fi-ok',    isOk);
  if (hint) {
    hint.textContent = msg;
    hint.className = 'field-hint ' + (isOk ? 'ok' : 'err');
  }
}
function clearFieldState(inputId, hintId) {
  const inp = document.getElementById(inputId);
  const hint = document.getElementById(hintId);
  if (inp) { inp.classList.remove('fi-error','fi-ok'); }
  if (hint) { hint.textContent = ''; hint.className = 'field-hint'; }
}

function getStatesList() {
  return document.getElementById('states').value.split(',').map(s => s.trim()).filter(Boolean);
}
function getAlphaList() {
  return document.getElementById('alphabet').value.split(',').map(a => a.trim()).filter(Boolean);
}

function validateStates() {
  const raw = document.getElementById('states').value.trim();
  if (!raw) { setFieldState('states','hint-states', false, '✖ States cannot be empty. e.g. q0,q1,q2'); return false; }
  const list = raw.split(',').map(s => s.trim()).filter(Boolean);
  const dupes = list.filter((s,i) => list.indexOf(s) !== i);
  if (dupes.length) { setFieldState('states','hint-states', false, `✖ Duplicate state(s): ${[...new Set(dupes)].join(', ')}`); return false; }
  const hasSpace = list.find(s => /\s/.test(s));
  if (hasSpace) { setFieldState('states','hint-states', false, `✖ State name "${hasSpace}" contains a space. Use names like q0,q1`); return false; }
  const badName = list.find(s => !/^[a-zA-Z0-9_]+$/.test(s));
  if (badName) { setFieldState('states','hint-states', false, `✖ Invalid state name: "${badName}". Use only letters, digits, _`); return false; }
  setFieldState('states','hint-states', true, `✔ ${list.length} state(s): ${list.join(', ')}`);
  validateStart(); validateFinals();
  return true;
}

function validateAlphabet() {
  const raw = document.getElementById('alphabet').value.trim();
  if (!raw) { setFieldState('alphabet','hint-alphabet', false, '✖ Alphabet cannot be empty. e.g. a,b  or  a,b,ε'); return false; }
  const list = raw.split(',').map(a => a.trim()).filter(Boolean);
  const dupes = list.filter((a,i) => list.indexOf(a) !== i);
  if (dupes.length) { setFieldState('alphabet','hint-alphabet', false, `✖ Duplicate symbol(s): ${[...new Set(dupes)].join(', ')}`); return false; }
  const bad = list.find(a => a !== 'ε' && a.length !== 1);
  if (bad) { setFieldState('alphabet','hint-alphabet', false, `✖ "${bad}" is not a valid symbol. Each symbol must be a single character (e.g. a, b, 0, 1) or ε`); return false; }
  setFieldState('alphabet','hint-alphabet', true, `✔ ${list.length} symbol(s): ${list.join(', ')}`);
  return true;
}

function validateStart() {
  const raw = document.getElementById('startState').value.trim();
  const states = getStatesList();
  if (!raw) { setFieldState('startState','hint-start', false, '✖ Start state cannot be empty'); return false; }
  if (states.length && !states.includes(raw)) {
    setFieldState('startState','hint-start', false, `✖ "${raw}" is not in your states list [${states.join(', ')}]`);
    return false;
  }
  setFieldState('startState','hint-start', true, `✔ Start: ${raw}`);
  return true;
}

function validateFinals() {
  const raw = document.getElementById('finalStates').value.trim();
  if (!raw) { setFieldState('finalStates','hint-finals', false, '✖ At least one final/accept state is required'); return false; }
  const states = getStatesList();
  const list = raw.split(',').map(s => s.trim()).filter(Boolean);
  const notFound = list.filter(f => states.length && !states.includes(f));
  if (notFound.length) {
    setFieldState('finalStates','hint-finals', false, `✖ Not in states: ${notFound.join(', ')}. Valid states: [${states.join(', ')}]`);
    return false;
  }
  setFieldState('finalStates','hint-finals', true, `✔ Final state(s): ${list.join(', ')}`);
  return true;
}

function validateSimString() {
  const str = document.getElementById('simString').value;
  const hint = document.getElementById('hint-sim');
  const inp = document.getElementById('simString');
  if (!dfa.states.length) {
    inp.classList.remove('fi-error','fi-ok');
    if (hint) { hint.textContent = '⚠ Convert NFA first before simulating'; hint.className = 'field-hint err'; }
    return false;
  }
  if (str === '') {
    clearFieldState('simString','hint-sim');
    if (hint) { hint.textContent = 'Empty string = ε (will check if start state is accepting)'; hint.className = 'field-hint'; }
    return true;
  }
  const alpha = nfa.alphabet.filter(a => a !== 'ε');
  const invalid = [];
  for (const ch of str) {
    if (!alpha.includes(ch) && !invalid.includes(ch)) invalid.push(ch);
  }
  if (invalid.length) {
    setFieldState('simString','hint-sim', false, `✖ Invalid character(s): ${invalid.map(c=>`'${c}'`).join(', ')}. Alphabet is: {${alpha.join(', ')}}`);
    return false;
  }
  setFieldState('simString','hint-sim', true, `✔ Valid — ${str.length} character(s) over {${alpha.join(',')}}`);
  return true;
}

function validateTransitionTarget(input) {
  const s = input.dataset.state, sym = input.dataset.sym;
  const val = input.value.trim();
  if (!val || val === '∅' || val === '{}' || val === '') {
    input.style.outline = '';
    input.title = '';
    return true;
  }
  const targets = val.split(',').map(v => v.trim()).filter(Boolean);
  const invalid = targets.filter(t => !nfa.states.includes(t));
  if (invalid.length) {
    input.style.outline = '1px solid var(--red)';
    input.style.color = 'var(--red)';
    input.title = `Invalid state(s): ${invalid.join(', ')}. Valid: [${nfa.states.join(', ')}]`;
    showToast('error', 'Invalid Transition Target',
      `δ(${s}, ${sym}) → "${invalid.join(',')}" — state(s) not defined. Use: ${nfa.states.join(', ')} or leave blank for ∅`, 3500);
    return false;
  }
  input.style.outline = '1px solid var(--green)';
  input.style.color = '';
  input.title = '';
  return true;
}

// ══════════════════════════════════════════════════
// UI: NFA INPUT
// ══════════════════════════════════════════════════
function buildTransitionTable() {
  const ok = [validateStates(), validateAlphabet(), validateStart(), validateFinals()];
  if (ok.includes(false)) {
    showToast('error', 'Invalid Input', 'Please fix the highlighted field errors before building the table.');
    return;
  }

  const statesList  = document.getElementById('states').value.split(',').map(s => s.trim()).filter(Boolean);
  const alphabetList = document.getElementById('alphabet').value.split(',').map(a => a.trim()).filter(Boolean);
  const start       = document.getElementById('startState').value.trim();
  const finalsList  = document.getElementById('finalStates').value.split(',').map(s => s.trim()).filter(Boolean);

  nfa.states   = statesList;
  nfa.alphabet = alphabetList;
  nfa.start    = start;
  nfa.finals   = new Set(finalsList);
  if (!nfa.transitions) nfa.transitions = {};

  const existing = nfa.transitions;
  nfa.transitions = {};
  for (const s of statesList) {
    nfa.transitions[s] = existing[s] || {};
  }

  renderTransitionTable();
  buildNFAGraph();
  drawGraph();
  updateEpsilonClosureDisplay();
  document.getElementById('transitionSection').style.display = 'block';
  updateStats();
  persistCurrentNFA();
  showToast('success', 'Table Built', `NFA: ${statesList.length} states, alphabet {${alphabetList.join(', ')}}, start: ${start}, final: {${finalsList.join(', ')}}`, 3000);
}

function renderTransitionTable() {
  const { states, alphabet, transitions, start, finals } = nfa;
  let html = '<table class="ttable" aria-label="NFA transition table"><thead><tr><th scope="col">State</th>';
  for (const a of alphabet) html += `<th scope="col">${a}</th>`;
  html += '</tr></thead><tbody>';
  for (const s of states) {
    let rowClass = '';
    const isStart = s === start, isFinal = finals.has(s);
    if (isStart && isFinal) rowClass = 'final-start-row';
    else if (isFinal) rowClass = 'final-row';
    else if (isStart) rowClass = 'start-row';
    html += `<tr class="${rowClass}"><th scope="row" aria-label="State ${s}">${isStart ? '→' : ''}${isFinal ? '*' : ''}${s}</th>`;
    for (const a of alphabet) {
      const val = (transitions[s][a] || []).join(',');
      html += `<td><input type="text" value="${val}" data-state="${s}" data-sym="${a}" placeholder="∅" aria-label="Transition from state ${s} on symbol ${a}" oninput="updateTransition(this)"></td>`;
    }
    html += '</tr>';
  }
  html += '</tbody></table>';
  document.getElementById('transitionTable').innerHTML = html;
}

function updateTransition(input) {
  const s = input.dataset.state, sym = input.dataset.sym;
  const val = input.value.trim();
  if (!val || val === '{}' || val === '∅') {
    input.style.outline = '';
    input.style.color = '';
    input.title = '';
    nfa.transitions[s][sym] = [];
  } else {
    const targets = val.split(',').map(v => v.trim()).filter(Boolean);
    const invalid = targets.filter(t => !nfa.states.includes(t));
    if (invalid.length) {
      input.style.outline = '2px solid var(--red)';
      input.style.color = 'var(--red)';
      input.title = `"${invalid.join(',')}" not a valid state. Valid: [${nfa.states.join(', ')}]`;
      showToast('error', 'Invalid Transition Target',
        `δ(${s}, ${sym}) → "${invalid.join(',')}" not defined. Valid states: ${nfa.states.join(', ')}`, 3000);
      return;
    }
    input.style.outline = '1px solid var(--green)';
    input.style.color = '';
    input.title = '';
    nfa.transitions[s][sym] = targets;
  }
  buildNFAGraph();
  drawGraph();
  updateEpsilonClosureDisplay();
}

function updateEpsilonClosureDisplay() {
  const el = document.getElementById('epsilonClosureDisplay');
  if (!nfa.states.length) { el.innerHTML = 'Build transition table first.'; return; }
  let html = '';
  for (const s of nfa.states) {
    const { closure } = epsilonClosure([s], nfa.transitions);
    html += `<div class="eclosure-row">ε-closure({${s}}) = {${closure.join(', ')}}</div>`;
  }
  el.innerHTML = html;
}

// ══════════════════════════════════════════════════
// CONVERSION
// ══════════════════════════════════════════════════
function startConversion() {
  if (!nfa.states.length) {
    showToast('error', 'No NFA Defined', 'Please define states, alphabet and build the transition table first.');
    return;
  }

  clearLog();
  currentStep = 0;
  conversionSteps = [];
  dfa = { states: [], alphabet: [], start: '', finals: new Set(), transitions: {}, stateMap: {} };
  canvasHighlight = {};

  const result = subsetConstruction(nfa);
  dfa.states = result.states;
  dfa.alphabet = result.alphabet;
  dfa.start = result.start;
  dfa.finals = result.finals;
  dfa.transitions = result.transitions;
  dfa.stateMap = result.stateMap;
  conversionSteps = result.steps;

  document.getElementById('totalSteps').textContent = conversionSteps.length;
  document.getElementById('btnStep').disabled = false;
  document.getElementById('btnAuto').disabled = false;

  startTime = Date.now();
  timerInterval = setInterval(() => {
    document.getElementById('elapsedTime').textContent = (Date.now() - startTime) + 'ms';
  }, 100);

  addLog('info', 'START', `Starting subset construction for NFA with ${nfa.states.length} states, |Σ|=${nfa.alphabet.filter(a => a !== 'ε').length}`);
  addLog('info', 'ALGO', `Worklist initialized with start state closure`);

  updateStats();
  renderDFATable();
  switchTab('nfa');
}

function stepConversion() {
  if (currentStep >= conversionSteps.length) {
    addLog('success', 'DONE', `Conversion complete! ${dfa.states.length} DFA states generated.`);
    clearInterval(timerInterval);
    switchTab('dfa');
    buildDFAGraph();
    drawGraph();
    document.getElementById('btnStep').disabled = true;
    document.getElementById('btnAuto').disabled = true;
    return;
  }

  const step = conversionSteps[currentStep];
  currentStep++;
  document.getElementById('stepCounter').textContent = currentStep;
  processStep(step);
}

function processStep(step) {
  const typeMap = { init: 'step', final: 'success', move: 'info', closure: 'step', new: 'warn', exists: 'info', dead: 'warn' };
  const tagMap  = { init: 'INIT', final: 'FINAL', move: 'MOVE', closure: 'ε-CLOSURE', new: 'NEW', exists: 'EXISTS', dead: 'DEAD' };

  addLog(typeMap[step.type] || 'info', tagMap[step.type] || step.type.toUpperCase(), step.msg);

  if (step.dfaState) {
    canvasHighlight.dfaState = step.dfaState;
    canvasHighlight.nfaState = step.nfaStates?.[0];
  }
  if (step.from && step.to) {
    canvasHighlight.edge = { from: step.from, to: step.to };
  }

  renderDFATable();
  if (activeTab === 'nfa') drawGraph();
}

let autoRunning = false;
function autoRun() {
  if (autoRunning) return;
  autoRunning = true;
  document.getElementById('btnAuto').disabled = true;
  document.getElementById('btnPause').disabled = false;
  document.getElementById('btnStep').disabled = true;

  function next() {
    if (!autoRunning || currentStep >= conversionSteps.length) {
      if (currentStep >= conversionSteps.length) { stepConversion(); }
      autoRunning = false;
      document.getElementById('btnPause').disabled = true;
      document.getElementById('btnAuto').disabled = true;
      return;
    }
    stepConversion();
    autoTimer = setTimeout(next, animSpeed);
  }
  next();
}

function pauseAuto() {
  autoRunning = false;
  clearTimeout(autoTimer);
  document.getElementById('btnPause').disabled = true;
  document.getElementById('btnAuto').disabled = false;
  document.getElementById('btnStep').disabled = false;
}

function resetAll() {
  clearTimeout(autoTimer);
  clearInterval(timerInterval);
  autoRunning = false;
  resetSim();
  currentStep = 0;
  conversionSteps = [];
  dfa = { states: [], alphabet: [], start: '', finals: new Set(), transitions: {}, stateMap: {} };
  minDFA = { states: [], alphabet: [], start: '', finals: new Set(), transitions: {} };
  canvasHighlight = {};
  nodes = []; edges = [];
  drawGraph();
  clearLog();
  document.getElementById('stepCounter').textContent = '0';
  document.getElementById('totalSteps').textContent = '—';
  document.getElementById('elapsedTime').textContent = '0ms';
  document.getElementById('btnStep').disabled = true;
  document.getElementById('btnAuto').disabled = true;
  document.getElementById('btnPause').disabled = true;
  document.getElementById('dfaTableWrap').style.display = 'none';
  document.getElementById('dfaTableEmpty').style.display = 'block';
  document.getElementById('min-empty-msg').style.display = 'block';
  document.getElementById('min-results').style.display   = 'none';
  document.getElementById('dfaTableBadge').textContent = '';
  updateStats();
  addLog('info', 'RESET', 'All data cleared. Ready for new conversion.');
}

function updateSpeed(v) {
  animSpeed = parseInt(v);
  document.getElementById('speedLabel').textContent = v + 'ms';
}

// ══════════════════════════════════════════════════
// DFA TABLE RENDER
// ══════════════════════════════════════════════════
function renderDFATable() {
  const wrap = document.getElementById('dfaTableWrap');
  const empty = document.getElementById('dfaTableEmpty');
  const badge = document.getElementById('dfaTableBadge');
  if (!dfa.states.length) {
    wrap.style.display = 'none';
    empty.style.display = 'block';
    if (badge) badge.textContent = '';
    return;
  }
  wrap.style.display = 'block';
  empty.style.display = 'none';

  const alphabetNonEps = dfa.alphabet;
  let html = '<thead><tr><th scope="col">DFA State</th><th scope="col">NFA States</th>';
  for (const a of alphabetNonEps) html += `<th scope="col">${a}</th>`;
  html += '</tr></thead><tbody>';

  const names = dfa.stateMap || {};
  for (const s of dfa.states) {
    const isStart = s === dfa.start;
    const isFinal = dfa.finals.has(s);
    let cls = isStart && isFinal ? 'both' : isStart ? 'start' : isFinal ? 'final' : '';
    const dname = names[s] || s;
    html += `<tr><th scope="row" class="${cls}">${isStart ? '→' : ''}${isFinal ? '*' : ''}${dname}</th>`;
    html += `<td style="color:var(--text3);font-size:10px;">{${s}}</td>`;
    for (const a of alphabetNonEps) {
      const t = dfa.transitions[s]?.[a];
      const tname = t ? (names[t] || t) : '∅';
      html += `<td class="${t && dfa.finals.has(t) ? 'final' : ''}">${tname}</td>`;
    }
    html += '</tr>';
  }
  html += '</tbody>';

  document.getElementById('dfaTable').innerHTML = html;
  document.getElementById('dfaTable').setAttribute('aria-label', 'DFA transition table');
  badge.textContent = `${dfa.states.length} states, ${alphabetNonEps.length} symbols`;
}

// ══════════════════════════════════════════════════
// STATS
// ══════════════════════════════════════════════════
function updateStats() {
  const n = nfa.states.length;
  const alphaSize = nfa.alphabet.filter(a => a !== 'ε').length;
  const dfaCount = dfa.states.length;
  const worst = Math.pow(2, n);
  const minCount = minDFA.states.length;

  document.getElementById('stat-nfa-states').textContent = n || '—';
  document.getElementById('stat-alpha-size').textContent = alphaSize || '—';
  document.getElementById('stat-dfa-states').textContent = dfaCount || '—';
  document.getElementById('stat-worst-case').textContent = n ? `2^${n} = ${worst}` : '—';
  document.getElementById('stat-ratio').textContent = dfaCount && worst ? `${dfaCount}/${worst} = ${(dfaCount / worst * 100).toFixed(1)}%` : '—';
  document.getElementById('stat-min-states').textContent = minCount || '—';
  document.getElementById('stat-reduction').textContent = dfaCount && minCount ? `${dfaCount} → ${minCount} (${Math.round((1 - minCount / dfaCount) * 100)}% less)` : '—';

  if (dfaCount && worst) {
    const pct = Math.min(100, dfaCount / worst * 100);
    document.getElementById('stat-bar').style.width = pct + '%';
    document.getElementById('stat-bar').style.background = pct > 60 ? 'var(--red)' : pct > 30 ? 'var(--amber)' : 'var(--green)';
  }
}

// ══════════════════════════════════════════════════
// MINIMIZATION
// ══════════════════════════════════════════════════
function minimizeDFAAction() {
  if (!dfa.states.length) {
    showToast('error', 'No DFA Available', 'Convert the NFA to DFA first before minimizing.');
    return;
  }

  const result = minimizeDFA(dfa);
  minDFA.states      = result.states;
  minDFA.alphabet    = result.alphabet;
  minDFA.start       = result.start;
  minDFA.finals      = result.finals;
  minDFA.transitions = result.transitions;

  const reduced = dfa.states.length - minDFA.states.length;

  document.getElementById('min-empty-msg').style.display = 'none';
  document.getElementById('min-results').style.display   = 'block';

  const cardData = [
    { label:'DFA States',     val: dfa.states.length,   color:'var(--amber)' },
    { label:'Min-DFA States', val: minDFA.states.length, color:'var(--green)' },
    { label:'Removed',        val: reduced,               color: reduced > 0 ? 'var(--teal)' : 'var(--text3)' }
  ];
  document.getElementById('min-summary-cards').innerHTML = cardData.map(c => `
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:8px 10px;text-align:center;">
      <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:.08em;font-family:var(--font);margin-bottom:4px;">${c.label}</div>
      <div style="font-size:22px;font-weight:700;font-family:var(--font);color:${c.color};">${c.val}</div>
    </div>`).join('');

  const alpha = minDFA.alphabet;
  const nameMap = {};
  minDFA.states.forEach((s, i) => nameMap[s] = 'M' + i);

  let tblHtml = '<thead><tr><th scope="col">State</th>';
  alpha.forEach(a => tblHtml += `<th scope="col">${a}</th>`);
  tblHtml += '</tr></thead><tbody>';
  minDFA.states.forEach(s => {
    const isS = s === minDFA.start, isF = minDFA.finals.has(s);
    const cls = isS && isF ? 'both' : isS ? 'start' : isF ? 'final' : '';
    const pfx = (isS ? '→' : '') + (isF ? '*' : '');
    tblHtml += `<tr><th scope="row" class="${cls}">${pfx}${nameMap[s]}</th>`;
    alpha.forEach(sym => {
      const t = minDFA.transitions[s]?.[sym];
      const tn = t ? nameMap[t] || t : '∅';
      tblHtml += `<td class="${t && minDFA.finals.has(t) ? 'final' : ''}">${tn}</td>`;
    });
    tblHtml += '</tr>';
  });
  tblHtml += '</tbody>';
  document.getElementById('minDFATable').innerHTML = tblHtml;
  document.getElementById('minDFATable').setAttribute('aria-label', 'Minimized DFA transition table');

  let partHtml = '';
  result.steps.forEach((step, i) => {
    const isFirst = i === 0, isLast = i === result.steps.length - 1;
    const color = isFirst ? 'var(--accent)' : isLast ? 'var(--green)' : 'var(--accent2)';
    const tag   = isFirst ? 'INIT' : isLast ? 'STABLE' : `ITER ${i}`;
    partHtml += `<div class="log-entry step" style="border-color:${color};margin-bottom:5px;">
      <span class="log-tag" style="background:${color}22;color:${color};">${tag}</span>
      ${step.msg}
    </div>`;
  });
  document.getElementById('minPartitionLog').innerHTML = partHtml;

  const maxW = dfa.states.length || 1;
  const minW = minDFA.states.length;
  const pctBefore = 100;
  const pctAfter  = Math.round(minW / maxW * 100);
  document.getElementById('minCompareBar').innerHTML = `
    <div style="margin-bottom:8px;">
      <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text2);font-family:var(--font);margin-bottom:3px;">
        <span>DFA (before)</span><span>${dfa.states.length} states</span>
      </div>
      <div style="height:8px;background:var(--bg3);border-radius:4px;overflow:hidden;">
        <div style="width:${pctBefore}%;height:100%;background:var(--amber);border-radius:4px;"></div>
      </div>
    </div>
    <div>
      <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text2);font-family:var(--font);margin-bottom:3px;">
        <span>Min-DFA (after)</span><span>${minDFA.states.length} states (${pctAfter}%)</span>
      </div>
      <div style="height:8px;background:var(--bg3);border-radius:4px;overflow:hidden;">
        <div style="width:${pctAfter}%;height:100%;background:var(--green);border-radius:4px;transition:width .5s;"></div>
      </div>
    </div>
    ${reduced === 0
      ? `<div style="font-size:10px;color:var(--text3);font-family:var(--font);margin-top:8px;text-align:center;">
           ✔ DFA is already minimal — no states can be merged.
         </div>`
      : `<div style="font-size:10px;color:var(--teal);font-family:var(--font);margin-top:8px;text-align:center;">
           ✔ ${reduced} redundant state(s) eliminated (${100 - pctAfter}% reduction)
         </div>`
    }`;

  switchTab('min');

  document.querySelectorAll('.mini-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.mini-tab').forEach(t => {
    if (t.textContent.trim() === 'Minimize') t.classList.add('active');
  });
  document.querySelectorAll('.r-section').forEach(s => s.classList.remove('active'));
  document.getElementById('sec-min').classList.add('active');

  updateStats();
  addLog('success', 'MINIMIZE', `DFA minimized: ${dfa.states.length} → ${minDFA.states.length} states (${reduced} removed, ${result.steps.length} partition steps)`);
  showToast('success', 'Minimization Complete', `${dfa.states.length} DFA states → ${minDFA.states.length} Min-DFA states. ${reduced > 0 ? reduced + ' state(s) eliminated.' : 'Already minimal.'}`, 4000);
}

// ══════════════════════════════════════════════════
// SIMULATION
// ══════════════════════════════════════════════════
function startSim() {
  clearTimeout(simAutoTimer);
  const activeDFA = activeTab === 'min' && minDFA.states.length ? minDFA : dfa;
  if (!activeDFA.states.length) {
    showToast('error', 'No DFA Available', 'Convert the NFA to DFA first, then simulate a string.');
    return;
  }
  if (!validateSimString()) return;
  const str = document.getElementById('simString').value;
  const result = simulateDFA(activeDFA, str);
  simData = { steps: result.steps, pos: 0, active: true, str, accepted: result.accepted, dfa: activeDFA };

  document.getElementById('btnSimStep').disabled = false;
  document.getElementById('btnSimAuto').disabled = false;
  document.getElementById('simResult').innerHTML = '';
  document.getElementById('simLog').innerHTML = '';
  renderSimStep(0);
}

function renderSimStep(idx) {
  const { steps, str } = simData;
  const step = steps[idx];
  if (!step) return;

  let html = '';
  for (let i = 0; i < str.length; i++) {
    let cls = '';
    if (i === idx - 1) cls = 'done';
    else if (i === idx) cls = 'active';
    else if (i < idx - 1) cls = 'done';
    html += `<span class="sim-char ${cls}">${str[i]}</span>`;
  }
  document.getElementById('simStringDisplay').innerHTML = html || '<span style="color:var(--text3);">ε (empty string)</span>';

  const names = dfa.stateMap || {};
  const stateDisplay = step.state ? (names[step.state] || step.state) : '∅ (dead)';
  document.getElementById('simState').textContent = `State: ${stateDisplay}`;
  document.getElementById('simState').style.color = step.dead ? 'var(--red)' : (simData.dfa.finals.has(step.state) ? 'var(--green)' : 'var(--accent)');

  const logEl = document.getElementById('simLog');
  const entry = document.createElement('div');
  entry.className = 'log-entry ' + (step.dead ? 'error' : 'info');
  const charLabel = step.char ? `on '${step.char}'` : 'start';
  entry.innerHTML = `<span class="log-tag">S${step.stepNum}</span>${stateDisplay} ${charLabel}`;
  logEl.appendChild(entry);
  logEl.scrollTop = logEl.scrollHeight;

  canvasHighlight.dfaState = step.state;
  if (activeTab === 'dfa') drawGraph();

  if (idx >= steps.length - 1) {
    const accepted = simData.accepted;
    const last = steps[steps.length - 1];
    const finalState = last.dead ? '∅' : (names[last.state] || last.state);
    document.getElementById('simResult').innerHTML = `
      <div class="sim-result ${accepted ? 'accepted' : 'rejected'}">
        ${accepted ? '✓ ACCEPTED' : '✗ REJECTED'}
        <div style="font-size:12px;font-weight:400;margin-top:4px;">
          ${accepted ? `String accepted in state ${finalState}` : last.dead ? `No transition from ${names[steps[steps.length - 2]?.state] || ''} on '${last.char}'` : `State ${finalState} is not a final state`}
        </div>
      </div>`;
    document.getElementById('btnSimStep').disabled = true;
    document.getElementById('btnSimAuto').disabled = true;
    simData.active = false;
  }
}

function simStep() {
  if (!simData.active) return;
  simData.pos++;
  renderSimStep(simData.pos);
}

let simAutoTimer = null;
function simAutoRun() {
  document.getElementById('btnSimAuto').disabled = true;
  function next() {
    if (!simData.active) return;
    simStep();
    if (simData.active) simAutoTimer = setTimeout(next, animSpeed);
  }
  next();
}

function resetSim() {
  clearTimeout(simAutoTimer);
  simData = { steps: [], pos: 0, active: false, str: '', accepted: false, dfa: null };
  document.getElementById('simString').value = '';
  document.getElementById('simStringDisplay').innerHTML = '—';
  document.getElementById('simState').textContent = '—';
  document.getElementById('simState').style.color = 'var(--text3)';
  document.getElementById('simResult').innerHTML = '';
  document.getElementById('simLog').innerHTML = '';
  document.getElementById('hint-sim').textContent = '';
  document.getElementById('hint-sim').className = 'field-hint';
  document.getElementById('btnSimStep').disabled = true;
  document.getElementById('btnSimAuto').disabled = true;
  document.getElementById('simString').classList.remove('fi-error', 'fi-ok');
  canvasHighlight = {};
  drawGraph();
}

// ══════════════════════════════════════════════════
// LOG UTILITIES
// ══════════════════════════════════════════════════
function addLog(type, tag, msg) {
  const container = document.getElementById('logContainer');
  const entry = document.createElement('div');
  entry.className = 'log-entry ' + type;
  entry.innerHTML = `<span class="log-tag">${tag}</span>${msg}`;
  container.appendChild(entry);
  container.scrollTop = container.scrollHeight;
}

function clearLog() {
  document.getElementById('logContainer').innerHTML = '';
}

// ══════════════════════════════════════════════════
// TABS — CENTER GRAPH
// ══════════════════════════════════════════════════
function switchTab(tab) {
  activeTab = tab;
  const tabs = [...document.querySelectorAll('.tab')];
  tabs.forEach((t, i) => {
    const isActive = ['nfa', 'dfa', 'min'][i] === tab;
    t.classList.toggle('active', isActive);
    t.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
  const canvasLabel = tab === 'nfa' ? 'NFA graph visualization' : tab === 'dfa' ? 'DFA graph visualization' : 'Minimized DFA graph visualization';
  canvas.setAttribute('aria-label', canvasLabel);
  canvasHighlight = {};
  if (tab === 'nfa') { buildNFAGraph(); drawGraph(); }
  else if (tab === 'dfa') { buildDFAGraph(); drawGraph(); }
  else if (tab === 'min') {
    if (minDFA.states.length) { buildMinDFAGraph(); drawGraph(); }
    else drawGraph();
  }
}

// ══════════════════════════════════════════════════
// RIGHT PANEL TABS
// ══════════════════════════════════════════════════
function switchMiniTab(tab, clickedEl) {
  activeMiniTab = tab;
  document.querySelectorAll('.mini-tab').forEach(t => {
    const isActive = t === clickedEl;
    t.classList.toggle('active', isActive);
    t.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
  document.querySelectorAll('.r-section').forEach(s => s.classList.remove('active'));
  document.getElementById('sec-' + tab).classList.add('active');
}

// ══════════════════════════════════════════════════
// DARK MODE
// ══════════════════════════════════════════════════
let isDark = true;
function toggleDarkMode() {
  isDark = !isDark;
  document.body.classList.toggle('light', !isDark);
  document.getElementById('darkToggle').classList.toggle('on', isDark);
  document.getElementById('darkLabel').textContent = isDark ? 'Dark' : 'Light';
  document.querySelector('.toggle').setAttribute('aria-pressed', String(isDark));
  persistThemePreference();
  drawGraph();
}

// ══════════════════════════════════════════════════
// EXAMPLES & RANDOM
// ══════════════════════════════════════════════════
function loadExample() {
  document.getElementById('states').value = 'q0,q1,q2';
  document.getElementById('alphabet').value = 'a,b,ε';
  document.getElementById('startState').value = 'q0';
  document.getElementById('finalStates').value = 'q2';
  buildTransitionTable();
  persistCurrentNFA();
  nfa.transitions['q0']['a'] = ['q0', 'q1'];
  nfa.transitions['q0']['b'] = ['q0'];
  nfa.transitions['q0']['ε'] = [];
  nfa.transitions['q1']['a'] = [];
  nfa.transitions['q1']['b'] = ['q2'];
  nfa.transitions['q1']['ε'] = [];
  nfa.transitions['q2']['a'] = [];
  nfa.transitions['q2']['b'] = [];
  nfa.transitions['q2']['ε'] = [];
  renderTransitionTable();
  buildNFAGraph();
  drawGraph();
  updateEpsilonClosureDisplay();
  addLog('info', 'EXAMPLE', 'Loaded example NFA: accepts strings ending in "ab" over {a,b}');
}

function randomNFA() {
  const stateCount = Math.floor(Math.random() * 3) + 2;
  const states = Array.from({ length: stateCount }, (_, i) => 'q' + i);
  const alphabet = ['a', 'b'];
  const start = 'q0';
  const finals = [states[stateCount - 1]];

  document.getElementById('states').value = states.join(',');
  document.getElementById('alphabet').value = alphabet.join(',');
  document.getElementById('startState').value = start;
  document.getElementById('finalStates').value = finals.join(',');
  buildTransitionTable();

  for (const s of states) {
    for (const a of alphabet) {
      const targets = [];
      if (Math.random() > 0.4) targets.push(states[Math.floor(Math.random() * stateCount)]);
      if (Math.random() > 0.7) targets.push(states[Math.floor(Math.random() * stateCount)]);
      nfa.transitions[s][a] = [...new Set(targets)];
    }
  }
  renderTransitionTable();
  buildNFAGraph();
  drawGraph();
  updateEpsilonClosureDisplay();
  persistCurrentNFA();
  addLog('info', 'RANDOM', `Generated random NFA with ${stateCount} states over {a,b}`);
}

// ══════════════════════════════════════════════════
// EXPORT / IMPORT
// ══════════════════════════════════════════════════
function exportDFA() {
  if (!dfa.states.length) {
    showToast('warn', 'Nothing to Export', 'Convert the NFA to DFA first, then export.');
    return;
  }
  const data = {
    dfa: { states: dfa.states, alphabet: dfa.alphabet, start: dfa.start, finals: [...dfa.finals], transitions: dfa.transitions, stateNames: dfa.stateMap },
    source_nfa: { states: nfa.states, alphabet: nfa.alphabet, start: nfa.start, finals: [...nfa.finals], transitions: nfa.transitions }
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'dfa_export.json'; a.click();
  URL.revokeObjectURL(url);
}

function importNFA() {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = '.json';
  input.onchange = e => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        const n = data.source_nfa || data.nfa || data;
        document.getElementById('states').value = n.states.join(',');
        document.getElementById('alphabet').value = n.alphabet.join(',');
        document.getElementById('startState').value = n.start;
        document.getElementById('finalStates').value = (n.finals || []).join(',');
        buildTransitionTable();
        if (n.transitions) {
          for (const s in n.transitions) {
            if (!nfa.transitions[s]) nfa.transitions[s] = {};
            for (const a in n.transitions[s]) { nfa.transitions[s][a] = n.transitions[s][a]; }
          }
          renderTransitionTable(); buildNFAGraph(); drawGraph();
        }
        persistCurrentNFA();
        addLog('success', 'IMPORT', 'NFA imported successfully from JSON');
        showToast('success', 'NFA Imported', 'NFA loaded from JSON. Check the transition table and click Convert.');
      } catch (err) {
        showToast('error', 'Import Failed', `Invalid JSON file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

// ══════════════════════════════════════════════════
// CANVAS TOOLTIP
// ══════════════════════════════════════════════════
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left, my = e.clientY - rect.top;
  const tooltip = document.getElementById('canvasTooltip');
  let found = false;
  for (const node of nodes) {
    const dx = mx - node.x, dy = my - node.y;
    if (Math.sqrt(dx * dx + dy * dy) < 26) {
      tooltip.style.display = 'block';
      tooltip.style.left = (mx + 14) + 'px';
      tooltip.style.top = (my - 10) + 'px';
      const info = [];
      info.push(node.id);
      if (node.isStart) info.push('start');
      if (node.isFinal) info.push('final');
      if (node.fullLabel) info.push(node.fullLabel);
      tooltip.textContent = info.join(' · ');
      found = true;
      break;
    }
  }
  if (!found) tooltip.style.display = 'none';
});
canvas.addEventListener('mouseleave', () => {
  document.getElementById('canvasTooltip').style.display = 'none';
});

// ══════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════
function bindKeyboardAccessibility() {
  document.querySelectorAll('.tab, .mini-tab, .toggle').forEach((el) => {
    el.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        el.click();
      }
    });
  });

  document.getElementById('close-shortcuts-help').addEventListener('click', closeKeyboardHelp);
  document.getElementById('shortcut-help-overlay').addEventListener('click', (event) => {
    if (event.target === event.currentTarget) closeKeyboardHelp();
  });

  document.addEventListener('keydown', handleKeyboardShortcuts);
}

setTimeout(() => {
  bindKeyboardAccessibility();
  restoreThemePreference();
  restoreSavedNFA();
  if (!document.getElementById('states').value.trim()) {
    resizeCanvas();
    loadExample();
  } else {
    resizeCanvas();
  }
  validateStates(); validateAlphabet(); validateStart(); validateFinals();
  buildRecentList();
}, 100);
