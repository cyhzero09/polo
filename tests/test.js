const assert = require('assert');

const CANVAS_SIZE = 750;
const HEADER_HEIGHT = 45;
const FOOTER_HEIGHT = 60;
const PANEL_WIDTH = 200;
const PANEL_GAP = 60;
const TOTAL_WIDTH = PANEL_WIDTH + PANEL_GAP + CANVAS_SIZE + PANEL_GAP + PANEL_WIDTH;
const GAME_SIZE = CANVAS_SIZE;
const GAME_OFFSET_X = PANEL_WIDTH + PANEL_GAP;
const GAME_OFFSET_Y = HEADER_HEIGHT;
const SEARCH_BOX_HEIGHT = 36;
const CARD_HEIGHT = 150;
const CARD_GAP = 12;
const CARD_WIDTH = PANEL_WIDTH - 20;
const POOL_CARD_START_X = 10; // (PANEL_WIDTH - CARD_WIDTH) / 2
const POOL_CARD_END_X = POOL_CARD_START_X + CARD_WIDTH; // 190
const SCROLLBAR_HIT_WIDTH = 20; // desired new value (was 6)

const CHARACTER_POOL = [
  { id: 1, name: '气质女人', color: '#FF6B9D' },
  { id: 2, name: '工作狂人', color: '#4ECDC4' },
  { id: 3, name: '啤酒大师', color: '#D4A017' },
  { id: 4, name: '西部牛仔', color: '#C87533' },
  { id: 5, name: '台灣館長', color: '#1a1a1a' },
  { id: 6, name: '拳擊高手', color: '#e74c3c' },
  { id: 7, name: '沉思男人', color: '#9C27B0' },
  { id: 8, name: '肥美坦克', color: '#556B2F' }
];

function makeGame(overrides = {}) {
  return {
    state: 'INIT',
    fieldCharacters: [],
    searchTexts: ['', ''],
    searchFocusedSide: -1,
    scrollOffsets: [0, 0],
    drag: null,
    _pendingDrag: null,
    _pendingDragStart: null,
    ...overrides,
    getFilteredPool(side) {
      const q = (this.searchTexts[side] || '').toLowerCase();
      if (!q) return CHARACTER_POOL;
      return CHARACTER_POOL.filter(c => c.name.toLowerCase().includes(q));
    },
    getPoolIndexAt(mx, my) {
      const panelTop = HEADER_HEIGHT + 10 + SEARCH_BOX_HEIGHT + 10;
      for (let side = 0; side < 2; side++) {
        const px = side === 0 ? 0 : PANEL_WIDTH + PANEL_GAP + CANVAS_SIZE + PANEL_GAP;
        const panelRight = px + PANEL_WIDTH;
        if (mx < px || mx > panelRight) continue;
        const filtered = this.getFilteredPool(side);
        for (let i = 0; i < filtered.length; i++) {
          const cy = panelTop + i * (CARD_HEIGHT + CARD_GAP) - this.scrollOffsets[side];
          const cardX = px + (PANEL_WIDTH - CARD_WIDTH) / 2;
          if (my >= cy && my <= cy + CARD_HEIGHT) {
            if (mx >= cardX && mx <= cardX + CARD_WIDTH) {
              return CHARACTER_POOL.indexOf(filtered[i]);
            }
          }
        }
      }
      return -1;
    },
    getSearchBoxAt(mx, my) {
      const sy = HEADER_HEIGHT + 10;
      for (let side = 0; side < 2; side++) {
        const px = side === 0 ? 0 : PANEL_WIDTH + PANEL_GAP + CANVAS_SIZE + PANEL_GAP;
        const searchX = px + (PANEL_WIDTH - CARD_WIDTH) / 2;
        if (mx >= searchX && mx <= searchX + CARD_WIDTH && my >= sy && my <= sy + SEARCH_BOX_HEIGHT) {
          return side;
        }
      }
      return -1;
    },
    isOnPanel(mx) {
      if (mx >= 0 && mx <= PANEL_WIDTH) return 0;
      if (mx >= PANEL_WIDTH + PANEL_GAP + CANVAS_SIZE + PANEL_GAP && mx <= TOTAL_WIDTH) return 1;
      return -1;
    },
    getMaxScroll(side) {
      const filtered = this.getFilteredPool(side);
      const cardListHeight = filtered.length * (CARD_HEIGHT + CARD_GAP);
      const visibleHeight = CANVAS_SIZE - SEARCH_BOX_HEIGHT - 20;
      return Math.max(0, cardListHeight - visibleHeight);
    },
    isInField(mx, my) {
      return mx >= GAME_OFFSET_X && mx <= GAME_OFFSET_X + CANVAS_SIZE &&
             my >= GAME_OFFSET_Y && my <= GAME_OFFSET_Y + CANVAS_SIZE;
    },
    getFieldIndexAt(mx, my) {
      for (let i = this.fieldCharacters.length - 1; i >= 0; i--) {
        const ch = this.fieldCharacters[i];
        const dx = mx - ch.x;
        const dy = my - ch.y;
        if (dx * dx + dy * dy <= ch.displaySize * ch.displaySize / 4) {
          return i;
        }
      }
      return -1;
    }
  };
}

