const PROJECTILE_SPEED = 400;
const PAPER_SPEED = 500;
const NAIL_DAMAGE = 150;
const BRIEFCASE_DAMAGE = 50;
const PAPER_DAMAGE = 10;

const NailImage = new Image();
NailImage.src = 'picture/nail.png';

const BriefcaseImage = new Image();
BriefcaseImage.src = 'picture/briefcase.png';

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
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }
}

function createNail(x, y, dirX, dirY, ownerId) {
  const len = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
  return new Projectile({
    x, y,
    vx: (dirX / len) * PROJECTILE_SPEED,
    vy: (dirY / len) * PROJECTILE_SPEED,
    damage: NAIL_DAMAGE,
    ownerId,
    type: 'nail',
    radius: 24,
    color: '#FF6B9D',
    image: NailImage
  });
}

function createBriefcase(x, y, dirX, dirY, ownerId) {
  const len = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
  const p = new Projectile({
    x, y,
    vx: (dirX / len) * PROJECTILE_SPEED,
    vy: (dirY / len) * PROJECTILE_SPEED,
    damage: BRIEFCASE_DAMAGE,
    ownerId,
    type: 'briefcase',
    radius: 40,
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
    radius: 12,
    color: '#ffffff'
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