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
    this.skillCooldown = config.skillCooldown || SKILL_COOLDOWN;
    this.skillTimer = Math.random() * this.skillCooldown;
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
    this.fireInterval = 0.125;
    this.fireTimer = 0;
    this.burstDirection = 0;
    this.isAttacking = false;
    this.attackAnimTimer = 0;
    this.facingRight = true;
    this.collisionSoundCooldown = 0;
    this.knockbackTimer = 0;
    this.hitFlashTimer = 0;

    this.isPaused = false;
    this.pauseTimer = 0;
    this.punchTimer = 0;
    this.punchAnimTimer = 0;
    this.lastPunchType = '';
    this.isDodging = false;
    this.dodgeAnimTimer = 0;
    this.facingRight = true;
    this.dodgeChance = 0.1;
    this.punchRange = 180;
    this.targetEnemy = null;
    this.savedAngle = 0;

    this.bodyImage = config.bodyImage || null;
    this.handImage = config.handImage || null;
    this.uppercutImage = config.uppercutImage || null;
    this.heavyPunchImage = config.heavyPunchImage || null;
    this.dodgeImage = config.dodgeImage || null;

    this.swayTimer = Math.random() * Math.PI * 2;
    this.swayFreq = 8;
    this.swayAmplitude = 250;

    this.stumbleTimer = Math.random() * 0.5 + 0.3;

    const angle = Math.random() * Math.PI * 2;
    this.speed = SPEED;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
  }

  takeDamage(amount, silent = false) {
    if (!this.alive) return;
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
    }
    this.hitFlashTimer = 0.1;
    if (!silent && typeof AttackSound !== 'undefined') {
      AttackSound.currentTime = 0;
      AttackSound.play().catch(() => {});
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

      this.stumbleTimer -= dt;
      if (this.stumbleTimer <= 0) {
        this.stumbleTimer = Math.random() * 0.5 + 0.3;
        const currentAngle = Math.atan2(this.vy, this.vx);
        const offset = (Math.random() - 0.5) * 2 * (Math.PI / 3);
        const newAngle = currentAngle + offset;
        this.vx = Math.cos(newAngle) * this.speed;
        this.vy = Math.sin(newAngle) * this.speed;
      }
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.collisionSoundCooldown > 0) {
      this.collisionSoundCooldown -= dt;
    }
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
    }

    if (this.knockbackTimer > 0) {
      this.knockbackTimer -= dt;
      if (this.knockbackTimer <= 0) {
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy) || 1;
        this.vx = (this.vx / speed) * SPEED;
        this.vy = (this.vy / speed) * SPEED;
      }
    }

    if (this.isAttacking) {
      this.attackAnimTimer -= dt;
      if (this.attackAnimTimer <= 0) {
        this.isAttacking = false;
        this.attackAnimTimer = 0;
      }
    }

    if (this.skillType === 'boxer') {
      if (this.punchAnimTimer > 0) {
        this.punchAnimTimer -= dt;
        if (this.punchAnimTimer <= 0) {
          this.lastPunchType = '';
        }
      }
      if (this.isDodging) {
        this.dodgeAnimTimer -= dt;
        if (this.dodgeAnimTimer <= 0) {
          this.isDodging = false;
        }
      }
    }

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
