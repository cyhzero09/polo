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

const canvas = document.getElementById('game-canvas');
canvas.width = TOTAL_WIDTH;
canvas.height = CANVAS_SIZE + HEADER_HEIGHT + FOOTER_HEIGHT;
const ctx = canvas.getContext('2d');

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
  loaded: false
};

(function loadImages() {
  let loaded = 0;
  const total = 22;
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
    name: '台灣館長',
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
  searchText: '',
  searchFocused: false,
  endingPlayed: false,
  scrollOffsets: [0, 0],
  scrollDrag: null,

  init() {
    this.fieldCharacters = [];
    this.projectiles = [];
    this.floatingTexts = [];
    this.state = 'INIT';
    this.countdown = 0;
    this.lastTime = 0;
    this.drag = null;
    this.searchText = '';
    this.searchFocused = false;
    this.endingPlayed = false;
    this.scrollOffsets = [0, 0];
    this.scrollDrag = null;
  },

  getFilteredPool() {
    const q = this.searchText.toLowerCase();
    if (!q) return CHARACTER_POOL;
    return CHARACTER_POOL.filter(c => c.name.toLowerCase().includes(q));
  },

  start() {
    if (this.fieldCharacters.length < 2) return;
    this.state = 'COUNTDOWN';
    this.countdown = 3;
    const sq = 100;
    const cx0 = GAME_OFFSET_X + CANVAS_SIZE / 4;
    const cx1 = GAME_OFFSET_X + CANVAS_SIZE * 3 / 4;
    const cy = GAME_OFFSET_Y + CANVAS_SIZE / 2;
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
    const filtered = this.getFilteredPool();
    const panelTop = HEADER_HEIGHT + 10 + SEARCH_BOX_HEIGHT + 10;
    for (let side = 0; side < 2; side++) {
      const px = side === 0 ? 0 : PANEL_WIDTH + PANEL_GAP + CANVAS_SIZE + PANEL_GAP;
      const panelRight = px + PANEL_WIDTH;
      if (mx < px || mx > panelRight) continue;
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
        return true;
      }
    }
    return false;
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
    return mx >= GAME_OFFSET_X && mx <= GAME_OFFSET_X + CANVAS_SIZE &&
           my >= GAME_OFFSET_Y && my <= GAME_OFFSET_Y + CANVAS_SIZE;
  },

  isOnPanel(mx) {
    if (mx >= 0 && mx <= PANEL_WIDTH) return 0;
    if (mx >= PANEL_WIDTH + PANEL_GAP + CANVAS_SIZE + PANEL_GAP && mx <= TOTAL_WIDTH) return 1;
    return -1;
  },

  getMaxScroll(side) {
    const filtered = this.getFilteredPool();
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
        if (Physics.resolveBoundary(ch, GAME_SIZE, GAME_SIZE, GAME_OFFSET_X, GAME_OFFSET_Y) && ch.collisionSoundCooldown <= 0) {
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
      const hitBoundary = Physics.resolveBoundary(ch, GAME_SIZE, GAME_SIZE, GAME_OFFSET_X, GAME_OFFSET_Y) && ch.collisionSoundCooldown <= 0;
      if (hitBoundary) {
        ch.collisionSoundCooldown = 0.2;
        CollisionSound.currentTime = 0;
        CollisionSound.play().catch(() => {});
      }
      if (ch.isDodging && ch.dodgeDir !== 0) {
        const minX = GAME_OFFSET_X + ch.radius;
        const maxX = GAME_OFFSET_X + GAME_SIZE - ch.radius;
        if ((ch.dodgeDir > 0 && ch.x >= maxX) || (ch.dodgeDir < 0 && ch.x <= minX)) {
          ch.isDodging = false;
          ch.dodgeAnimTimer = 0;
          ch.dodgeDir = 0;
          ch.vx = ch._dodgeSavedVx;
          ch.vy = ch._dodgeSavedVy;
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

      let hitWall = false;
      if (proj.x - proj.radius < GAME_OFFSET_X) { proj.x = GAME_OFFSET_X + proj.radius; hitWall = true; }
      if (proj.x + proj.radius > GAME_OFFSET_X + GAME_SIZE) { proj.x = GAME_OFFSET_X + GAME_SIZE - proj.radius; hitWall = true; }
      if (proj.y - proj.radius < GAME_OFFSET_Y) { proj.y = GAME_OFFSET_Y + proj.radius; hitWall = true; }
      if (proj.y + proj.radius > GAME_OFFSET_Y + GAME_SIZE) { proj.y = GAME_OFFSET_Y + GAME_SIZE - proj.radius; hitWall = true; }

      if (hitWall) {
        if (proj.type === 'briefcase') {
          const papers = splitBriefcase(proj);
          for (const p of papers) this.projectiles.push(p);
        }
        proj.alive = false;
        continue;
      }

      for (const ch of this.fieldCharacters) {
        if (!ch.alive) continue;
        if (ch.id === proj.ownerId) continue;
        if (proj.hitTargets && proj.hitTargets.has(ch.id)) continue;

          if (Physics.isCircleOctagonColliding(proj, ch)) {
            if (tryDodge(ch)) {
              if (proj.type !== 'briefcase') proj.alive = false;
              break;
            }
            ch.takeDamage(proj.damage);
            if (proj.hitTargets) proj.hitTargets.add(ch.id);
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
        endX = dir > 0 ? GAME_OFFSET_X + CANVAS_SIZE : GAME_OFFSET_X;
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
    Renderer.clear(ctx, TOTAL_WIDTH, CANVAS_SIZE + HEADER_HEIGHT + FOOTER_HEIGHT);
    Renderer.drawBorder(ctx, CANVAS_SIZE, CANVAS_SIZE);

    if (this.state === 'INIT') {
      Renderer.drawCharacterPanels(ctx, PANEL_WIDTH, TOTAL_WIDTH, this.fieldCharacters, this.drag, this.searchText, this.searchFocused, this.scrollOffsets);
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
        UI.drawSelectionScreen(ctx, TOTAL_WIDTH, CANVAS_SIZE + HEADER_HEIGHT + FOOTER_HEIGHT, this.fieldCharacters);
        break;
      case 'COUNTDOWN':
        Renderer.drawVSInfo(ctx, TOTAL_WIDTH, this.fieldCharacters);
        UI.drawCountdown(ctx, TOTAL_WIDTH, CANVAS_SIZE + HEADER_HEIGHT + FOOTER_HEIGHT, this.countdown);
        break;
      case 'PLAYING':
        Renderer.drawVSInfo(ctx, TOTAL_WIDTH, this.fieldCharacters);
        UI.drawPauseButton(ctx, TOTAL_WIDTH, CANVAS_SIZE + HEADER_HEIGHT + FOOTER_HEIGHT);
        break;
      case 'PAUSED':
        Renderer.drawVSInfo(ctx, TOTAL_WIDTH, this.fieldCharacters);
        UI.drawPausedOverlay(ctx, TOTAL_WIDTH, CANVAS_SIZE + HEADER_HEIGHT + FOOTER_HEIGHT);
        break;
      case 'GAME_OVER':
        const winner = this.fieldCharacters.find(c => c.alive) || null;
        Renderer.drawVSInfo(ctx, TOTAL_WIDTH, this.fieldCharacters, winner);
        UI.drawRestartHint(ctx, TOTAL_WIDTH, CANVAS_SIZE + HEADER_HEIGHT + FOOTER_HEIGHT);
        break;
    }
  }
};

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

canvas.addEventListener('mousedown', (e) => {
  if (Game.state !== 'INIT') return;
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
  const my = (e.clientY - rect.top) * (canvas.height / rect.height);

  if (Game.getSearchBoxAt(mx, my)) {
    Game.searchFocused = true;
    return;
  }
  Game.searchFocused = false;

  const fieldIdx = Game.getFieldIndexAt(mx, my);
  if (fieldIdx >= 0) {
    const ch = Game.fieldCharacters[fieldIdx];
    Game.drag = {
      config: CHARACTER_POOL.find(p => p.id === ch.id),
      x: mx,
      y: my,
      offsetX: mx - ch.x,
      offsetY: my - ch.y,
      fromField: true,
      fieldIndex: fieldIdx
    };
    return;
  }

  const poolIdx = Game.getPoolIndexAt(mx, my);
  if (poolIdx >= 0) {
    if (Game.fieldCharacters.length < 2) {
      const config = CHARACTER_POOL[poolIdx];
      if (!Game.fieldCharacters.some(c => c.id === config.id)) {
        Game.drag = {
          config: config,
          x: mx,
          y: my,
          offsetX: 0,
          offsetY: 0,
          fromField: false,
          fieldIndex: -1
        };
        return;
      }
    }
  }

  const panelSide = Game.isOnPanel(mx);
  if (panelSide >= 0) {
    const px = panelSide === 0 ? 0 : PANEL_WIDTH + PANEL_GAP + CANVAS_SIZE + PANEL_GAP;
    const sbX = px + PANEL_WIDTH - 8;
    if (mx >= sbX && mx <= sbX + 6) {
      const clipY = HEADER_HEIGHT + 10 + SEARCH_BOX_HEIGHT + 10;
      const clipH = CANVAS_SIZE - SEARCH_BOX_HEIGHT - 20;
      const filtered = Game.getFilteredPool();
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
    } else {
      Game.scrollDrag = { side: panelSide, startY: my, startOffset: Game.scrollOffsets[panelSide], type: 'drag' };
    }
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (Game.drag) {
    const rect = canvas.getBoundingClientRect();
    Game.drag.x = (e.clientX - rect.left) * (canvas.width / rect.width);
    Game.drag.y = (e.clientY - rect.top) * (canvas.height / rect.height);
  }
  if (Game.scrollDrag) {
    const rect = canvas.getBoundingClientRect();
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);
    const side = Game.scrollDrag.side;
    const maxScroll = Game.getMaxScroll(side);
    if (Game.scrollDrag.type === 'thumb') {
      const clipY = HEADER_HEIGHT + 10 + SEARCH_BOX_HEIGHT + 10;
      const clipH = CANVAS_SIZE - SEARCH_BOX_HEIGHT - 20;
      const filtered = Game.getFilteredPool();
      const cardListHeight = filtered.length * (CARD_HEIGHT + CARD_GAP);
      const thumbH = Math.max(20, clipH * clipH / Math.max(cardListHeight, clipH));
      const trackH = clipH - thumbH;
      const ratio = trackH > 0 ? (my - clipY - Game.scrollDrag.startY) / trackH : 0;
      Game.scrollOffsets[side] = Math.max(0, Math.min(maxScroll, ratio * maxScroll));
    } else {
      Game.scrollOffsets[side] = Math.max(0, Math.min(maxScroll,
        Game.scrollDrag.startOffset + (Game.scrollDrag.startY - my)));
    }
  }
});

canvas.addEventListener('mouseup', (e) => {
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
    const btnY = CANVAS_SIZE + HEADER_HEIGHT + FOOTER_HEIGHT / 2;
    if (my >= btnY - 25 && my <= btnY + 25 && mx >= GAME_OFFSET_X + CANVAS_SIZE / 2 - 100 && mx <= GAME_OFFSET_X + CANVAS_SIZE / 2 + 100) {
      Game.start();
    }
  }
});

canvas.addEventListener('wheel', (e) => {
  if (Game.state !== 'INIT') return;
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
  const side = Game.isOnPanel(mx);
  if (side < 0) return;
  const maxScroll = Game.getMaxScroll(side);
  Game.scrollOffsets[side] = Math.max(0, Math.min(maxScroll,
    Game.scrollOffsets[side] + e.deltaY));
  e.preventDefault();
}, { passive: false });

document.addEventListener('keydown', (e) => {
  if (Game.state !== 'INIT' || !Game.searchFocused) return;
  if (e.key === 'Backspace') {
    Game.searchText = Game.searchText.slice(0, -1);
    e.preventDefault();
  } else if (e.key === 'Escape') {
    Game.searchFocused = false;
  } else if (e.key.length === 1 && e.key.match(/[\u4e00-\u9fa5a-zA-Z0-9]/)) {
    Game.searchText += e.key;
    e.preventDefault();
  }
});
