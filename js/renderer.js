const _flashCvs = document.createElement('canvas');
const _flashCtx = _flashCvs.getContext('2d');

const Renderer = {

  bgColor: '#2196F3',
  borderColor: '#000000',

  clear(ctx, w, h) {
    ctx.fillStyle = this.bgColor;
    ctx.fillRect(0, 0, w, h);
  },

  drawBorder(ctx, w, h) {
    ctx.fillStyle = this.bgColor;
    ctx.fillRect(GAME_OFFSET_X, 0, w, h);

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 8;
    ctx.strokeRect(GAME_OFFSET_X + 4, HEADER_HEIGHT + 4, w - 8, h - 8);
  },

  drawCharacterPanels(ctx, panelWidth, totalWidth, fieldCharacters, drag, searchText, searchFocused, scrollOffsets) {
    const fieldIds = fieldCharacters.map(c => c.id);
    const q = searchText.toLowerCase();
    const filtered = q ? CHARACTER_POOL.filter(c => c.name.toLowerCase().includes(q)) : CHARACTER_POOL;

    const panelTop = HEADER_HEIGHT + 10;

    for (let side = 0; side < 2; side++) {
      const px = side === 0 ? 0 : panelWidth + PANEL_GAP + CANVAS_SIZE + PANEL_GAP;

      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(px, HEADER_HEIGHT, panelWidth, CANVAS_SIZE);

      const sy = panelTop;
      const searchX = px + (panelWidth - CARD_WIDTH) / 2;
      ctx.fillStyle = searchFocused ? '#fff' : 'rgba(255,255,255,0.15)';
      ctx.fillRect(searchX, sy, CARD_WIDTH, SEARCH_BOX_HEIGHT);
      ctx.strokeStyle = searchFocused ? '#FFD700' : 'rgba(255,255,255,0.4)';
      ctx.lineWidth = searchFocused ? 2 : 1;
      ctx.strokeRect(searchX, sy, CARD_WIDTH, SEARCH_BOX_HEIGHT);

      ctx.fillStyle = searchFocused ? '#000' : 'rgba(255,255,255,0.5)';
      ctx.font = '16px "Microsoft YaHei", Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const displayText = searchText || '搜索角色...';
      ctx.fillText(displayText, searchX + CARD_WIDTH / 2, sy + SEARCH_BOX_HEIGHT / 2);

      if (searchFocused) {
        const tw = ctx.measureText(searchText).width;
        const cursorX = searchX + CARD_WIDTH / 2 + tw / 2;
        if (Math.floor(Date.now() / 500) % 2 === 0) {
          ctx.fillStyle = '#000';
          ctx.fillRect(cursorX, sy + 8, 2, SEARCH_BOX_HEIGHT - 16);
        }
      }

      const cardTop = panelTop + SEARCH_BOX_HEIGHT + 10;
      const clipY = cardTop;
      const clipH = CANVAS_SIZE - SEARCH_BOX_HEIGHT - 20;

      ctx.save();
      ctx.beginPath();
      ctx.rect(px, clipY, panelWidth, clipH);
      ctx.clip();

      for (let i = 0; i < filtered.length; i++) {
        const config = filtered[i];
        const cy = cardTop + i * (CARD_HEIGHT + CARD_GAP) - scrollOffsets[side];
        const inField = fieldIds.includes(config.id);
        const cardX = px + (panelWidth - CARD_WIDTH) / 2;

        ctx.fillStyle = inField ? 'rgba(100,100,100,0.5)' : 'rgba(255,255,255,0.1)';
        ctx.fillRect(cardX, cy, CARD_WIDTH, CARD_HEIGHT);

        if (!inField) {
          ctx.strokeStyle = 'rgba(255,255,255,0.3)';
          ctx.lineWidth = 1;
          ctx.strokeRect(cardX, cy, CARD_WIDTH, CARD_HEIGHT);
        }

        const imgSize = 100;
        const imgX = cardX + (CARD_WIDTH - imgSize) / 2;
        const imgY = cy + 6;
        const image = CharacterImages[config.imageKey];

        if (image && image.complete && image.naturalWidth > 0) {
          ctx.save();
          if (inField) ctx.globalAlpha = 0.4;
          ctx.drawImage(image, imgX, imgY, imgSize, imgSize);
          ctx.restore();
        } else {
          ctx.fillStyle = inField ? '#666' : config.color;
          ctx.beginPath();
          ctx.arc(cardX + CARD_WIDTH / 2, imgY + imgSize / 2, imgSize / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = inField ? '#888' : '#fff';
        ctx.font = 'bold 14px "Microsoft YaHei", Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(config.name, cardX + CARD_WIDTH / 2, imgY + imgSize + 5);
      }

      ctx.restore();

      const maxScroll = Math.max(0, filtered.length * (CARD_HEIGHT + CARD_GAP) - clipH);
      if (maxScroll > 0) {
        const sbX = px + panelWidth - 8;
        const sbH = clipH;
        const thumbH = Math.max(20, clipH * clipH / (filtered.length * (CARD_HEIGHT + CARD_GAP)));
        const trackH = sbH - thumbH;
        const thumbPos = trackH > 0 ? (scrollOffsets[side] / maxScroll) * trackH : 0;

        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(sbX, clipY, 6, sbH);

        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillRect(sbX, clipY + thumbPos, 6, thumbH);
      }

      if (filtered.length === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '13px "Microsoft YaHei", Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('无匹配角色', px + CARD_WIDTH / 2 + 8, cardTop + 40);
      }
    }
  },

  drawDragCharacter(ctx, drag) {
    const config = drag.config;
    const image = CharacterImages[config.imageKey];
    const size = 60;
    const x = drag.x - drag.offsetX;
    const y = drag.y - drag.offsetY;

    ctx.save();
    ctx.globalAlpha = 0.7;
    if (image && image.complete && image.naturalWidth > 0) {
      ctx.drawImage(image, x - size / 2, y - size / 2, size, size);
    } else {
      ctx.fillStyle = config.color;
      ctx.beginPath();
      ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  },

  applyFlash(ctx, ch, img, dx, dy, dw, dh, flip) {
    if (ch.hitFlashTimer <= 0) return;
    const cw = Math.ceil(Math.abs(dw));
    const ch2 = Math.ceil(Math.abs(dh));
    if (cw < 1 || ch2 < 1) return;
    _flashCvs.width = cw;
    _flashCvs.height = ch2;
    _flashCtx.save();
    if (flip) _flashCtx.scale(-1, 1);
    _flashCtx.drawImage(img, flip ? -cw : 0, 0, cw, ch2);
    _flashCtx.restore();
    _flashCtx.globalCompositeOperation = 'source-atop';
    _flashCtx.globalAlpha = 0.8;
    _flashCtx.fillStyle = '#ffffff';
    _flashCtx.fillRect(0, 0, cw, ch2);
    _flashCtx.globalCompositeOperation = 'source-over';
    _flashCtx.globalAlpha = 1;
    ctx.drawImage(_flashCvs, dx, dy, dw, dh);
  },

  drawCharacter(ctx, ch) {
    const x = ch.x;
    const y = ch.y;
    const size = ch.displaySize;
    const half = size / 2;

    const currentFrame = ch.animFrames && ch.animFrames[ch.animIndex] && ch.animFrames[ch.animIndex].complete && ch.animFrames[ch.animIndex].naturalWidth > 0
      ? ch.animFrames[ch.animIndex]
      : null;

    if (currentFrame) {
      ctx.drawImage(currentFrame, x - half, y - half, size, size);
      Renderer.applyFlash(ctx, ch, currentFrame, x - half, y - half, size, size);
    } else if (ch.skillType === 'bullet') {
      let img = null;
      if (ch.isShooting && ch.shootingImage && ch.shootingImage.complete && ch.shootingImage.naturalWidth > 0) {
        img = ch.shootingImage;
      } else if (ch.image && ch.image.complete && ch.image.naturalWidth > 0) {
        img = ch.image;
      }
      if (img) {
        ctx.save();
        ctx.translate(x, y);
        if (ch.isShooting && ch.burstDirection === 1) {
          ctx.scale(-1, 1);
        }
        ctx.drawImage(img, -half, -half, size, size);
        ctx.restore();
        Renderer.applyFlash(ctx, ch, img, x - half, y - half, size, size, ch.isShooting && ch.burstDirection === 1);
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
        if (ch.hitFlashTimer > 0) {
          ctx.save();
          ctx.globalAlpha = 0.8;
          ctx.beginPath();
          ctx.arc(x, y, ch.radius, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.restore();
        }

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px "Microsoft YaHei", Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ch.name, x, y);
      }
    } else if (ch.skillType === 'gaowan') {
      let img = null;
      if (ch.isAttacking && ch.shootingImage && ch.shootingImage.complete && ch.shootingImage.naturalWidth > 0) {
        img = ch.shootingImage;
      } else if (ch.image && ch.image.complete && ch.image.naturalWidth > 0) {
        img = ch.image;
      }
      if (img) {
        ctx.save();
        ctx.translate(x, y);
        if (ch.facingRight) {
          ctx.scale(-1, 1);
        }
        ctx.drawImage(img, -half, -half, size, size);
        ctx.restore();
        Renderer.applyFlash(ctx, ch, img, x - half, y - half, size, size, ch.facingRight);
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
        if (ch.hitFlashTimer > 0) {
          ctx.save();
          ctx.globalAlpha = 0.8;
          ctx.beginPath();
          ctx.arc(x, y, ch.radius, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.restore();
        }

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px "Microsoft YaHei", Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ch.name, x, y);
      }
    } else if (ch.skillType === 'boxer') {
      const flip = ch.facingRight;

      const drawAspect = (img, flipImg, cx, cy) => {
        const iw = img.naturalWidth;
        const ih = img.naturalHeight;
        const scale = Math.min(size / iw, size / ih);
        const dw = iw * scale;
        const dh = ih * scale;
        ctx.save();
        ctx.translate(cx, cy);
        if (flipImg) ctx.scale(-1, 1);
        ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
        ctx.restore();
        Renderer.applyFlash(ctx, ch, img, cx - dw / 2, cy - dh / 2, dw, dh, flipImg);
      };

      if (ch.isDodging && ch.dodgeImage && ch.dodgeImage.complete && ch.dodgeImage.naturalWidth > 0) {
        drawAspect(ch.dodgeImage, flip, x, y);
      } else if (ch.lastPunchType === 'uppercut' && ch.uppercutImage && ch.uppercutImage.complete && ch.uppercutImage.naturalWidth > 0) {
        drawAspect(ch.uppercutImage, flip, x, y);
      } else if (ch.lastPunchType === 'heavy' && ch.heavyPunchImage && ch.heavyPunchImage.complete && ch.heavyPunchImage.naturalWidth > 0) {
        drawAspect(ch.heavyPunchImage, flip, x, y);
      } else if (ch.lastPunchType === 'normal' && ch.bodyImage && ch.bodyImage.complete && ch.bodyImage.naturalWidth > 0) {
        const enemy = ch.targetEnemy;
        if (ch.handImage && ch.handImage.complete && ch.handImage.naturalWidth > 0 && ch.punchAnimTimer > 0 && enemy && enemy.alive) {
          const angle = Math.atan2(enemy.y - y, enemy.x - x);
          const handFwd = 10;
          const handUp = 2;
          const handSide = 0;
          const fadeDuration = 0.1;
          const handAlpha = Math.min(1, ch.punchAnimTimer / fadeDuration);

          const hx = x + Math.cos(angle) * handFwd + Math.sin(angle) * handSide;
          const hy = y + Math.sin(angle) * handFwd - Math.cos(angle) * handSide - handUp;

          const iw = ch.handImage.naturalWidth;
          const ih = ch.handImage.naturalHeight;
          const s = Math.min(size / iw, size / ih) * 1.5;
          const dw = iw * s;
          const dh = ih * s;

          ctx.save();
          ctx.globalAlpha = handAlpha;
          ctx.translate(hx, hy);
          if (flip) {
            ctx.scale(-1, 1);
            ctx.rotate(-angle);
          } else {
            ctx.rotate(angle - Math.PI);
          }
          ctx.drawImage(ch.handImage, -dw / 2, -dh / 2, dw, dh);
          ctx.restore();
        }

        drawAspect(ch.bodyImage, flip, x, y);
      } else if (ch.image && ch.image.complete && ch.image.naturalWidth > 0) {
        drawAspect(ch.image, flip, x, y);
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
        if (ch.hitFlashTimer > 0) {
          ctx.save();
          ctx.globalAlpha = 0.8;
          ctx.beginPath();
          ctx.arc(x, y, ch.radius, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.restore();
        }

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px "Microsoft YaHei", Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ch.name, x, y);
      }
    } else if (ch.skillType === 'thinker') {
      if (ch.image && ch.image.complete && ch.image.naturalWidth > 0) {
        ctx.drawImage(ch.image, x - half, y - half, size, size);
        Renderer.applyFlash(ctx, ch, ch.image, x - half, y - half, size, size);
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
        if (ch.hitFlashTimer > 0) {
          ctx.save();
          ctx.globalAlpha = 0.8;
          ctx.beginPath();
          ctx.arc(x, y, ch.radius, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.restore();
        }
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px "Microsoft YaHei", Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ch.name, x, y);
      }
      if (ch.orbitProjectiles) {
        for (const op of ch.orbitProjectiles) {
          if (op.image && op.image.complete && op.image.naturalWidth > 0) {
            const iw = op.image.naturalWidth;
            const ih = op.image.naturalHeight;
            const dw = op.radius * 2;
            const dh = (ih / iw) * dw;
            ctx.drawImage(op.image, op.x - dw / 2, op.y - dh / 2, dw, dh);
          } else {
            ctx.save();
            ctx.shadowColor = op.color;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(op.x, op.y, op.radius, 0, Math.PI * 2);
            ctx.fillStyle = op.color;
            ctx.fill();
            ctx.restore();
          }
        }
      }
    } else if (ch.image && ch.image.complete && ch.image.naturalWidth > 0) {
      ctx.drawImage(ch.image, x - half, y - half, size, size);
      Renderer.applyFlash(ctx, ch, ch.image, x - half, y - half, size, size);
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
      if (ch.hitFlashTimer > 0) {
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(x, y, ch.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.restore();
      }

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
      const imgW = proj.image.naturalWidth;
      const imgH = proj.image.naturalHeight;
      const dw = r * 2;
      const dh = (imgH / imgW) * dw;
      if (proj.type === 'beer' && proj.rotation) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(proj.rotation * Math.PI / 180);
        ctx.drawImage(proj.image, -dw / 2, -dh / 2, dw, dh);
        ctx.restore();
      } else if (proj.type === 'gaowan') {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(proj.rotation);
        ctx.drawImage(proj.image, -dw / 2, -dh / 2, dw, dh);
        ctx.restore();
      } else {
        ctx.drawImage(proj.image, x - dw / 2, y - dh / 2, dw, dh);
      }
    } else if (proj.type === 'paper') {
      ctx.fillStyle = proj.color;
      ctx.fillRect(x - r, y - r * 0.5, r * 2, r);
    } else if (proj.type === 'bullet') {
      ctx.save();
      ctx.globalAlpha = proj.alpha;
      ctx.strokeStyle = '#FFF8DC';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(proj.x, proj.y);
      ctx.lineTo(proj.endX, proj.y);
      ctx.stroke();
      ctx.restore();
    } else if (proj.type === 'shockwave') {
      ctx.save();
      ctx.globalAlpha = proj.alpha * 0.6;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
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

  drawVSInfo(ctx, w, characters, winner) {
    if (!characters || characters.length < 2) return;
    let text;
    if (winner) {
      text = `${winner.name} 获胜！`;
    } else {
      text = `${characters[0].name}  VS  ${characters[1].name}`;
    }
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

    ctx.fillStyle = winner ? '#FFD700' : '#ffffff';
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
