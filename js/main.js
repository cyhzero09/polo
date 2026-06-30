const CANVAS_SIZE = 750;
const HEADER_HEIGHT = 45;
const FOOTER_HEIGHT = 60;
const PANEL_WIDTH = 200;
const PANEL_GAP = 60;
const TOTAL_WIDTH = PANEL_WIDTH + PANEL_GAP + CANVAS_SIZE + PANEL_GAP + PANEL_WIDTH;
const GAME_SIZE = CANVAS_SIZE;
const GAME_OFFSET_X = PANEL_WIDTH + PANEL_GAP;
const GAME_OFFSET_Y = HEADER_HEIGHT;

const MOBILE_SEARCH_H = 32;
const MOBILE_TOP_PANEL_H = 200;
const MOBILE_BOTTOM_PANEL_H = 50;
const MOBILE_FOOTER_H = 50;
const MOBILE_TOTAL_W = CANVAS_SIZE;
const MOBILE_TOTAL_H = MOBILE_TOP_PANEL_H + CANVAS_SIZE + MOBILE_BOTTOM_PANEL_H + MOBILE_FOOTER_H;
const MOBILE_FIELD_X = 0;
const MOBILE_FIELD_Y = MOBILE_TOP_PANEL_H;
const MOBILE_PANEL_CARD_W = 100;
const MOBILE_PANEL_CARD_H = 120;
const MOBILE_PANEL_CARD_GAP = 10;
const MOBILE_PANEL_IMG_SIZE = 70;
const MOBILE_PANEL_SCROLL_H = 28;
const MOBILE_PANEL_INNER_H = MOBILE_TOP_PANEL_H - MOBILE_PANEL_SCROLL_H - MOBILE_SEARCH_H - 12;

let isMobile = false;
let fieldOffsetX = GAME_OFFSET_X;
let fieldOffsetY = GAME_OFFSET_Y;
let currentTotalW = TOTAL_WIDTH;
let currentTotalH = CANVAS_SIZE + HEADER_HEIGHT + FOOTER_HEIGHT;

const ORBIT_RADIUS = 200;
const ORBIT_SPEED = 2;

const SEARCH_BOX_HEIGHT = 36;
const CARD_HEIGHT = 150;
const CARD_GAP = 12;
const CARD_WIDTH = PANEL_WIDTH - 20;
const SCROLLBAR_HIT_WIDTH = 20;
const DRAG_THRESHOLD = 8;

const canvas = document.getElementById('game-canvas');

function detectMobile() {
  const sw = screen.width;
  const sh = screen.height;
  return sw < 768 && sw < sh;
}

isMobile = detectMobile();

function applyLayout() {
  if (isMobile) {
    canvas.width = MOBILE_TOTAL_W;
    canvas.height = MOBILE_TOTAL_H;
    fieldOffsetX = MOBILE_FIELD_X;
    fieldOffsetY = MOBILE_FIELD_Y;
    currentTotalW = MOBILE_TOTAL_W;
    currentTotalH = MOBILE_TOTAL_H;
  } else {
    canvas.width = TOTAL_WIDTH;
    canvas.height = CANVAS_SIZE + HEADER_HEIGHT + FOOTER_HEIGHT;
    fieldOffsetX = GAME_OFFSET_X;
    fieldOffsetY = GAME_OFFSET_Y;
    currentTotalW = TOTAL_WIDTH;
    currentTotalH = CANVAS_SIZE + HEADER_HEIGHT + FOOTER_HEIGHT;
  }
}

applyLayout();
const ctx = canvas.getContext('2d');

function fitCanvas() {
  const vw = window.visualViewport ? window.visualViewport.width : window.innerWidth;
  const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;

  const wasMobile = isMobile;
  const sw = screen.width;
  const sh = screen.height;
  isMobile = sw < 768 && sw < sh;

  if (isMobile !== wasMobile) {
    const oldFieldX = fieldOffsetX;
    const oldFieldY = fieldOffsetY;
    applyLayout();
    if (isMobile) {
      Game.mobileScrollOffsets = [0, 0];
    }
    if (Game.fieldCharacters.length > 0) {
      for (const ch of Game.fieldCharacters) {
        ch.x = ch.x - oldFieldX + fieldOffsetX;
        ch.y = ch.y - oldFieldY + fieldOffsetY;
        ch.x = Math.max(fieldOffsetX + ch.radius, Math.min(fieldOffsetX + CANVAS_SIZE - ch.radius, ch.x));
        ch.y = Math.max(fieldOffsetY + ch.radius, Math.min(fieldOffsetY + CANVAS_SIZE - ch.radius, ch.y));
      }
    }
    for (const proj of Game.projectiles) {
      if (!proj.alive) continue;
      proj.x = proj.x - oldFieldX + fieldOffsetX;
      proj.y = proj.y - oldFieldY + fieldOffsetY;
    }
  }

  const cw = canvas.width;
  const ch = canvas.height;
  const ratio = cw / ch;
  let cssW, cssH;
  if (vw / vh > ratio) {
    cssH = vh;
    cssW = cssH * ratio;
  } else {
    cssW = vw;
    cssH = cssW / ratio;
  }
  cssW = Math.floor(Math.min(cssW, vw));
  cssH = Math.floor(Math.min(cssH, vh));
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';

  const sil = document.getElementById('search-input-left');
  const sir = document.getElementById('search-input-right');
  const offscreenStyles = 'position:absolute;left:-9999px;top:0;width:1px;height:1px;opacity:0;pointer-events:none;border:none;outline:none;background:transparent;padding:0;margin:0;caret-color:transparent;color:transparent;';
  if (sil) sil.style.cssText = offscreenStyles;
  if (sir) sir.style.cssText = offscreenStyles;
}
window.addEventListener('resize', fitCanvas);
window.addEventListener('orientationchange', fitCanvas);
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', fitCanvas);
}
fitCanvas();

const BeerSound = new Audio('audio/alababier.mp3');
const YahuSound = new Audio('audio/yahu.mp3');
const AttackSound = new Audio('audio/attack.mp3');
AttackSound.volume = 0.5;
const EndingSound = new Audio('audio/dang.mp3');
EndingSound.volume = 0.2;
const GaowanSound = new Audio('audio/gaowan.mp3');
const ShuaKaSound = new Audio('audio/shuaka.mp3');
const CollisionSound = new Audio('audio/collision.mp3');
CollisionSound.volume = 0.4;
const HeavyPunchSound = new Audio('audio/heavypunch.mp3');
const LightPunchSound = new Audio('audio/lightpunch.mp3');
const MissSound = new Audio('audio/miss.mp3');

