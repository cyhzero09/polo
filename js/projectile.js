const NAIL_SPEED = 400;
const BRIEFCASE_SPEED = 600;
const PAPER_SPEED = 1200;
const NAIL_DAMAGE = 150;
const BRIEFCASE_DAMAGE = 50;
const PAPER_DAMAGE = 10;

const BEER_SPEED = 450;
const BEER_DAMAGE = 80;
const BEER_ANGLE_OFFSET = 0.45;

const NailImage = new Image();
NailImage.src = 'picture/nail.png';

const BriefcaseImage = new Image();
BriefcaseImage.src = 'picture/briefcase.png';

const BeerBottleImage = new Image();
BeerBottleImage.src = 'picture/beer.png';

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
      this.rotation -= 45 * dt;
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
    radius: 30,
    color: '#D4A017',
    image: BeerBottleImage,
    rotation: 0
  });
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
