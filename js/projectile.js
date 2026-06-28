const NAIL_SPEED = 400;
const BRIEFCASE_SPEED = 600;
const PAPER_SPEED = 1200;
const NAIL_DAMAGE = 100;
const BRIEFCASE_DAMAGE = 50;
const PAPER_DAMAGE = 10;

const BEER_SPEED = 900;
const BEER_DAMAGE = 80;
const BEER_ANGLE_OFFSET = 0.45;

const BULLET_DAMAGE = 60;

const GAOWAN_DAMAGE = 150;
const GAOWAN_SPEED = 450;
const SHOCKWAVE_DAMAGE = 50;
const SHOCKWAVE_MAX_RADIUS = 250;
const SHOCKWAVE_EXPAND_SPEED = 400;

const NailImage = new Image();
NailImage.src = 'picture/nail.png';

const BriefcaseImage = new Image();
BriefcaseImage.src = 'picture/briefcase.png';

const BeerBottleImage = new Image();
BeerBottleImage.src = 'picture/beer.png';

const GaowanImage = new Image();
GaowanImage.src = 'picture/gaowan.png';

class Projectile {
  constructor(config) {
    this.x = config.x;
    this.y = config.y;
    this.vx = config.vx;
    this.vy = config.vy;
    this.damage = config.damage;
    this.ownerId = config.ownerId;
    this.type = config.type;
    this.radius = config.radius;
    this.color = config.color;
    this.image = config.image || null;
    this.alive = true;
    this.rotation = config.rotation || 0;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.type === 'beer') {
      this.rotation -= 450 * dt;
    }
    if (this.type === 'gaowan') {
      const angle = Math.atan2(this.vy, this.vx);
      this.rotation = angle + Math.PI / 2;
    }
  }
}

function createNail(x, y, dirX, dirY, ownerId) {
  const len = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
  return new Projectile({
    x, y,
    vx: (dirX / len) * NAIL_SPEED,
    vy: (dirY / len) * NAIL_SPEED,
    damage: NAIL_DAMAGE,
    ownerId,
    type: 'nail',
    radius: 36,
    color: '#FF6B9D',
    image: NailImage
  });
}

function createBriefcase(x, y, dirX, dirY, ownerId) {
  const len = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
  const p = new Projectile({
    x, y,
    vx: (dirX / len) * BRIEFCASE_SPEED,
    vy: (dirY / len) * BRIEFCASE_SPEED,
    damage: BRIEFCASE_DAMAGE,
    ownerId,
    type: 'briefcase',
    radius: 90,
    color: '#4ECDC4',
    image: BriefcaseImage
  });
  p.hitTargets = new Set();
  return p;
}

function createPaper(x, y, dirX, dirY, ownerId) {
  const len = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
  return new Projectile({
    x, y,
    vx: (dirX / len) * PAPER_SPEED,
    vy: (dirY / len) * PAPER_SPEED,
    damage: PAPER_DAMAGE,
    ownerId,
    type: 'paper',
    radius: 27,
    color: '#ffffff'
  });
}

function createBeerBottle(x, y, dirX, dirY, ownerId) {
  const len = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
  const baseAngle = Math.atan2(dirY, dirX);
  const finalAngle = baseAngle + (Math.random() - 0.5) * 2 * BEER_ANGLE_OFFSET;
  return new Projectile({
    x, y,
    vx: Math.cos(finalAngle) * BEER_SPEED,
    vy: Math.sin(finalAngle) * BEER_SPEED,
    damage: BEER_DAMAGE,
    ownerId,
    type: 'beer',
    radius: 18,
    color: '#D4A017',
    image: BeerBottleImage,
    rotation: 0
  });
}

function createGaowan(x, y, dirX, dirY, ownerId) {
  const len = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
  const angle = Math.atan2(dirY, dirX);
  return new Projectile({
    x, y,
    vx: (dirX / len) * GAOWAN_SPEED,
    vy: (dirY / len) * GAOWAN_SPEED,
    damage: GAOWAN_DAMAGE,
    ownerId,
    type: 'gaowan',
    radius: 30,
    color: '#ff4444',
    image: GaowanImage,
    rotation: angle + Math.PI / 2
  });
}

function createShockwave(x, y, ownerId) {
  return {
    x, y,
    radius: 0,
    maxRadius: SHOCKWAVE_MAX_RADIUS,
    expandSpeed: SHOCKWAVE_EXPAND_SPEED,
    damage: SHOCKWAVE_DAMAGE,
    ownerId,
    type: 'shockwave',
    alive: true,
    hitTargets: new Set(),
    alpha: 1,
    update(dt) {
      this.radius += this.expandSpeed * dt;
      this.alpha = Math.max(0, 1 - this.radius / this.maxRadius);
      if (this.radius >= this.maxRadius) {
        this.alive = false;
      }
    }
  };
}

function createBulletLine(x, y, endX, ownerId) {
  return {
    x, y,
    endX,
    alpha: 1,
    life: 0.5,
    damage: BULLET_DAMAGE,
    ownerId,
    type: 'bullet',
    alive: true,
    update(dt) {
      this.life -= dt;
      this.alpha = Math.max(0, this.life / 0.5);
      if (this.life <= 0) {
        this.alive = false;
      }
    }
  };
}

function splitBriefcase(briefcase) {
  const papers = [];
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 / 8) * i;
    papers.push(createPaper(
      briefcase.x, briefcase.y,
      Math.cos(angle), Math.sin(angle),
      briefcase.ownerId
    ));
  }
  return papers;
}