function tryDodge(ch) {
  if (ch.skillType === 'boxer' && !ch.isDodging && Math.random() < ch.dodgeChance) {
    ch.isDodging = true;
    ch.dodgeAnimTimer = 0.3;
    ch.dodgeDir = Math.random() > 0.5 ? 1 : -1;
    ch._dodgeSavedVx = ch.vx;
    ch._dodgeSavedVy = ch.vy;
    ch.vx = 0;
    ch.vy = 0;
    MissSound.currentTime = 0;
    MissSound.play().catch(() => {});
    return true;
  }
  return false;
}

const CharacterImages = {
  lady: null,
  worker: null,
  beermaster: null,
  beermasterFrames: [],
  gunman: null,
  shooting: null,
  guanzhang: null,
  gaowanfashe: null,
  boxer: null,
  boxer_body: null,
  boxer_hand: null,
  boxer_uppercut: null,
  boxer_heavypunch: null,
  boxer_miss: null,
  thinker: null,
  loaded: false
};

(function loadImages() {
  let loaded = 0;
  const total = 23;
  function checkAllLoaded() {
    loaded++;
    if (loaded < total) return;
    CharacterImages.loaded = true;
    Game.init();
    requestAnimationFrame(gameLoop);
  }

  const ladyImg = new Image();
  ladyImg.src = 'picture/gracewoman.png';
  ladyImg.onload = () => { CharacterImages.lady = ladyImg; checkAllLoaded(); };
  ladyImg.onerror = () => { checkAllLoaded(); };

  const workerImg = new Image();
  workerImg.src = 'picture/workholic.png';
  workerImg.onload = () => { CharacterImages.worker = workerImg; checkAllLoaded(); };
  workerImg.onerror = () => { checkAllLoaded(); };

  const beerMasterImg = new Image();
  beerMasterImg.src = 'picture/beermaster/1.png';
  beerMasterImg.onload = () => { CharacterImages.beermaster = beerMasterImg; checkAllLoaded(); };
  beerMasterImg.onerror = () => { checkAllLoaded(); };

  for (let i = 1; i <= 10; i++) {
    const frame = new Image();
    frame.src = `picture/beermaster/${i}.png`;
    const idx = i - 1;
    frame.onload = () => { CharacterImages.beermasterFrames[idx] = frame; checkAllLoaded(); };
    frame.onerror = () => { checkAllLoaded(); };
  }

  const gunmanImg = new Image();
  gunmanImg.src = 'picture/gunman.png';
  gunmanImg.onload = () => { CharacterImages.gunman = gunmanImg; checkAllLoaded(); };
  gunmanImg.onerror = () => { checkAllLoaded(); };

  const shootingImg = new Image();
  shootingImg.src = 'picture/shooting.png';
  shootingImg.onload = () => { CharacterImages.shooting = shootingImg; checkAllLoaded(); };
  shootingImg.onerror = () => { checkAllLoaded(); };

  const guanzhangImg = new Image();
  guanzhangImg.src = 'picture/guanzhang.png';
  guanzhangImg.onload = () => { CharacterImages.guanzhang = guanzhangImg; checkAllLoaded(); };
  guanzhangImg.onerror = () => { checkAllLoaded(); };

  const gaowanfasheImg = new Image();
  gaowanfasheImg.src = 'picture/gaowanfashe.png';
  gaowanfasheImg.onload = () => { CharacterImages.gaowanfashe = gaowanfasheImg; checkAllLoaded(); };
  gaowanfasheImg.onerror = () => { checkAllLoaded(); };

  const boxerImg = new Image();
  boxerImg.src = 'picture/boxingmaster/boxer.png';
  boxerImg.onload = () => { CharacterImages.boxer = boxerImg; checkAllLoaded(); };
  boxerImg.onerror = () => { checkAllLoaded(); };

  const bodyImg = new Image();
  bodyImg.src = 'picture/boxingmaster/body.png';
  bodyImg.onload = () => { CharacterImages.boxer_body = bodyImg; checkAllLoaded(); };
  bodyImg.onerror = () => { checkAllLoaded(); };

  const handImg = new Image();
  handImg.src = 'picture/boxingmaster/hand.png';
  handImg.onload = () => { CharacterImages.boxer_hand = handImg; checkAllLoaded(); };
  handImg.onerror = () => { checkAllLoaded(); };

  const uppercutImg = new Image();
  uppercutImg.src = 'picture/boxingmaster/uppercut.png';
  uppercutImg.onload = () => { CharacterImages.boxer_uppercut = uppercutImg; checkAllLoaded(); };
  uppercutImg.onerror = () => { checkAllLoaded(); };

  const heavypunchImg = new Image();
  heavypunchImg.src = 'picture/boxingmaster/heavypunch.png';
  heavypunchImg.onload = () => { CharacterImages.boxer_heavypunch = heavypunchImg; checkAllLoaded(); };
  heavypunchImg.onerror = () => { checkAllLoaded(); };

  const missImg = new Image();
  missImg.src = 'picture/boxingmaster/miss.png';
  missImg.onload = () => { CharacterImages.boxer_miss = missImg; checkAllLoaded(); };
  missImg.onerror = () => { checkAllLoaded(); };

  const thinkerImg = new Image();
  thinkerImg.src = 'picture/thinking.png';
  thinkerImg.onload = () => { CharacterImages.thinker = thinkerImg; checkAllLoaded(); };
  thinkerImg.onerror = () => { checkAllLoaded(); };
})();

const CHARACTER_POOL = [
  {
    id: 1,
    name: '气质女人',
    color: '#FF6B9D',
    radius: 75,
    displaySize: 150,
    octagonRadius: 80,
    skillType: 'nail',
    imageKey: 'lady'
  },
  {
    id: 2,
    name: '工作狂人',
    color: '#4ECDC4',
    radius: 75,
    displaySize: 150,
    octagonRadius: 80,
    skillType: 'briefcase',
    imageKey: 'worker'
  },
  {
    id: 3,
    name: '啤酒大师',
    color: '#D4A017',
    radius: 75,
    displaySize: 150,
    octagonRadius: 80,
    skillType: 'beer',
    imageKey: 'beermaster',
    animKey: 'beermasterFrames'
  },
  {
    id: 4,
    name: '西部牛仔',
    color: '#C87533',
    radius: 75,
    displaySize: 150,
    octagonRadius: 80,
    skillType: 'bullet',
    imageKey: 'gunman',
    shootingImageKey: 'shooting'
  },
  {
    id: 5,
    name: '搞完館長',
    color: '#1a1a1a',
    radius: 75,
    displaySize: 150,
    octagonRadius: 80,
    skillType: 'gaowan',
    skillCooldown: 3000,
    imageKey: 'guanzhang',
    shootingImageKey: 'gaowanfashe'
  },
  {
    id: 6,
    name: '拳擊高手',
    color: '#e74c3c',
    radius: 75,
    displaySize: 150,
    octagonRadius: 80,
    skillType: 'boxer',
    imageKey: 'boxer',
    bodyImageKey: 'boxer_body',
    handImageKey: 'boxer_hand',
    uppercutImageKey: 'boxer_uppercut',
    heavyPunchImageKey: 'boxer_heavypunch',
    dodgeImageKey: 'boxer_miss'
  },
  {
    id: 7,
    name: '沉思男人',
    color: '#9C27B0',
    radius: 75,
    displaySize: 150,
    octagonRadius: 80,
    skillType: 'thinker',
    imageKey: 'thinker'
  }
];

