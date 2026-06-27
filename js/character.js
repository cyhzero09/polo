const MAX_HP = 1000;
const SKILL_COOLDOWN = 1500;
const SPEED_MIN = 100;
const SPEED_MAX = 160;

class Character {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.x = 0;
    this.y = 0;
    this.radius = config.radius || 35;
    this.octagonRadius = config.octagonRadius || 72;
    this.displaySize = config.displaySize || 70;
    this.color = config.color;
    this.skillType = config.skillType;
    this.maxHp = config.maxHp || MAX_HP;
    this.hp = this.maxHp;
    this.alive = true;
    this.skillCooldown = SKILL_COOLDOWN;
    this.skillTimer = Math.random() * SKILL_COOLDOWN;
    this.image = config.image || null;

    const angle = Math.random() * Math.PI * 2;
    const speed = SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  takeDamage(amount) {
    if (!this.alive) return;
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
    }
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.skillTimer += dt * 1000;
  }

  findNearestEnemy(characters) {
    let nearest = null;
    let minDist = Infinity;
    for (const other of characters) {
      if (other === this || !other.alive) continue;
      const d = Physics.dist(this.x, this.y, other.x, other.y);
      if (d < minDist) {
        minDist = d;
        nearest = other;
      }
    }
    return nearest;
  }
}