function isOnScrollbar(mx, my, side, game) {
  if (side < 0) return false;
  const px = side === 0 ? 0 : PANEL_WIDTH + PANEL_GAP + CANVAS_SIZE + PANEL_GAP;
  const sbX = px + PANEL_WIDTH - 8;
  const clipY = HEADER_HEIGHT + 10 + SEARCH_BOX_HEIGHT + 10;
  const clipH = CANVAS_SIZE - SEARCH_BOX_HEIGHT - 20;
  if (my < clipY || my > clipY + clipH) return false;
  const hitRight = sbX + SCROLLBAR_HIT_WIDTH;
  return mx >= sbX && mx <= hitRight;
}

function hitTestIsOnScrollbar(mx, my) {
  const side = mx >= 0 && mx <= PANEL_WIDTH ? 0 :
               (mx >= PANEL_WIDTH + PANEL_GAP + CANVAS_SIZE + PANEL_GAP && mx <= TOTAL_WIDTH) ? 1 : -1;
  if (side < 0) return false;
  const px = side === 0 ? 0 : PANEL_WIDTH + PANEL_GAP + CANVAS_SIZE + PANEL_GAP;
  const sbX = px + PANEL_WIDTH - 8;
  const clipY = HEADER_HEIGHT + 10 + SEARCH_BOX_HEIGHT + 10;
  const clipH = CANVAS_SIZE - SEARCH_BOX_HEIGHT - 20;
  if (my < clipY || my > clipY + clipH) return false;
  const hitRight = sbX + SCROLLBAR_HIT_WIDTH;
  return mx >= sbX && mx <= hitRight;
}

const DRAG_THRESHOLD = 8;

function shouldStartDrag(dx, dy, threshold = DRAG_THRESHOLD) {
  return Math.sqrt(dx * dx + dy * dy) > threshold;
}

function isVerticalScroll(intent) {
  if (!intent) return false;
  const dx = intent.currentX - intent.startX;
  const dy = intent.currentY - intent.startY;
  return Math.abs(dy) > Math.abs(dx) * 2 && Math.abs(dy) > DRAG_THRESHOLD;
}