const Game = {
  state: 'INIT',
  fieldCharacters: [],
  projectiles: [],
  floatingTexts: [],
  countdown: 0,
  lastTime: 0,
  drag: null,
  searchTexts: ['', ''],
  searchFocusedSide: -1,
  endingPlayed: false,
  scrollOffsets: [0, 0],
  mobileScrollOffsets: [0, 0],
  scrollDrag: null,
  _pendingDrag: null,
  _pendingDragStart: null,

  getFieldOffsetX() { return fieldOffsetX; },
  getFieldOffsetY() { return fieldOffsetY; },

  init() {
    this.fieldCharacters = [];
    this.projectiles = [];
    this.floatingTexts = [];
    this.state = 'INIT';
    this.countdown = 0;
    this.lastTime = 0;
    this.drag = null;
    this.searchTexts = ['', ''];
    this.searchFocusedSide = -1;
    if (searchInputLeft) searchInputLeft.value = '';
    if (searchInputRight) searchInputRight.value = '';
    this.endingPlayed = false;
    this.scrollOffsets = [0, 0];
    this.mobileScrollOffsets = [0, 0];
    this.scrollDrag = null;
    this._pendingDrag = null;
    this._pendingDragStart = null;
  },

  getFilteredPool(side) {
    const q = (this.searchTexts[side] || '').toLowerCase();
    if (!q) return CHARACTER_POOL;
    return CHARACTER_POOL.filter(c => c.name.toLowerCase().includes(q));
  },

  start() {
    if (this.fieldCharacters.length < 2) return;
    this.state = 'COUNTDOWN';
    this.countdown = 3;
    const sq = 100;
    const cx0 = fieldOffsetX + CANVAS_SIZE / 4;
    const cx1 = fieldOffsetX + CANVAS_SIZE * 3 / 4;
    const cy = fieldOffsetY + CANVAS_SIZE / 2;
    this.fieldCharacters[0].x = cx0 + (Math.random() - 0.5) * sq;
    this.fieldCharacters[0].y = cy + (Math.random() - 0.5) * sq;
    this.fieldCharacters[1].x = cx1 + (Math.random() - 0.5) * sq;
    this.fieldCharacters[1].y = cy + (Math.random() - 0.5) * sq;
    for (const ch of this.fieldCharacters) {
      const angle = Math.random() * Math.PI * 2;
      ch.vx = Math.cos(angle) * SPEED;
      ch.vy = Math.sin(angle) * SPEED;
      if (ch.skillType === 'bullet') {
        ch.burstCooldownTimer = ch.burstCooldown;
      }
    }
  },

  restart() {
    this.init();
  },

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
    }
  },

  getPoolIndexAt(mx, my) {
    if (isMobile) {
      for (let side = 0; side < 2; side++) {
        const panelY = side === 0 ? 0 : MOBILE_FIELD_Y + CANVAS_SIZE;
        const innerY = panelY + MOBILE_SEARCH_H + 8;
        const innerH = MOBILE_PANEL_INNER_H;
        if (my < innerY || my > innerY + innerH) continue;
        const filtered = this.getFilteredPool(side);
        const scrollOff = this.mobileScrollOffsets[side] || 0;
        for (let i = 0; i < filtered.length; i++) {
          const cx = 10 + i * (MOBILE_PANEL_CARD_W + MOBILE_PANEL_CARD_GAP) - scrollOff;
          if (mx >= cx && mx <= cx + MOBILE_PANEL_CARD_W) {
            return CHARACTER_POOL.indexOf(filtered[i]);
          }
        }
      }
      return -1;
    }
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
    if (isMobile) {
      const panelY = 0;
      const searchY = panelY + 4;
      if (my >= searchY && my <= searchY + MOBILE_SEARCH_H && mx >= 10 && mx <= CANVAS_SIZE - 10) {
        return 0;
      }
      return -1;
    }
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
  },

  isInField(mx, my) {
    return mx >= fieldOffsetX && mx <= fieldOffsetX + CANVAS_SIZE &&
           my >= fieldOffsetY && my <= fieldOffsetY + CANVAS_SIZE;
  },

  isOnPanel(mx) {
    if (isMobile) return -1;
    if (mx >= 0 && mx <= PANEL_WIDTH) return 0;
    if (mx >= PANEL_WIDTH + PANEL_GAP + CANVAS_SIZE + PANEL_GAP && mx <= TOTAL_WIDTH) return 1;
    return -1;
  },

  isOnMobilePanel(my) {
    if (!isMobile) return -1;
    if (my >= 0 && my < MOBILE_FIELD_Y) return 0;
    if (my >= MOBILE_FIELD_Y + CANVAS_SIZE && my < MOBILE_FIELD_Y + CANVAS_SIZE + MOBILE_BOTTOM_PANEL_H) return 1;
    return -1;
  },

  getMaxScroll(side) {
    const filtered = this.getFilteredPool(side);
    if (isMobile) {
      const cardListWidth = filtered.length * (MOBILE_PANEL_CARD_W + MOBILE_PANEL_CARD_GAP);
      const visibleWidth = CANVAS_SIZE - 20;
      return Math.max(0, cardListWidth - visibleWidth);
    }
    const cardListHeight = filtered.length * (CARD_HEIGHT + CARD_GAP);
    const visibleHeight = CANVAS_SIZE - SEARCH_BOX_HEIGHT - 20;
    return Math.max(0, cardListHeight - visibleHeight);
  },

  update(dt) {
    if (this.state === 'COUNTDOWN') {
      this.countdown -= dt;
      if (this.countdown <= 0) {
        this.state = 'PLAYING';
        this.countdown = 0;
      }
      return;
    }

    if (this.state !== 'PLAYING' && this.state !== 'GAME_OVER') return;

    if (this.state === 'GAME_OVER') {
      for (const ch of this.fieldCharacters) {
        if (!ch.alive) continue;
        ch.update(dt);
        if (Physics.resolveBoundary(ch, GAME_SIZE, GAME_SIZE, fieldOffsetX, fieldOffsetY) && ch.collisionSoundCooldown <= 0) {
          ch.collisionSoundCooldown = 0.2;
          CollisionSound.currentTime = 0;
          CollisionSound.play().catch(() => {});
        }
      }
      for (let i = 0; i < this.fieldCharacters.length; i++) {
        for (let j = i + 1; j < this.fieldCharacters.length; j++) {
          const c1 = this.fieldCharacters[i];
          const c2 = this.fieldCharacters[j];
          if (!c1.alive || !c2.alive) continue;
          Physics.resolveCharacterCollision(c1, c2);
        }
      }
      return;
    }

    for (const ch of this.fieldCharacters) {
      if (!ch.alive) continue;

      if (ch.skillType === 'boxer' && ch.isPaused) {
        ch.vx = 0;
        ch.vy = 0;
      }

      const result = ch.update(dt);
      const hitBoundary = Physics.resolveBoundary(ch, GAME_SIZE, GAME_SIZE, fieldOffsetX, fieldOffsetY) && ch.collisionSoundCooldown <= 0;
      if (hitBoundary) {
        ch.collisionSoundCooldown = 0.2;
        CollisionSound.currentTime = 0;
        CollisionSound.play().catch(() => {});
      }
      if (ch.isDodging && ch.dodgeDir !== 0) {
        const minX = fieldOffsetX + ch.radius;
        const maxX = fieldOffsetX + GAME_SIZE - ch.radius;
        if ((ch.dodgeDir > 0 && ch.x >= maxX) || (ch.dodgeDir < 0 && ch.x <= minX)) {
          ch.isDodging = false;
          ch.dodgeAnimTimer = 0;
          ch.dodgeDir = 0;
          ch.vx = ch._dodgeSavedVx;
          ch.vy = ch._dodgeSavedVy;
          if (ch.vx === 0) ch.vx = (ch.x >= maxX ? -1 : 1) * SPEED;
        }
      }

      if (ch.skillType === 'boxer') {
        this.updateBoxer(ch, dt);
      } else if (ch.skillType === 'bullet') {
        if (result === 'fire') {
          this.fireBulletLine(ch);
        }
        if (!ch.isShooting && ch.burstCooldownTimer <= 0) {
          const enemy = ch.findNearestEnemy(this.fieldCharacters);
          if (enemy && ch.isHorizontallyAlignedWith(enemy)) {
            ch.isShooting = true;
            ch.burstDirection = (enemy.x - ch.x) > 0 ? 1 : -1;
            ch.fireTimer = 0;
            ch.burstCount = 1;
            ch.shootingAnimTimer = 0;
            this.fireBulletLine(ch);
          }
        }
      } else if (ch.skillType === 'thinker') {
        // no-op: orbit is handled separately
      } else {
        if (ch.skillTimer >= ch.skillCooldown) {
          this.fireSkill(ch);
          ch.skillTimer -= ch.skillCooldown;
        }
      }
    }

    for (let i = 0; i < this.fieldCharacters.length; i++) {
      for (let j = i + 1; j < this.fieldCharacters.length; j++) {
        const c1 = this.fieldCharacters[i];
        const c2 = this.fieldCharacters[j];
        if (!c1.alive || !c2.alive) continue;
        Physics.resolveCharacterCollision(c1, c2);
      }
    }

    for (const proj of this.projectiles) {
      if (!proj.alive) continue;
      proj.update(dt);

      if (proj.type === 'bullet') continue;

      if (proj.type === 'shockwave') {
        for (const ch of this.fieldCharacters) {
          if (!ch.alive || ch.id === proj.ownerId) continue;
          if (proj.hitTargets.has(ch.id)) continue;
          if (Physics.dist(proj.x, proj.y, ch.x, ch.y) < proj.radius) {
            if (tryDodge(ch)) continue;
            ch.takeDamage(proj.damage);
            proj.hitTargets.add(ch.id);
            const existing = this.floatingTexts.find(ft =>
              ft.targetId === ch.id && ft.life > 0.85
            );
            if (existing) {
              existing.totalDmg += proj.damage;
              existing.text = `-${existing.totalDmg}`;
              existing.life = 1;
            } else {
              this.floatingTexts.push({
                x: ch.x + (Math.random() - 0.5) * 40,
                y: ch.y - ch.radius - 10,
                text: `-${proj.damage}`,
                alpha: 1,
                vx: (Math.random() - 0.5) * 60,
                vy: -40 - Math.random() * 30,
                life: 1,
                targetId: ch.id,
                totalDmg: proj.damage
              });
            }
          }
        }
        continue;
      }

      let isOrbiting = false;

      if (proj.isOrbiting) {
        if (!proj.orbitingThinker || !proj.orbitingThinker.alive) {
          proj.isOrbiting = false;
          delete proj._prevOrbitDist;
        } else {
          proj.orbitAngle -= ORBIT_SPEED * dt;
          proj.x = proj.orbitingThinker.x + Math.cos(proj.orbitAngle) * ORBIT_RADIUS;
          proj.y = proj.orbitingThinker.y + Math.sin(proj.orbitAngle) * ORBIT_RADIUS;
          proj.x = Math.max(fieldOffsetX + proj.radius, Math.min(fieldOffsetX + GAME_SIZE - proj.radius, proj.x));
          proj.y = Math.max(fieldOffsetY + proj.radius, Math.min(fieldOffsetY + GAME_SIZE - proj.radius, proj.y));
          isOrbiting = true;
        }
      }

      if (!proj.isOrbiting) {
        if (!proj._prevOrbitDist) proj._prevOrbitDist = {};
        for (const ch of this.fieldCharacters) {
          if (!ch.alive || ch.skillType !== 'thinker') continue;
          if (ch.id === proj.ownerId) continue;

          const dist = Math.sqrt((proj.x - ch.x) ** 2 + (proj.y - ch.y) ** 2);
          const prevDist = proj._prevOrbitDist[ch.id];

          if (prevDist !== undefined) {
            const crossedIn = prevDist >= ORBIT_RADIUS && dist < ORBIT_RADIUS;
            const crossedOut = prevDist < ORBIT_RADIUS && dist >= ORBIT_RADIUS;
            if (crossedIn || crossedOut) {
              const angle = Math.atan2(proj.y - ch.y, proj.x - ch.x);
              proj.isOrbiting = true;
              proj.orbitAngle = angle;
              proj.orbitingThinker = ch;
              proj.x = ch.x + Math.cos(angle) * ORBIT_RADIUS;
              proj.y = ch.y + Math.sin(angle) * ORBIT_RADIUS;
              isOrbiting = true;
              break;
            }
          }

          proj._prevOrbitDist[ch.id] = dist;
        }
      }

      if (!isOrbiting) {
        let hitWall = false;
        if (proj.x - proj.radius < fieldOffsetX) { proj.x = fieldOffsetX + proj.radius; hitWall = true; }
        if (proj.x + proj.radius > fieldOffsetX + GAME_SIZE) { proj.x = fieldOffsetX + GAME_SIZE - proj.radius; hitWall = true; }
        if (proj.y - proj.radius < fieldOffsetY) { proj.y = fieldOffsetY + proj.radius; hitWall = true; }
        if (proj.y + proj.radius > fieldOffsetY + GAME_SIZE) { proj.y = fieldOffsetY + GAME_SIZE - proj.radius; hitWall = true; }

        if (hitWall) {
          if (proj.type === 'briefcase') {
            const papers = splitBriefcase(proj);
            for (const p of papers) this.projectiles.push(p);
          }
          proj.alive = false;
          continue;
        }
      }

      if (proj.type === 'briefcase' && proj._inContact) {
        for (const chId of proj._inContact) {
          const ch = this.fieldCharacters.find(c => c.id === chId);
          if (!ch || !ch.alive || !Physics.isCircleOctagonColliding(proj, ch)) {
            proj._inContact.delete(chId);
          }
        }
      }

      for (const ch of this.fieldCharacters) {
        if (!ch.alive) continue;
        if (ch.id === proj.ownerId && (!isOrbiting || proj.age < 1)) continue;
        if (proj._inContact && proj._inContact.has(ch.id)) continue;

          if (Physics.isCircleOctagonColliding(proj, ch)) {
            if (tryDodge(ch)) {
              if (proj.type !== 'briefcase') proj.alive = false;
              break;
            }
            ch.takeDamage(proj.damage);
            if (proj._inContact) proj._inContact.add(ch.id);
            const existing = this.floatingTexts.find(ft =>
              ft.targetId === ch.id && ft.life > 0.85
            );
            if (existing) {
              existing.totalDmg += proj.damage;
              existing.text = `-${existing.totalDmg}`;
              existing.life = 1;
            } else {
              this.floatingTexts.push({
                x: ch.x + (Math.random() - 0.5) * 40,
                y: ch.y - ch.radius - 10,
                text: `-${proj.damage}`,
                alpha: 1,
                vx: (Math.random() - 0.5) * 60,
                vy: -40 - Math.random() * 30,
                life: 1,
                targetId: ch.id,
                totalDmg: proj.damage
              });
            }
          if (proj.type !== 'briefcase') {
            proj.alive = false;
          }
          break;
        }
      }
    }

    this.projectiles = this.projectiles.filter(p => p.alive);

    for (const ft of this.floatingTexts) {
      ft.life -= dt;
      ft.x += ft.vx * dt;
      ft.y += ft.vy * dt;
      ft.alpha = Math.max(0, ft.life);
    }
    this.floatingTexts = this.floatingTexts.filter(ft => ft.life > 0);

    const alive = this.fieldCharacters.filter(c => c.alive);
    if (alive.length <= 1 && this.state !== 'GAME_OVER') {
      this.state = 'GAME_OVER';
      this.endingPlayed = false;
    }
    if (this.state === 'GAME_OVER' && !this.endingPlayed) {
      this.endingPlayed = true;
      EndingSound.currentTime = 0;
      EndingSound.play().catch(() => {});
    }
  },

  fireBulletLine(ch) {
    const dir = ch.burstDirection;
    let endX;
    let hitEnemy = null;

    for (const other of this.fieldCharacters) {
      if (!other.alive || other.id === ch.id) continue;
      const half = other.displaySize / 2;
      if (ch.y >= other.y - half && ch.y <= other.y + half) {
        hitEnemy = other;
        break;
      }
    }

      if (hitEnemy) {
        if (!tryDodge(hitEnemy)) {
          hitEnemy.takeDamage(BULLET_DAMAGE);
          const existing = this.floatingTexts.find(ft =>
            ft.targetId === hitEnemy.id && ft.life > 0.7
          );
          if (existing) {
            existing.totalDmg += BULLET_DAMAGE;
            existing.text = `-${existing.totalDmg}`;
            existing.life = 1;
          } else {
            this.floatingTexts.push({
              x: hitEnemy.x + (Math.random() - 0.5) * 40,
              y: hitEnemy.y - hitEnemy.radius - 10,
              text: `-${BULLET_DAMAGE}`,
              alpha: 1,
              vx: (Math.random() - 0.5) * 60,
              vy: -40 - Math.random() * 30,
              life: 1,
              targetId: hitEnemy.id,
              totalDmg: BULLET_DAMAGE
            });
          }
        }
        endX = hitEnemy.x;
      } else {
        endX = dir > 0 ? fieldOffsetX + CANVAS_SIZE : fieldOffsetX;
      }

    const ray = createBulletLine(ch.x, ch.y, endX, ch.id);
    this.projectiles.push(ray);
  },

  fireSkill(ch) {
    const target = ch.findNearestEnemy(this.fieldCharacters);
    if (!target) return;
    const dx = target.x - ch.x;
    const dy = target.y - ch.y;
    let proj = null;
    switch (ch.skillType) {
      case 'nail':
        proj = createNail(ch.x, ch.y, dx, dy, ch.id);
        YahuSound.currentTime = 0;
        YahuSound.play().catch(() => {});
        break;
      case 'briefcase':
        proj = createBriefcase(ch.x, ch.y, dx, dy, ch.id);
        ShuaKaSound.currentTime = 0;
        ShuaKaSound.play().catch(() => {});
        break;
      case 'beer':
        proj = createBeerBottle(ch.x, ch.y, dx, dy, ch.id);
        BeerSound.currentTime = 0;
        BeerSound.play().catch(() => {});
        break;
      case 'gaowan':
        ch.isAttacking = true;
        ch.attackAnimTimer = 1.5;
        ch.facingRight = dx >= 0;
        GaowanSound.currentTime = 0;
        GaowanSound.play().catch(() => {});
        this.projectiles.push(createShockwave(ch.x, ch.y, ch.id));
        proj = createGaowan(ch.x, ch.y, dx, dy, ch.id);
        break;
    }
    if (proj) {
      this.projectiles.push(proj);
    }
  },

  updateBoxer(ch, dt) {
    ch.punchTimer -= dt;

    const enemy = ch.findNearestEnemy(this.fieldCharacters);
    if (!enemy) return;

    const dx = enemy.x - ch.x;
    const dy = enemy.y - ch.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    ch.facingRight = dx >= 0;
    ch.targetEnemy = enemy;

    if (ch.isPaused) {
      ch.pauseTimer -= dt;
      if (ch.pauseTimer <= 0) {
        ch.isPaused = false;
        ch.vx = Math.cos(ch.savedAngle) * SPEED;
        ch.vy = Math.sin(ch.savedAngle) * SPEED;
      }
    }

    if (!ch.isPaused && ch.punchTimer <= 0 && dist < ch.punchRange) {
      ch.punchTimer = 0.1;
      let dmg, punchType, sound;

      if (dy < -40 && Math.abs(dx) < 60) {
        dmg = 125;
        punchType = 'uppercut';
        enemy.vx = Math.sign(dx) * 200;
        enemy.vy = -500;
        enemy.knockbackTimer = 0.3;
        ch.vx = -Math.sign(dx) * 300;
        ch.knockbackTimer = 0.3;
        sound = HeavyPunchSound;
      } else if (Math.abs(dy) < 30) {
        dmg = 100;
        punchType = 'heavy';
        enemy.vx = Math.sign(dx) * 500;
        enemy.vy = 0;
        enemy.knockbackTimer = 0.3;
        ch.savedAngle = Math.atan2(ch.vy, ch.vx);
        ch.isPaused = true;
        ch.pauseTimer = 0.1;
        ch.vx = 0;
        ch.vy = 0;
        sound = HeavyPunchSound;
      } else {
        dmg = 45;
        punchType = 'normal';
        const knockAngle = Math.atan2(dy, dx);
        enemy.vx = Math.cos(knockAngle) * 200;
        enemy.vy = Math.sin(knockAngle) * 200;
        ch.savedAngle = Math.atan2(ch.vy, ch.vx);
        ch.isPaused = true;
        ch.pauseTimer = 0.1;
        ch.vx = 0;
        ch.vy = 0;
        sound = LightPunchSound;
      }

      enemy.takeDamage(dmg, true);
      sound.currentTime = 0;
      sound.play().catch(() => {});

      ch.lastPunchType = punchType;
      ch.punchAnimTimer = 0.1;

      const existing = this.floatingTexts.find(ft =>
        ft.targetId === enemy.id && ft.life > 0.85
      );
      if (existing) {
        existing.totalDmg += dmg;
        existing.text = `-${existing.totalDmg}`;
        existing.life = 1;
      } else {
        this.floatingTexts.push({
          x: enemy.x + (Math.random() - 0.5) * 40,
          y: enemy.y - enemy.radius - 10,
          text: `-${dmg}`,
          alpha: 1,
          vx: (Math.random() - 0.5) * 60,
          vy: -40 - Math.random() * 30,
          life: 1,
          targetId: enemy.id,
          totalDmg: dmg
        });
      }
    }
  },

  render() {
    Renderer.clear(ctx, currentTotalW, currentTotalH);
    Renderer.drawBorder(ctx, CANVAS_SIZE, CANVAS_SIZE);

    if (this.state === 'INIT') {
      if (isMobile) {
        Renderer.drawMobilePanels(ctx, this.fieldCharacters, this.drag, this.searchTexts, this.searchFocusedSide, this.mobileScrollOffsets);
      } else {
        Renderer.drawCharacterPanels(ctx, PANEL_WIDTH, TOTAL_WIDTH, this.fieldCharacters, this.drag, this.searchTexts, this.searchFocusedSide, this.scrollOffsets);
      }
    }

    for (const ch of this.fieldCharacters) {
      if (!ch.alive) continue;
      Renderer.drawCharacter(ctx, ch);
    }

    for (const proj of this.projectiles) {
      if (!proj.alive) continue;
      Renderer.drawProjectile(ctx, proj);
    }

    for (const ft of this.floatingTexts) {
      Renderer.drawDamageText(ctx, ft);
    }

    if (this.drag) {
      Renderer.drawDragCharacter(ctx, this.drag);
    }

    switch (this.state) {
      case 'INIT':
        UI.drawSelectionScreen(ctx, currentTotalW, currentTotalH, this.fieldCharacters);
        break;
      case 'COUNTDOWN':
        Renderer.drawVSInfo(ctx, currentTotalW, this.fieldCharacters);
        UI.drawCountdown(ctx, currentTotalW, currentTotalH, this.countdown);
        break;
      case 'PLAYING':
        Renderer.drawVSInfo(ctx, currentTotalW, this.fieldCharacters);
        UI.drawPauseButton(ctx, currentTotalW, currentTotalH);
        break;
      case 'PAUSED':
        Renderer.drawVSInfo(ctx, currentTotalW, this.fieldCharacters);
        UI.drawPausedOverlay(ctx, currentTotalW, currentTotalH);
        break;
      case 'GAME_OVER':
        const winner = this.fieldCharacters.find(c => c.alive) || null;
        Renderer.drawVSInfo(ctx, currentTotalW, this.fieldCharacters, winner);
        UI.drawRestartHint(ctx, currentTotalW, currentTotalH);
        break;
    }
  }
};

