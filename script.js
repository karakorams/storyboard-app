(() => {
  const COLS = 6;
  const CELL = 44;
  const RADIUS = 21;
  const BASE_TIME = 10;
  const MAX_STAGE = 100;
  const TICK_MS = 80;

  const PALETTE = [
    '#82b8c4', '#cfc09a', '#d4e0e0', '#2e6b7c',
    '#8aaf9c', '#ddc07a', '#c98fa0', '#a090c0'
  ];

  const boardEl = document.getElementById('board');
  const boardWrapEl = document.getElementById('boardWrap');
  const hintBarEl = document.getElementById('hintBar');
  const floatingLayerEl = document.getElementById('floatingLayer');
  const stageTitleEl = document.getElementById('stageTitle');
  const timeLeftEl = document.getElementById('timeLeft');
  const timerFillEl = document.getElementById('timerFill');
  const clockHandEl = document.getElementById('clockHand');
  const comboBadgeEl = document.getElementById('comboBadge');
  const bestRecordEl = document.getElementById('bestRecord');
  const overlayEl = document.getElementById('gameOverOverlay');
  const gameOverTextEl = document.getElementById('gameOverText');
  const restartBtn = document.getElementById('restartBtn');

  let stage = 1;
  let combo = 0;
  let timeLeft = BASE_TIME;
  let timerId = null;
  let handDeg = 0;
  let isRunning = false;
  let order = [];
  let orderIndex = 0;
  let groups = [];
  let currentMap = new Map();

  const bestRecord = {
    stage: Number(localStorage.getItem('bubble_best_stage') || 0),
    seconds: Number(localStorage.getItem('bubble_best_seconds') || 0)
  };

  function clamp(num, min, max) {
    return Math.max(min, Math.min(max, num));
  }

  function randChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function key(r, c) {
    return `${r},${c}`;
  }

  function parseKey(k) {
    const [r, c] = k.split(',').map(Number);
    return { r, c };
  }

  function eightNeighbors(r, c) {
    const list = [];
    for (let dr = -1; dr <= 1; dr += 1) {
      for (let dc = -1; dc <= 1; dc += 1) {
        if (dr === 0 && dc === 0) continue;
        list.push({ r: r + dr, c: c + dc });
      }
    }
    return list;
  }

  function getGlobalFrontier(occupiedSet) {
    const out = new Set();
    occupiedSet.forEach((k) => {
      const { r, c } = parseKey(k);
      eightNeighbors(r, c).forEach((n) => {
        if (n.c >= 0 && n.c < COLS && n.r >= 0 && !occupiedSet.has(key(n.r, n.c))) {
          out.add(key(n.r, n.c));
        }
      });
    });
    return [...out];
  }

  function getGroupFrontier(groupSet, occupiedSet) {
    const out = new Set();
    groupSet.forEach((k) => {
      const { r, c } = parseKey(k);
      eightNeighbors(r, c).forEach((n) => {
        if (n.c >= 0 && n.c < COLS && n.r >= 0) {
          const nk = key(n.r, n.c);
          if (!groupSet.has(nk) && !occupiedSet.has(nk)) out.add(nk);
        }
      });
    });
    return [...out];
  }

  function sortByDistance(candidates, ref) {
    return candidates
      .map((k) => {
        const p = parseKey(k);
        const d = Math.hypot(p.r - ref.r, p.c - ref.c);
        return { k, d };
      })
      .sort((a, b) => a.d - b.d)
      .map((v) => v.k);
  }

  function makeGroupSizes(total, colorCount) {
    const arr = new Array(colorCount).fill(1);
    let left = total - colorCount;
    while (left > 0) {
      const i = Math.floor(Math.random() * colorCount);
      arr[i] += 1;
      left -= 1;
    }
    return arr.sort((a, b) => b - a);
  }

  function generateStageData(stageNumber) {
    const colorCount = Math.min(2 + Math.floor(stageNumber / 4), 8);
    const bubbleCount = Math.min(10 + stageNumber * 2, 54);

    const sizes = makeGroupSizes(bubbleCount, colorCount);
    const colorIndexes = [...Array(colorCount)].map((_, i) => i);
    for (let i = colorIndexes.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [colorIndexes[i], colorIndexes[j]] = [colorIndexes[j], colorIndexes[i]];
    }

    const occupied = new Set();
    const createdGroups = [];

    for (let g = 0; g < colorCount; g += 1) {
      const size = sizes[g];
      const groupSet = new Set();
      let start;
      if (createdGroups.length === 0) {
        start = { r: 0, c: Math.floor(COLS / 2) };
      } else {
        const frontier = getGlobalFrontier(occupied);
        start = parseKey(randChoice(frontier));
      }

      const startKey = key(start.r, start.c);
      groupSet.add(startKey);
      occupied.add(startKey);
      const ref = { ...start };

      while (groupSet.size < size) {
        const frontier = getGroupFrontier(groupSet, occupied);
        if (!frontier.length) {
          const fallback = getGlobalFrontier(occupied);
          const chosen = parseKey(randChoice(fallback));
          const ck = key(chosen.r, chosen.c);
          groupSet.add(ck);
          occupied.add(ck);
          continue;
        }
        const ordered = sortByDistance(frontier, ref);
        const topTwo = ordered.slice(0, 2);
        const pick = parseKey(randChoice(topTwo));
        const pk = key(pick.r, pick.c);
        groupSet.add(pk);
        occupied.add(pk);
      }

      createdGroups.push({
        id: `g${g}`,
        color: PALETTE[colorIndexes[g]],
        count: groupSet.size,
        cells: [...groupSet].map(parseKey)
      });
    }

    const allCells = createdGroups.flatMap((g) => g.cells);
    const minCol = Math.min(...allCells.map((p) => p.c));
    const maxCol = Math.max(...allCells.map((p) => p.c));
    const width = maxCol - minCol + 1;
    const offset = Math.floor((COLS - width) / 2) - minCol;

    createdGroups.forEach((group) => {
      group.cells = group.cells.map((p) => ({ r: p.r, c: clamp(p.c + offset, 0, COLS - 1) }));
    });

    return {
      colorCount,
      bubbleCount,
      groups: createdGroups,
      order: [...createdGroups].sort((a, b) => b.count - a.count || a.id.localeCompare(b.id))
    };
  }

  function drawHints() {
    hintBarEl.innerHTML = '';
    order.forEach((g, idx) => {
      const item = document.createElement('div');
      item.className = 'hint-item';
      if (idx < orderIndex) item.classList.add('done');
      if (idx === orderIndex) item.classList.add('current');

      const dot = document.createElement('span');
      dot.className = 'hint-dot';
      dot.style.background = g.color;

      const text = document.createElement('span');
      text.textContent = `× ${g.count}`;

      item.append(dot, text);
      hintBarEl.appendChild(item);
    });
  }

  function showFloatTag(text, type, fontSize) {
    const tag = document.createElement('div');
    tag.className = `float-tag ${type || ''}`.trim();
    tag.textContent = text;
    tag.style.bottom = '42px';
    tag.style.fontSize = `${fontSize}px`;
    floatingLayerEl.appendChild(tag);
    setTimeout(() => tag.remove(), 800);
  }

  function updateComboBadge(animated = true) {
    if (combo <= 0) {
      comboBadgeEl.classList.add('hidden');
      comboBadgeEl.classList.remove('combo-pop', 'combo-pulse');
      return;
    }

    comboBadgeEl.textContent = `${combo} Combo`;
    comboBadgeEl.classList.remove('hidden');

    if (animated) {
      comboBadgeEl.classList.remove('combo-pop', 'combo-pulse');
      void comboBadgeEl.offsetWidth;
      comboBadgeEl.classList.add(combo === 1 ? 'combo-pop' : 'combo-pulse');
    }
  }

  function updateRecord(remain) {
    if (stage > bestRecord.stage) {
      bestRecord.stage = stage;
      bestRecord.seconds = remain;
    } else if (stage === bestRecord.stage && remain > bestRecord.seconds) {
      bestRecord.seconds = remain;
    }
    localStorage.setItem('bubble_best_stage', String(bestRecord.stage));
    localStorage.setItem('bubble_best_seconds', String(bestRecord.seconds));
    bestRecordEl.textContent = `Best Record Stage ${bestRecord.stage} / ${bestRecord.seconds.toFixed(1)}s`;
  }

  function setTimerUI() {
    timeLeftEl.textContent = `${Math.max(0, timeLeft).toFixed(1)}s`;
    const ratio = clamp(timeLeft / BASE_TIME, 0, 1);
    timerFillEl.style.width = `${ratio * 100}%`;

    if (ratio < 0.25) {
      timerFillEl.style.background = '#e07070';
    } else if (ratio < 0.5) {
      timerFillEl.style.background = '#e8b84a';
    } else {
      timerFillEl.style.background = 'rgba(255,255,255,0.95)';
    }

    handDeg = (handDeg + 6) % 360;
    clockHandEl.style.transform = `translate(-50%, -100%) rotate(${handDeg}deg)`;
  }

  function stopTimer() {
    if (timerId) clearInterval(timerId);
    timerId = null;
  }

  function startTimer() {
    stopTimer();
    timerId = setInterval(() => {
      if (!isRunning) return;
      timeLeft -= TICK_MS / 1000;
      setTimerUI();
      if (timeLeft <= 0) {
        triggerGameOver('시간 초과!');
      }
    }, TICK_MS);
  }

  function triggerWrong() {
    boardWrapEl.classList.remove('wrong');
    void boardWrapEl.offsetWidth;
    boardWrapEl.classList.add('wrong');
  }

  function triggerGameOver(reason) {
    isRunning = false;
    stopTimer();
    combo = 0;
    updateComboBadge(false);
    overlayEl.classList.remove('hidden');
    gameOverTextEl.textContent = `${reason} Stage ${stage}에서 종료되었습니다.`;
  }

  function removeGroup(group) {
    group.cells.forEach((p) => {
      const k = key(p.r, p.c);
      const bubble = currentMap.get(k);
      if (!bubble) return;

      bubble.classList.add('pop');
      setTimeout(() => {
        const ghost = document.createElement('div');
        ghost.className = 'ghost';
        ghost.style.left = bubble.style.left;
        ghost.style.top = bubble.style.top;
        boardEl.appendChild(ghost);
        bubble.remove();
      }, 300);

      currentMap.delete(k);
    });
  }

  function onBubbleClick(groupId) {
    if (!isRunning) return;

    const target = order[orderIndex];
    if (!target || groupId !== target.id) {
      combo = 0;
      updateComboBadge(false);
      triggerWrong();
      triggerGameOver('잘못된 순서!');
      return;
    }

    combo += 1;
    const bonus = (combo - 1) * 0.8;
    if (bonus > 0) {
      timeLeft += bonus;
      showFloatTag(`+${bonus.toFixed(1)}s`, 'time', 16);
    }

    const comboSize = clamp(14 + (combo - 1) * 2, 14, 28);
    showFloatTag(`${combo} Combo`, '', comboSize);

    updateComboBadge(true);
    removeGroup(target);
    orderIndex += 1;
    drawHints();

    if (orderIndex >= order.length) {
      clearStage();
    }
  }

  function renderStage(stageData) {
    boardEl.innerHTML = '';
    floatingLayerEl.innerHTML = '';
    currentMap.clear();

    groups = stageData.groups;
    order = stageData.order;
    orderIndex = 0;

    const maxRow = Math.max(...groups.flatMap((g) => g.cells.map((c) => c.r)));
    boardEl.style.height = `${(maxRow + 1) * CELL + RADIUS}px`;

    groups.forEach((group) => {
      group.cells.forEach((pos) => {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        bubble.style.background = group.color;
        bubble.style.left = `${pos.c * CELL}px`;
        bubble.style.top = `${pos.r * CELL}px`;
        bubble.dataset.groupId = group.id;
        bubble.addEventListener('click', () => onBubbleClick(group.id));
        boardEl.appendChild(bubble);
        currentMap.set(key(pos.r, pos.c), bubble);
      });
    });

    drawHints();
  }

  function clearStage() {
    isRunning = false;
    stopTimer();
    updateRecord(timeLeft);

    boardWrapEl.classList.add('slide-out');
    setTimeout(() => {
      if (stage >= MAX_STAGE) {
        overlayEl.classList.remove('hidden');
        gameOverTextEl.textContent = '축하합니다! Stage 100까지 클리어했습니다.';
        return;
      }
      stage += 1;
      startStage(stage);
    }, 700);
  }

  function startStage(n) {
    boardWrapEl.classList.remove('slide-out', 'wrong');
    overlayEl.classList.add('hidden');
    stageTitleEl.textContent = `Stage ${n}`;

    combo = 0;
    timeLeft = BASE_TIME;
    handDeg = 0;
    updateComboBadge(false);
    setTimerUI();

    const data = generateStageData(n);
    renderStage(data);

    isRunning = true;
    startTimer();
  }

  restartBtn.addEventListener('click', () => {
    stage = 1;
    startStage(stage);
  });

  bestRecordEl.textContent = `Best Record Stage ${bestRecord.stage} / ${bestRecord.seconds.toFixed(1)}s`;
  startStage(stage);
})();
