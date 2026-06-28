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

const CharacterImages = {
  lady: null,
  worker: null,
  beermaster: null,
  beermasterFrames: [],
  gunman: null,
  shooting: null,
  loaded: false
};

(function loadImages() {
  let loaded = 0;
  const total = 14;
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
})();

const CHARACTER_POOL = [
  {
    id: 1,
    name: '气质女人',
    color: '#FF6B9D',
    radius: 94,
    displaySize: 188,
    octagonRadius: 100,
    skillType: 'nail',
    imageKey: 'lady'
  },
  {
    id: 2,
    name: '工作狂人',
    color: '#4ECDC4',
    radius: 94,
    displaySize: 188,
    octagonRadius: 100,
    skillType: 'briefcase',
    imageKey: 'worker'
  },
  {
    id: 3,
    name: '啤酒大师',
    color: '#D4A017',
    radius: 94,
    displaySize: 188,
    octagonRadius: 100,
    skillType: 'beer',
    imageKey: 'beermaster',
    animKey: 'beermasterFrames'
  },
  {
    id: 4,
    name: '西部牛仔',
    color: '#C87533',
    radius: 94,
    displaySize: 188,
    octagonRadius: 100,
    skillType: 'bullet',
    imageKey: 'gunman',
    shootingImageKey: 'shooting'
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
    this.fieldCharacters[0].x = GAME_OFFSET_X + CANVAS_SIZE / 4;
    this.fieldCharacters[0].y = GAME_OFFSET_Y + CANVAS_SIZE / 2;
    this.fieldCharacters[1].x = GAME_OFFSET_X + CANVAS_SIZE * 3 / 4;
    this.fieldCharacters[1].y = GAME_OFFSET_Y + CANVAS_SIZE / 2;
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
      for (let i = 0; i < filtered.length; i++) {
        const cy = panelTop + i * (CARD_HEIGHT + CARD_GAP);
        const cardX = px + (PANEL_WIDTH - CARD_WIDTH) / 2;
        if (mx >= cardX && mx <= cardX + CARD_WIDTH && my >= cy && my <= cy + CARD_HEIGHT) {
          return CHARACTER_POOL.indexOf(filtered[i]);
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
        Physics.resolveBoundary(ch, GAME_SIZE, GAME_SIZE, GAME_OFFSET_X, GAME_OFFSET_Y);
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
      const result = ch.update(dt);
      Physics.resolveBoundary(ch, GAME_SIZE, GAME_SIZE, GAME_OFFSET_X, GAME_OFFSET_Y);

      if (ch.skillType === 'bullet') {
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
        break;
      case 'beer':
        proj = createBeerBottle(ch.x, ch.y, dx, dy, ch.id);
        BeerSound.currentTime = 0;
        BeerSound.play().catch(() => {});
        break;
    }
    if (proj) {
      this.projectiles.push(proj);
    }
  },

  render() {
    Renderer.clear(ctx, TOTAL_WIDTH, CANVAS_SIZE + HEADER_HEIGHT + FOOTER_HEIGHT);
    Renderer.drawBorder(ctx, CANVAS_SIZE, CANVAS_SIZE);

    if (this.state === 'INIT') {
      Renderer.drawCharacterPanels(ctx, PANEL_WIDTH, TOTAL_WIDTH, this.fieldCharacters, this.drag, this.searchText, this.searchFocused);
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

  if (Game.fieldCharacters.length >= 2) return;

  const poolIdx = Game.getPoolIndexAt(mx, my);
  if (poolIdx >= 0) {
    const config = CHARACTER_POOL[poolIdx];
    if (Game.fieldCharacters.some(c => c.id === config.id)) return;
    Game.drag = {
      config: config,
      x: mx,
      y: my,
      offsetX: 0,
      offsetY: 0,
      fromField: false,
      fieldIndex: -1
    };
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (!Game.drag) return;
  const rect = canvas.getBoundingClientRect();
  Game.drag.x = (e.clientX - rect.left) * (canvas.width / rect.width);
  Game.drag.y = (e.clientY - rect.top) * (canvas.height / rect.height);
});

canvas.addEventListener('mouseup', (e) => {
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
      const ch = new Character({
        id: config.id,
        name: config.name,
        color: config.color,
        radius: config.radius,
        displaySize: config.displaySize,
        octagonRadius: config.octagonRadius,
        skillType: config.skillType,
        image: image,
        animFrames: animFrames,
        shootingImage: shootingImage
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