const searchInputLeft = document.getElementById('search-input-left');
const searchInputRight = document.getElementById('search-input-right');

function gameLoop(timestamp) {
  if (Game.lastTime === 0) {
    Game.lastTime = timestamp;
    requestAnimationFrame(gameLoop);
    return;
  }
  const dt = Math.min((timestamp - Game.lastTime) / 1000, 0.05);
  Game.lastTime = timestamp;
  Game.update(dt);
  Game.render();
  requestAnimationFrame(gameLoop);
}

canvas.addEventListener('pointerdown', (e) => {
  if (window._isPinching) return;
  e.preventDefault();
  if (Game.state !== 'INIT') return;
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
  const my = (e.clientY - rect.top) * (canvas.height / rect.height);

  Game._pendingDrag = null;
  Game._pendingDragStart = null;

  // 1. Search box (focus overlay input for mobile keyboard)
  const searchSide = Game.getSearchBoxAt(mx, my);
  if (searchSide >= 0) {
    Game.searchFocusedSide = searchSide;
    if (searchSide === 0 && searchInputLeft) searchInputLeft.focus();
    else if (searchSide === 1 && searchInputRight) searchInputRight.focus();
    return;
  }
  Game.searchFocusedSide = -1;
  if (searchInputLeft) searchInputLeft.blur();
  if (searchInputRight) searchInputRight.blur();

  // 2. Field character - record pending
  const fieldIdx = Game.getFieldIndexAt(mx, my);
  if (fieldIdx >= 0) {
    const ch = Game.fieldCharacters[fieldIdx];
    Game._pendingDrag = {
      type: 'field',
      fieldIndex: fieldIdx,
      config: CHARACTER_POOL.find(p => p.id === ch.id),
      offsetX: mx - ch.x,
      offsetY: my - ch.y
    };
    Game._pendingDragStart = { x: mx, y: my };
    return;
  }

  // 3. Pool character card - record pending (before panel scroll)
  const poolIdx = Game.getPoolIndexAt(mx, my);
  if (poolIdx >= 0) {
    if (Game.fieldCharacters.length < 2) {
      const config = CHARACTER_POOL[poolIdx];
      if (!Game.fieldCharacters.some(c => c.id === config.id)) {
        Game._pendingDrag = {
          type: 'pool',
          config: config,
          offsetX: 0,
          offsetY: 0
        };
        Game._pendingDragStart = { x: mx, y: my };
        return;
      }
    }
  }

  // 3. Scrollbar / mobile panel scroll
  if (isMobile) {
    const mobilePanelSide = Game.isOnMobilePanel(my);
    if (mobilePanelSide >= 0) {
      Game.scrollDrag = { side: mobilePanelSide, startX: mx, startOffset: Game.mobileScrollOffsets[mobilePanelSide] || 0, type: 'mobile-hdrag' };
      return;
    }
  } else {
    const panelSide = Game.isOnPanel(mx);
    if (panelSide >= 0) {
      const px = panelSide === 0 ? 0 : PANEL_WIDTH + PANEL_GAP + CANVAS_SIZE + PANEL_GAP;
      const clipY = HEADER_HEIGHT + 10 + SEARCH_BOX_HEIGHT + 10;
      const clipH = CANVAS_SIZE - SEARCH_BOX_HEIGHT - 20;
      const sbLeft = px + PANEL_WIDTH - SCROLLBAR_HIT_WIDTH;
      const sbRight = px + PANEL_WIDTH;
      if (my >= clipY && my <= clipY + clipH && mx >= sbLeft && mx <= sbRight) {
        const filtered = Game.getFilteredPool(panelSide);
        const cardListHeight = filtered.length * (CARD_HEIGHT + CARD_GAP);
        const maxScroll = Game.getMaxScroll(panelSide);
        const thumbH = Math.max(20, clipH * clipH / Math.max(cardListHeight, clipH));
        const trackH = clipH - thumbH;
        const thumbTop = clipY + (trackH > 0 ? (Game.scrollOffsets[panelSide] / Math.max(maxScroll, 1)) * trackH : 0);
        if (my >= thumbTop && my <= thumbTop + thumbH) {
          Game.scrollDrag = { side: panelSide, startY: my - thumbTop, type: 'thumb' };
        } else {
          const clickRatio = (my - clipY) / clipH;
          Game.scrollOffsets[panelSide] = Math.max(0, Math.min(maxScroll, clickRatio * maxScroll));
        }
        return;
      }
    }
  }

  // 4. Panel background scroll drag (desktop only)
  if (!isMobile) {
    const panelSide = Game.isOnPanel(mx);
    if (panelSide >= 0) {
      const px = panelSide === 0 ? 0 : PANEL_WIDTH + PANEL_GAP + CANVAS_SIZE + PANEL_GAP;
      const clipY = HEADER_HEIGHT + 10 + SEARCH_BOX_HEIGHT + 10;
      const clipH = CANVAS_SIZE - SEARCH_BOX_HEIGHT - 20;
      if (my >= clipY && my <= clipY + clipH) {
        Game.scrollDrag = { side: panelSide, startY: my, startOffset: Game.scrollOffsets[panelSide], type: 'drag' };
      }
    }
  }
});