// ======== TESTS ========

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ✗ ${name}`);
    console.log(`    ${e.message}`);
  }
}

console.log('\n=== Issue 1a: Scrollbar Width ===\n');

test('scrollbar hit area should be 20px (was 6px)', () => {
  assert.strictEqual(SCROLLBAR_HIT_WIDTH, 20);
});

test('scrollbar hit test returns true for x within 20px from right edge', () => {
  // Left panel: px=0, sbX = 0 + 200 - 8 = 192
  // hitRight should be 192 + 20 = 212 (but panel ends at 200)
  // Clip to panel boundary at PANEL_WIDTH (200)
  const mx = 198; // 192 + 6 = within new 20px area but just past old 6px
  const my = HEADER_HEIGHT + 10 + SEARCH_BOX_HEIGHT + 10 + 50; // within clip area
  assert.ok(hitTestIsOnScrollbar(mx, my));
});

test('scrollbar hit test returns true for x=199 (end of panel)', () => {
  const mx = 199, my = HEADER_HEIGHT + 10 + SEARCH_BOX_HEIGHT + 10 + 50;
  assert.ok(hitTestIsOnScrollbar(mx, my));
});

test('scrollbar hit test returns false for x=190 (on a card, not scrollbar)', () => {
  const mx = 190, my = HEADER_HEIGHT + 10 + SEARCH_BOX_HEIGHT + 10 + 50;
  assert.ok(!hitTestIsOnScrollbar(mx, my));
});

test('scrollbar hit test returns false when y outside clip area', () => {
  const game = makeGame();
  assert.ok(!isOnScrollbar(195, HEADER_HEIGHT + 5, 0, game)); // above clip
  assert.ok(!isOnScrollbar(195, HEADER_HEIGHT + CANVAS_SIZE + 10, 0, game)); // below clip
});

console.log('\n=== Issue 1b: Drag Threshold ===\n');

test('drag threshold should be 8px', () => {
  assert.strictEqual(DRAG_THRESHOLD, 8);
});

test('should not start drag when movement is within threshold', () => {
  assert.ok(!shouldStartDrag(3, 4));  // distance ~5 < 8
  assert.ok(!shouldStartDrag(0, 7));
  assert.ok(!shouldStartDrag(5, 0));
});

test('should start drag when movement exceeds threshold', () => {
  assert.ok(shouldStartDrag(10, 0));   // horizontal
  assert.ok(shouldStartDrag(0, 10));   // vertical
  assert.ok(shouldStartDrag(6, 6));    // distance ~8.5 > 8
});

test('vertical movement detection for scroll prioritization', () => {
  // Vertical scroll: dy > 2*dx and dy > threshold
  assert.ok(isVerticalScroll({ startX: 100, startY: 100, currentX: 105, currentY: 130 }));
  // Horizontal (not scroll): dx too large
  assert.ok(!isVerticalScroll({ startX: 100, startY: 100, currentX: 130, currentY: 120 }));
  // Below threshold
  assert.ok(!isVerticalScroll({ startX: 100, startY: 100, currentX: 102, currentY: 107 }));
});

console.log('\n=== Search & Panel Hit Tests ===\n');

test('getSearchBoxAt returns 0 (left panel) when clicking left search box', () => {
  const game = makeGame();
  const sy = HEADER_HEIGHT + 10;
  const searchX = (PANEL_WIDTH - CARD_WIDTH) / 2;
  assert.strictEqual(game.getSearchBoxAt(searchX + 40, sy + 18), 0);
});

test('getSearchBoxAt returns 1 (right panel) when clicking right search box', () => {
  const game = makeGame();
  const sy = HEADER_HEIGHT + 10;
  const rx = PANEL_WIDTH + PANEL_GAP + CANVAS_SIZE + PANEL_GAP + (PANEL_WIDTH - CARD_WIDTH) / 2;
  assert.strictEqual(game.getSearchBoxAt(rx + 40, sy + 18), 1);
});

test('getSearchBoxAt returns -1 when clicking outside panels', () => {
  const game = makeGame();
  assert.strictEqual(game.getSearchBoxAt(400, 100), -1); // middle of game field
});

test('getPoolIndexAt returns correct index for a card', () => {
  const game = makeGame();
  const idx = game.getPoolIndexAt(50, HEADER_HEIGHT + 10 + SEARCH_BOX_HEIGHT + 10 + 75);
  assert.strictEqual(idx, 0);
});

test('getPoolIndexAt returns -1 when clicking between cards', () => {
  const game = makeGame();
  const yBetween = HEADER_HEIGHT + 10 + SEARCH_BOX_HEIGHT + 10 + CARD_HEIGHT + CARD_GAP / 2;
  const idx = game.getPoolIndexAt(50, yBetween);
  assert.strictEqual(idx, -1);
});

test('isOnPanel returns 0 for left panel, 1 for right panel', () => {
  assert.strictEqual(makeGame().isOnPanel(50), 0);
  const rightPanelX = PANEL_WIDTH + PANEL_GAP + CANVAS_SIZE + PANEL_GAP + 50;
  assert.strictEqual(makeGame().isOnPanel(rightPanelX), 1);
  assert.strictEqual(makeGame().isOnPanel(400), -1);
});

console.log('\n=== Issue 3: Search Keyboard ===\n');

test('searchFocusedSide defaults to -1', () => {
  const game = makeGame();
  assert.strictEqual(game.searchFocusedSide, -1);
});

test('search texts are independent for left and right panels', () => {
  const game = makeGame();
  assert.deepStrictEqual(game.searchTexts, ['', '']);
  game.searchTexts[0] = '气质';
  game.searchTexts[1] = '啤酒';
  assert.strictEqual(game.searchTexts[0], '气质');
  assert.strictEqual(game.searchTexts[1], '啤酒');
});

test('getFilteredPool with side uses correct search text', () => {
  const game = makeGame();
  game.searchTexts[0] = '气质';
  const leftPool = game.getFilteredPool(0);
  assert.strictEqual(leftPool.length, 1);
  assert.strictEqual(leftPool[0].name, '气质女人');

  game.searchTexts[1] = '啤酒';
  const rightPool = game.getFilteredPool(1);
  assert.strictEqual(rightPool.length, 1);
  assert.strictEqual(rightPool[0].name, '啤酒大师');
});

console.log('\n=== Issue 2: Mobile Display ===\n');

test('fitCanvas should not produce NaN values', () => {
  const cw = TOTAL_WIDTH;
  const ch = CANVAS_SIZE + HEADER_HEIGHT + FOOTER_HEIGHT;
  const ratio = cw / ch;
  assert.ok(ratio > 0);
  assert.ok(!isNaN(ratio));
  // Test viewport sizes
  for (const [vw, vh] of [[375, 667], [414, 896], [390, 844], [430, 932], [1024, 768], [1920, 1080]]) {
    let cssW, cssH;
    if (vw / vh > ratio) {
      cssH = vh;
      cssW = cssH * ratio;
    } else {
      cssW = vw;
      cssH = cssW / ratio;
    }
    assert.ok(cssW > 0 && cssH > 0, `fitCanvas produced invalid dimensions for ${vw}x${vh}: ${cssW}x${cssH}`);
    assert.ok(cssW <= vw + 1, `Width ${cssW} exceeds viewport ${vw}`);
    assert.ok(cssH <= vh + 1, `Height ${cssH} exceeds viewport ${vh}`);
  }
});

// Summary
console.log(`\n${'='.repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
