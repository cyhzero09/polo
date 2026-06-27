const CANVAS_SIZE = 750;
const HEADER_HEIGHT = 45;
const FOOTER_HEIGHT = 60;
const PANEL_WIDTH = 120;
const TOTAL_WIDTH = PANEL_WIDTH * 2 + CANVAS_SIZE;
const GAME_SIZE = CANVAS_SIZE;
const GAME_OFFSET_X = PANEL_WIDTH;
const GAME_OFFSET_Y = HEADER_HEIGHT;

const CARD_HEIGHT = 90;
const CARD_GAP = 10;
const CARD_WIDTH = PANEL_WIDTH - 16;

const canvas = document.getElementById('game-canvas');
canvas.width = TOTAL_WIDTH;
canvas.height = CANVAS_SIZE + HEADER_HEIGHT + FOOTER_HEIGHT;
const ctx = canvas.getContext('2d');

const CharacterImages = {
  lady: null,
  worker: null,
  loaded: false
};

(function loadImages() {
  const ladyImg = new Image();
  ladyImg.src = 'picture/gracewoman.png';
  ladyImg.onload = () => { CharacterImages.lady = ladyImg; checkAllLoaded(); };
  ladyImg.onerror = () => { checkAllLoaded(); };

  const workerImg = new Image();
  workerImg.src = 'picture/workholic.png';
  workerImg.onload = () => { CharacterImages.worker = workerImg; checkAllLoaded(); };
  workerImg.onerror = () => { checkAllLoaded(); };

  let loaded = 0;
  function checkAllLoaded() {
    loaded++;
    if (loaded < 2) return;
    CharacterImages.loaded = true;
    Game.init();
    requestAnimationFrame(gameLoop);
  }
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

  init() {
    this.fieldCharacters = [];
    this.projectiles = [];
    this.floatingTexts = [];
    this.state = 'INIT';
    this.countdown = 0;
    this.lastTime = 0;
    this.drag = null;
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
    const panelTop = HEADER_HEIGHT + 10;
    for (let side = 0; side < 2; side++) {
      const px = side === 0 ? 8 : PANEL_WIDTH + CANVAS_SIZE + 8;
      for (let i = 0; i < CHARACTER_POOL.length; i++) {
        const cy = panelTop + i * (CARD_HEIGHT + CARD_GAP);
        if (mx >= px && mx <= px + CARD_WIDTH && my >= cy && my <= cy + CARD_HEIGHT) {
          return i;
        }
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

    if (this.state !== 'PLAYING') return;

    for (const ch of this.fieldCharacters) {
      if (!ch.alive) continue;
      ch.update(dt);
      Physics.resolveBoundary(ch, GAME_SIZE, GAME_SIZE, GAME_OFFSET_X, GAME_OFFSET_Y);
      if (ch.skillTimer >= ch.skillCooldown) {
        this.fireSkill(ch);
        ch.skillTimer -= ch.skillCooldown;
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
          this.floatingTexts.push({
            x: ch.x + (Math.random() - 0.5) * 40,
            y: ch.y - ch.radius - 10,
            text: `-${proj.damage}`,
            alpha: 1,
            vx: (Math.random() - 0.5) * 60,
            vy: -40 - Math.random() * 30,
            life: 1
          });
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
    if (alive.length <= 1) {
      this.state = 'GAME_OVER';
    }
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
        break;
      case 'briefcase':
        proj = createBriefcase(ch.x, ch.y, dx, dy, ch.id);
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
      Renderer.drawCharacterPanels(ctx, PANEL_WIDTH, TOTAL_WIDTH, this.fieldCharacters, this.drag);
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
        Renderer.drawVSInfo(ctx, TOTAL_WIDTH, this.fieldCharacters);
        const winner = this.fieldCharacters.find(c => c.alive) || null;
        UI.drawGameOver(ctx, TOTAL_WIDTH, CANVAS_SIZE + HEADER_HEIGHT + FOOTER_HEIGHT, winner);
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
      const ch = new Character({
        id: config.id,
        name: config.name,
        color: config.color,
        radius: config.radius,
        displaySize: config.displaySize,
        octagonRadius: config.octagonRadius,
        skillType: config.skillType,
        image: image
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