canvas.addEventListener('pointermove', (e) => {
  if (window._isPinching) return;
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
  const my = (e.clientY - rect.top) * (canvas.height / rect.height);

  // Handle active character drag
  if (Game.drag) {
    Game.drag.x = mx;
    Game.drag.y = my;
    return;
  }

  // Handle scroll drag
  if (Game.scrollDrag) {
    const side = Game.scrollDrag.side;
    const maxScroll = Game.getMaxScroll(side);
    if (Game.scrollDrag.type === 'mobile-hdrag') {
      Game.mobileScrollOffsets[side] = Math.max(0, Math.min(maxScroll,
        Game.scrollDrag.startOffset - (mx - Game.scrollDrag.startX)));
    } else if (Game.scrollDrag.type === 'thumb') {
      const clipY = HEADER_HEIGHT + 10 + SEARCH_BOX_HEIGHT + 10;
      const clipH = CANVAS_SIZE - SEARCH_BOX_HEIGHT - 20;
      const filtered = Game.getFilteredPool(side);
      const cardListHeight = filtered.length * (CARD_HEIGHT + CARD_GAP);
      const thumbH = Math.max(20, clipH * clipH / Math.max(cardListHeight, clipH));
      const trackH = clipH - thumbH;
      const ratio = trackH > 0 ? (my - clipY - Game.scrollDrag.startY) / trackH : 0;
      Game.scrollOffsets[side] = Math.max(0, Math.min(maxScroll, ratio * maxScroll));
    } else {
      Game.scrollOffsets[side] = Math.max(0, Math.min(maxScroll,
        Game.scrollDrag.startOffset + (Game.scrollDrag.startY - my)));
    }
    return;
  }

  // Handle pending drag with threshold
  if (Game._pendingDrag && Game._pendingDragStart) {
    const dx = mx - Game._pendingDragStart.x;
    const dy = my - Game._pendingDragStart.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > DRAG_THRESHOLD) {
      // On panel area: prioritize scroll over drag
      if (Game._pendingDrag.type !== 'field') {
        if (isMobile) {
          const mobilePanelSide = Game.isOnMobilePanel(Game._pendingDragStart.y);
          if (mobilePanelSide >= 0 && Math.abs(dx) > Math.abs(dy) * 2) {
            Game.scrollDrag = { side: mobilePanelSide, startX: mx, startOffset: Game.mobileScrollOffsets[mobilePanelSide] || 0, type: 'mobile-hdrag' };
            Game._pendingDrag = null;
            Game._pendingDragStart = null;
            return;
          }
        } else {
          const side = Game.isOnPanel(Game._pendingDragStart.x);
          if (side >= 0 && Math.abs(dy) > Math.abs(dx) * 2) {
            const clipY = HEADER_HEIGHT + 10 + SEARCH_BOX_HEIGHT + 10;
            const clipH = CANVAS_SIZE - SEARCH_BOX_HEIGHT - 20;
            if (my >= clipY && my <= clipY + clipH) {
              Game.scrollDrag = { side, startY: my, startOffset: Game.scrollOffsets[side], type: 'drag' };
              Game._pendingDrag = null;
              Game._pendingDragStart = null;
              return;
            }
          }
        }
      }
      // Convert pending to actual drag
      Game.drag = {
        config: Game._pendingDrag.config,
        x: mx,
        y: my,
        offsetX: Game._pendingDrag.offsetX,
        offsetY: Game._pendingDrag.offsetY,
        fromField: Game._pendingDrag.type === 'field',
        fieldIndex: Game._pendingDrag.type === 'field' ? Game._pendingDrag.fieldIndex : -1
      };
      Game._pendingDrag = null;
      Game._pendingDragStart = null;
    }
    return;
  }
});

