const UI = {

  drawSelectionScreen(ctx, w, h, fieldCharacters) {
    const canStart = fieldCharacters.length >= 2;
    ctx.fillStyle = canStart ? '#fff' : 'rgba(255,255,255,0.4)';
    ctx.font = 'bold 28px "Microsoft YaHei", Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(canStart ? '点击开始游戏' : '请拖入两名角色', GAME_OFFSET_X + CANVAS_SIZE / 2, h - FOOTER_HEIGHT / 2);
  },

  drawPauseButton(ctx, w, h) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px "Microsoft YaHei", Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('点击暂停游戏', GAME_OFFSET_X + CANVAS_SIZE / 2, h - FOOTER_HEIGHT / 2);
  },

  drawPausedOverlay(ctx, w, h) {
    ctx.fillStyle = 'rgba(5, 12, 25, 0.5)';
    ctx.fillRect(GAME_OFFSET_X, HEADER_HEIGHT, CANVAS_SIZE, CANVAS_SIZE);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 60px "Microsoft YaHei", Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('已暂停', GAME_OFFSET_X + CANVAS_SIZE / 2, HEADER_HEIGHT + CANVAS_SIZE / 2);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px "Microsoft YaHei", Arial';
    ctx.fillText('点击开始游戏', GAME_OFFSET_X + CANVAS_SIZE / 2, h - FOOTER_HEIGHT / 2);
  },

  drawCountdown(ctx, w, h, num) {
    ctx.fillStyle = 'rgba(5, 12, 25, 0.5)';
    ctx.fillRect(GAME_OFFSET_X, HEADER_HEIGHT, CANVAS_SIZE, CANVAS_SIZE);

    const scale = 1 + (1 - (num % 1)) * 0.4;
    ctx.save();
    ctx.translate(GAME_OFFSET_X + CANVAS_SIZE / 2, HEADER_HEIGHT + CANVAS_SIZE / 2);
    ctx.scale(scale, scale);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 80px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(Math.ceil(num), 0, 0);

    ctx.restore();
  },

  drawRestartHint(ctx, w, h) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px "Microsoft YaHei", Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('点击重新开始', GAME_OFFSET_X + CANVAS_SIZE / 2, h - FOOTER_HEIGHT / 2);
  }
};
