const UI = {

  drawSelectionScreen(ctx, w, h, fieldCharacters) {
    const canStart = fieldCharacters.length >= 2;
    ctx.fillStyle = canStart ? '#fff' : 'rgba(255,255,255,0.4)';
    ctx.font = isMobile ? 'bold 22px "Microsoft YaHei", Arial' : 'bold 28px "Microsoft YaHei", Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const btnY = isMobile ? h - MOBILE_FOOTER_H / 2 : h - FOOTER_HEIGHT / 2;
    ctx.fillText(canStart ? '点击开始游戏' : '请拖入两名角色', fieldOffsetX + CANVAS_SIZE / 2, btnY);
  },

  drawPauseButton(ctx, w, h) {
    ctx.fillStyle = '#fff';
    ctx.font = isMobile ? 'bold 22px "Microsoft YaHei", Arial' : 'bold 28px "Microsoft YaHei", Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const btnY = isMobile ? h - MOBILE_FOOTER_H / 2 : h - FOOTER_HEIGHT / 2;
    ctx.fillText('点击暂停游戏', fieldOffsetX + CANVAS_SIZE / 2, btnY);
  },

  drawPausedOverlay(ctx, w, h) {
    ctx.fillStyle = 'rgba(5, 12, 25, 0.5)';
    ctx.fillRect(fieldOffsetX, fieldOffsetY, CANVAS_SIZE, CANVAS_SIZE);

    ctx.fillStyle = '#fff';
    ctx.font = isMobile ? 'bold 40px "Microsoft YaHei", Arial' : 'bold 60px "Microsoft YaHei", Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('已暂停', fieldOffsetX + CANVAS_SIZE / 2, fieldOffsetY + CANVAS_SIZE / 2);

    ctx.fillStyle = '#fff';
    ctx.font = isMobile ? 'bold 22px "Microsoft YaHei", Arial' : 'bold 28px "Microsoft YaHei", Arial';
    const btnY = isMobile ? h - MOBILE_FOOTER_H / 2 : h - FOOTER_HEIGHT / 2;
    ctx.fillText('点击开始游戏', fieldOffsetX + CANVAS_SIZE / 2, btnY);
  },

  drawCountdown(ctx, w, h, num) {
    ctx.fillStyle = 'rgba(5, 12, 25, 0.5)';
    ctx.fillRect(fieldOffsetX, fieldOffsetY, CANVAS_SIZE, CANVAS_SIZE);

    const scale = 1 + (1 - (num % 1)) * 0.4;
    ctx.save();
    ctx.translate(fieldOffsetX + CANVAS_SIZE / 2, fieldOffsetY + CANVAS_SIZE / 2);
    ctx.scale(scale, scale);

    ctx.fillStyle = '#fff';
    ctx.font = isMobile ? 'bold 60px Arial' : 'bold 80px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(Math.ceil(num), 0, 0);

    ctx.restore();
  },

  drawRestartHint(ctx, w, h) {
    ctx.fillStyle = '#fff';
    ctx.font = isMobile ? 'bold 22px "Microsoft YaHei", Arial' : 'bold 28px "Microsoft YaHei", Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const btnY = isMobile ? h - MOBILE_FOOTER_H / 2 : h - FOOTER_HEIGHT / 2;
    ctx.fillText('点击重新开始', fieldOffsetX + CANVAS_SIZE / 2, btnY);
  }
};
