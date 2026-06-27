const Renderer = {

  bgColor: '#2196F3',
  borderColor: '#000000',

  clear(ctx, w, h) {
    ctx.fillStyle = this.bgColor;
    ctx.fillRect(0, 0, w, h);
  },

  drawBorder(ctx, w, h) {
    ctx.fillStyle = this.bgColor;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, HEADER_HEIGHT + 4, w - 8, h - 8);
  },

  drawCharacter(ctx, ch) {
    const x = ch.x;
    const y = ch.y;
    const size = ch.displaySize;
    const half = size / 2;

    if (ch.image && ch.image.complete && ch.image.naturalWidth > 0) {
      ctx.drawImage(ch.image, x - half, y - half, size, size);
    } else {
      ctx.save();
      ctx.shadowColor = ch.color;
      ctx.shadowBlur = 15;

      ctx.beginPath();
      ctx.arc(x, y, ch.radius, 0, Math.PI * 2);
      ctx.fillStyle = ch.color;
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();

      const gradient = ctx.createRadialGradient(x - ch.radius * 0.3, y - ch.radius * 0.3, ch.radius * 0.1, x, y, ch.radius);
      gradient.addColorStop(0, 'rgba(255,255,255,0.3)');
      gradient.addColorStop(1, 'rgba(0,0,0,0.2)');
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.restore();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px "Microsoft YaHei", Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ch.name, x, y);
    }

    this.drawCrossHealthBar(ctx, x, y - half, ch.hp, ch.maxHp);
  },

  drawCrossHealthBar(ctx, x, barBottomY, hp, maxHp) {
    const barW = 28;
    const barH = 96;
    const armW = 96;
    const armH = 28;
    const gap = -20;

    const topY = barBottomY - barH - gap;

    const ratio = hp / maxHp;
    const fillColor = hp > 500 ? '#ffffff' : '#ee4444';

    const armCenterY = topY + barH / 2;

    function crossPath(c) {
      const lx = x - barW / 2, rx = x + barW / 2;
      const ty = topY, by = topY + barH;
      const aty = armCenterY - armH / 2, aby = armCenterY + armH / 2;
      const alx = x - armW / 2, arx = x + armW / 2;
      c.beginPath();
      c.moveTo(lx, ty);
      c.lineTo(rx, ty);
      c.lineTo(rx, aty);
      c.lineTo(arx, aty);
      c.lineTo(arx, aby);
      c.lineTo(rx, aby);
      c.lineTo(rx, by);
      c.lineTo(lx, by);
      c.lineTo(lx, aby);
      c.lineTo(alx, aby);
      c.lineTo(alx, aty);
      c.lineTo(lx, aty);
      c.closePath();
    }

    ctx.fillStyle = '#555';
    crossPath(ctx);
    ctx.fill();

    const fillH = barH * ratio;
    ctx.fillStyle = fillColor;
    ctx.fillRect(x - barW / 2, topY + barH - fillH, barW, fillH);

    const armFillH = hp >= 666 ? armH : (hp <= 333 ? 0 : armH * (hp - 333) / 333);
    ctx.fillStyle = fillColor;
    ctx.fillRect(x - armW / 2, armCenterY + armH / 2 - armFillH, armW, armFillH);

    ctx.font = 'bold 30px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#444';
    ctx.fillText(Math.ceil(hp), x, topY + barH / 2);

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    crossPath(ctx);
    ctx.stroke();
  },

  drawProjectile(ctx, proj) {
    const x = proj.x;
    const y = proj.y;
    const r = proj.radius;

    if (proj.image && proj.image.complete && proj.image.naturalWidth > 0) {
      ctx.drawImage(proj.image, x - r, y - r, r * 2, r * 2);
    } else if (proj.type === 'paper') {
      ctx.fillStyle = proj.color;
      ctx.fillRect(x - r, y - r * 0.5, r * 2, r);
    } else {
      ctx.save();
      ctx.shadowColor = proj.color;
      ctx.shadowBlur = 8;

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = proj.color;
      ctx.fill();

      ctx.restore();
    }
  },

  drawDamageText(ctx, ft) {
    ctx.save();
    ctx.globalAlpha = ft.alpha;
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFFF00';
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  },

  drawVSInfo(ctx, w, characters) {
    if (!characters || characters.length < 2) return;
    const text = `${characters[0].name}  VS  ${characters[1].name}`;
    const fontSize = 30;
    ctx.font = `bold ${fontSize}px "Microsoft YaHei", Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const tx = w / 2;
    const ty = HEADER_HEIGHT / 2;

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.strokeText(text, tx, ty);

    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, tx, ty);
  }
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}