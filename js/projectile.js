const PROJECTILE_SPEED = 400;
const PAPER_SPEED = 300;
const NAIL_DAMAGE = 150;
const BRIEFCASE_DAMAGE = 50;
const PAPER_DAMAGE = 10;

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
    radius: 6,
    color: '#FF6B9D'
  });
}

function createBriefcase(x, y, dirX, dirY, ownerId) {
  const len = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
  return new Projectile({
    x, y,
    vx: (dirX / len) * PROJECTILE_SPEED,
    vy: (dirY / len) * PROJECTILE_SPEED,
    damage: BRIEFCASE_DAMAGE,
    ownerId,
    type: 'briefcase',
    radius: 10,
    color: '#4ECDC4'
  });
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
    radius: 4,
    color: '#FFE66D'
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