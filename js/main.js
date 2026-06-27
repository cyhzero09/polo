const CANVAS_SIZE = 750;
const HEADER_HEIGHT = 45;
const FOOTER_HEIGHT = 60;
const GAME_SIZE = CANVAS_SIZE;
const GAME_OFFSET_X = 0;
const GAME_OFFSET_Y = HEADER_HEIGHT;

const canvas = document.getElementById('game-canvas');
canvas.width = CANVAS_SIZE;
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

const Game = {
  state: 'INIT',
  characters: [],
  projectiles: [],
  floatingTexts: [],
  countdown: 0,
  lastTime: 0,

  init() {
    this.characters = [
      new Character({
        id: 1,
        name: '气质女人',
        color: '#FF6B9D',
        radius: 94,
        displaySize: 188,
        octagonRadius: 100,
        skillType: 'nail',
        image: CharacterImages.lady
      }),
      new Character({
        id: 2,
        name: '工作狂人',
        color: '#4ECDC4',
        radius: 94,
        displaySize: 188,
        octagonRadius: 100,
        skillType: 'briefcase',
        image: CharacterImages.worker
      })
    ];

    this.placeCharacters();
    this.projectiles = [];
    this.floatingTexts = [];
    this.state = 'INIT';
    this.countdown = 0;
    this.lastTime = 0;
  },

  placeCharacters() {
    const positions = [
      { x: GAME_SIZE / 4, y: GAME_OFFSET_Y + GAME_SIZE / 2 },
      { x: GAME_SIZE * 3 / 4, y: GAME_OFFSET_Y + GAME_SIZE / 2 }
    ];
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    for (let i = 0; i < this.characters.length; i++) {
      this.characters[i].x = positions[i].x;
      this.characters[i].y = positions[i].y;
    }
  },

  start() {
    this.state = 'COUNTDOWN';
    this.countdown = 3;
  },

  restart() {
    this.init();
    this.start();
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

    for (const ch of this.characters) {
      if (!ch.alive) continue;

      ch.update(dt);
      Physics.resolveBoundary(ch, GAME_SIZE, GAME_SIZE, GAME_OFFSET_X, GAME_OFFSET_Y);

      if (ch.skillTimer >= ch.skillCooldown) {
        this.fireSkill(ch);
        ch.skillTimer -= ch.skillCooldown;
      }
    }

    for (let i = 0; i < this.characters.length; i++) {
      for (let j = i + 1; j < this.characters.length; j++) {
        const c1 = this.characters[i];
        const c2 = this.characters[j];
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

      for (const ch of this.characters) {
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

    const alive = this.characters.filter(c => c.alive);
    if (alive.length <= 1) {
      this.state = 'GAME_OVER';
    }
  },

  fireSkill(ch) {
    const target = ch.findNearestEnemy(this.characters);
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
    Renderer.clear(ctx, CANVAS_SIZE, CANVAS_SIZE + HEADER_HEIGHT + FOOTER_HEIGHT);
    Renderer.drawBorder(ctx, CANVAS_SIZE, CANVAS_SIZE);

    for (const ch of this.characters) {
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

    switch (this.state) {
      case 'INIT':
        UI.drawStartScreen(ctx, CANVAS_SIZE, CANVAS_SIZE + HEADER_HEIGHT + FOOTER_HEIGHT, this.characters);
        break;
      case 'COUNTDOWN':
        Renderer.drawVSInfo(ctx, CANVAS_SIZE, this.characters);
        UI.drawCountdown(ctx, CANVAS_SIZE, CANVAS_SIZE + HEADER_HEIGHT + FOOTER_HEIGHT, this.countdown);
        break;
      case 'PLAYING':
        Renderer.drawVSInfo(ctx, CANVAS_SIZE, this.characters);
        break;
      case 'GAME_OVER':
        Renderer.drawVSInfo(ctx, CANVAS_SIZE, this.characters);
        const winner = this.characters.find(c => c.alive) || null;
        UI.drawGameOver(ctx, CANVAS_SIZE, CANVAS_SIZE + HEADER_HEIGHT + FOOTER_HEIGHT, winner);
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

canvas.addEventListener('click', () => {
  if (Game.state === 'INIT' || Game.state === 'GAME_OVER') {
    Game.restart();
  }
});