canvas.addEventListener('pointerup', (e) => {
  if (window._isPinching) return;
  e.preventDefault();
  Game._pendingDrag = null;
  Game._pendingDragStart = null;
  if (Game.scrollDrag) {
    Game.scrollDrag = null;
    return;
  }
  if (!Game.drag) return;
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
  const my = (e.clientY - rect.top) * (canvas.height / rect.height);

  const drag = Game.drag;
  Game.drag = null;

  if (Game.state !== 'INIT') return;

  if (drag.fromField) {
    if (Game.isInField(mx, my)) {
      const ch = Game.fieldCharacters[drag.fieldIndex];
      ch.x = mx;
      ch.y = my;
    } else {
      Game.fieldCharacters.splice(drag.fieldIndex, 1);
    }
  } else {
    if (Game.isInField(mx, my) && Game.fieldCharacters.length < 2) {
      const config = drag.config;
      const image = CharacterImages[config.imageKey];
      const animFrames = config.animKey ? CharacterImages[config.animKey] : null;
      const shootingImage = config.shootingImageKey ? CharacterImages[config.shootingImageKey] : null;
      const bodyImage = config.bodyImageKey ? CharacterImages[config.bodyImageKey] : null;
      const handImage = config.handImageKey ? CharacterImages[config.handImageKey] : null;
      const uppercutImage = config.uppercutImageKey ? CharacterImages[config.uppercutImageKey] : null;
      const heavyPunchImage = config.heavyPunchImageKey ? CharacterImages[config.heavyPunchImageKey] : null;
      const dodgeImage = config.dodgeImageKey ? CharacterImages[config.dodgeImageKey] : null;
      const ch = new Character({
        id: config.id,
        name: config.name,
        color: config.color,
        radius: config.radius,
        displaySize: config.displaySize,
        octagonRadius: config.octagonRadius,
        skillType: config.skillType,
        skillCooldown: config.skillCooldown,
        image: image,
        animFrames: animFrames,
        shootingImage: shootingImage,
        bodyImage: bodyImage,
        handImage: handImage,
        uppercutImage: uppercutImage,
        heavyPunchImage: heavyPunchImage,
        dodgeImage: dodgeImage
      });
      ch.x = mx;
      ch.y = my;
      Game.fieldCharacters.push(ch);
    }
  }
});

