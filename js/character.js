const MAX_HP = 1000;
const SKILL_COOLDOWN = 1500;
const SPEED = 260;

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
    this.animFrames = config.animFrames || null;
    this.animTimer = 0;
    this.animIndex = 0;
    this.shootingImage = config.shootingImage || null;
    this.isShooting = false;
    this.shootingAnimTimer = 0;
    this.burstCount = 0;
    this.burstCooldownTimer = 0;
    this.burstMax = 6;
    this.burstCooldown = 2;
    this.fireInterval = 0.1;
    this.fireTimer = 0;
    this.burstDirection = 0;

    this.swayTimer = Math.random() * Math.PI * 2;
    this.swayFreq = 3.5;
    this.swayAmplitude = 250;

    const angle = Math.random() * Math.PI * 2;
    this.speed = SPEED;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
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
    if (this.animFrames) {
      this.animTimer += dt;
      if (this.animTimer >= 0.5) {
        this.animTimer -= 0.5;
        this.animIndex = (this.animIndex + 1) % this.animFrames.length;
      }
    }

    if (this.skillType === 'beer') {
      this.swayTimer += dt * this.swayFreq;
      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy) || 1;
      const perpX = -this.vy / speed;
      const perpY = this.vx / speed;
      const sway = Math.sin(this.swayTimer) * this.swayAmplitude;
      this.x += perpX * sway * dt;
      this.y += perpY * sway * dt;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.skillType === 'bullet') {
      if (this.burstCooldownTimer > 0) {
        this.burstCooldownTimer -= dt;
      }
      if (this.isShooting) {
        this.fireTimer += dt;
        this.shootingAnimTimer += dt;
        if (this.fireTimer >= this.fireInterval && this.burstCount < this.burstMax) {
          this.fireTimer -= this.fireInterval;
          this.burstCount++;
          const shouldStop = this.burstCount >= this.burstMax;
          if (shouldStop) {
            this.isShooting = false;
            this.burstCooldownTimer = this.burstCooldown;
          }
          return 'fire';
        }
      }
    }

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

  isHorizontallyAlignedWith(enemy) {
    const halfSize = enemy.displaySize / 2;
    return this.y >= enemy.y - halfSize && this.y <= enemy.y + halfSize;
  }
}
