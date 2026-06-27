const UI = {

  drawStartScreen(ctx, w, h, characters) {
    const alpha = 0.55 + Math.sin(Date.now() / 600) * 0.35;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.font = 'bold 28px "Microsoft YaHei", Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('点击开始游戏', w / 2, h - FOOTER_HEIGHT / 2);
  },

  drawPauseButton(ctx, w, h) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px "Microsoft YaHei", Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('点击暂停游戏', w / 2, h - FOOTER_HEIGHT / 2);
  },

  drawPausedOverlay(ctx, w, h) {
    ctx.fillStyle = 'rgba(5, 12, 25, 0.5)';
    ctx.fillRect(0, HEADER_HEIGHT, w, CANVAS_SIZE);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 60px "Microsoft YaHei", Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('已暂停', w / 2, HEADER_HEIGHT + CANVAS_SIZE / 2);

    this.drawPauseButton(ctx, w, h);
  },

  drawCountdown(ctx, w, h, num) {
    ctx.fillStyle = 'rgba(5, 12, 25, 0.5)';
    ctx.fillRect(0, HEADER_HEIGHT, w, CANVAS_SIZE);

    const scale = 1 + (1 - (num % 1)) * 0.4;
    ctx.save();
    ctx.translate(w / 2, HEADER_HEIGHT + CANVAS_SIZE / 2);
    ctx.scale(scale, scale);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 80px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(Math.ceil(num), 0, 0);

    ctx.restore();
  },

  drawGameOver(ctx, w, h, winner) {
    ctx.fillStyle = 'rgba(5, 12, 25, 0.78)';
    ctx.fillRect(0, HEADER_HEIGHT, w, CANVAS_SIZE);

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 40px "Microsoft YaHei", Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (winner) {
      ctx.fillText(`🏆 ${winner.name} 获胜！`, w / 2, h / 2 - 60);

      if (winner.image && winner.image.complete && winner.image.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(w / 2, h / 2 - 5, 30, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(winner.image, w / 2 - 30, h / 2 - 35, 60, 60);
        ctx.restore();
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(w / 2, h / 2 - 5, 30, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = winner.color;
        ctx.beginPath();
        ctx.arc(w / 2, h / 2 - 5, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px "Microsoft YaHei", Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(winner.name, w / 2, h / 2 - 5);
      }

      ctx.fillStyle = '#4ecca3';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`剩余血量: ${Math.ceil(winner.hp)} / ${winner.maxHp}`, w / 2, h / 2 + 45);
    } else {
      ctx.fillText('平局！', w / 2, h / 2);
    }

    const alpha = 0.55 + Math.sin(Date.now() / 600) * 0.35;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.font = 'bold 28px "Microsoft YaHei", Arial';
    ctx.textAlign = 'center';
    ctx.fillText('点击重新开始', w / 2, h - FOOTER_HEIGHT / 2);
  }
};