canvas.addEventListener('click', (e) => {
  if (Game.state === 'GAME_OVER') {
    Game.restart();
    return;
  }
  if (Game.state === 'PLAYING' || Game.state === 'PAUSED') {
    Game.togglePause();
  }
  if (Game.state === 'INIT' && Game.fieldCharacters.length >= 2) {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);
    const btnY = isMobile ? currentTotalH - MOBILE_FOOTER_H / 2 : CANVAS_SIZE + HEADER_HEIGHT + FOOTER_HEIGHT / 2;
    if (my >= btnY - 25 && my <= btnY + 25 && mx >= fieldOffsetX + CANVAS_SIZE / 2 - 100 && mx <= fieldOffsetX + CANVAS_SIZE / 2 + 100) {
      Game.start();
    }
  }
});

canvas.addEventListener('wheel', (e) => {
  if (e.ctrlKey) {
    e.preventDefault();
    const scale = e.deltaY > 0 ? 0.9 : 1.1;
    const container = document.getElementById('game-container');
    const current = parseFloat(container.style.transform?.match(/scale\(([^)]+)\)/)?.[1] || '1');
    const newScale = Math.max(0.5, Math.min(3, current * scale));
    container.style.transform = `scale(${newScale})`;
    container.style.transformOrigin = 'center center';
    return;
  }
  if (Game.state !== 'INIT') return;
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
  const my = (e.clientY - rect.top) * (canvas.height / rect.height);
  if (isMobile) {
    const side = Game.isOnMobilePanel(my);
    if (side < 0) return;
    const maxScroll = Game.getMaxScroll(side);
    Game.mobileScrollOffsets[side] = Math.max(0, Math.min(maxScroll,
      (Game.mobileScrollOffsets[side] || 0) + e.deltaY));
  } else {
    const side = Game.isOnPanel(mx);
    if (side < 0) return;
    const maxScroll = Game.getMaxScroll(side);
    Game.scrollOffsets[side] = Math.max(0, Math.min(maxScroll,
      Game.scrollOffsets[side] + e.deltaY));
  }
  e.preventDefault();
}, { passive: false });

[searchInputLeft, searchInputRight].forEach((el, side) => {
  el.addEventListener('focus', () => {
    if (Game.state !== 'INIT') { el.blur(); return; }
    Game.searchFocusedSide = side;
  });

  el.addEventListener('input', () => {
    if (Game.state !== 'INIT') { el.value = ''; return; }
    Game.searchTexts[side] = el.value;
  });

  el.addEventListener('blur', () => {
    if (Game.searchFocusedSide === side) {
      Game.searchFocusedSide = -1;
    }
  });

  el.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      el.blur();
      e.preventDefault();
    }
  });
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && Game.searchFocusedSide >= 0) {
    (Game.searchFocusedSide === 0 ? searchInputLeft : searchInputRight).blur();
    e.preventDefault();
  }
});

canvas.addEventListener('pointercancel', (e) => {
  Game.drag = null;
  Game.scrollDrag = null;
  Game._pendingDrag = null;
  Game._pendingDragStart = null;
});

(function setupPinchZoom() {
  const container = document.getElementById('game-container');
  let currentScale = 1;
  let lastTouchDist = 0;
  let isPinching = false;

  window._isPinching = false;

  function getDist(t1, t2) {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function applyScale(factor) {
    currentScale = Math.max(0.5, Math.min(3, currentScale * factor));
    container.style.transform = `scale(${currentScale})`;
    container.style.transformOrigin = 'center center';
  }

  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      isPinching = true;
      window._isPinching = true;
      lastTouchDist = getDist(e.touches[0], e.touches[1]);
      e.preventDefault();
    }
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2 && isPinching) {
      const dist = getDist(e.touches[0], e.touches[1]);
      if (lastTouchDist > 0) {
        const factor = dist / lastTouchDist;
        applyScale(factor);
      }
      lastTouchDist = dist;
      e.preventDefault();
    }
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    if (e.touches.length < 2) {
      isPinching = false;
      window._isPinching = false;
      lastTouchDist = 0;
    }
  });
})();
