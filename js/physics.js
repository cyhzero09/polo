const Physics = {

  getOctagonVertices(cx, cy, radius) {
    const vertices = [];
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i - Math.PI / 8;
      vertices.push({
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle)
      });
    }
    return vertices;
  },

  projectPolygon(vertices, axis) {
    let min = Infinity, max = -Infinity;
    for (const v of vertices) {
      const proj = v.x * axis.x + v.y * axis.y;
      if (proj < min) min = proj;
      if (proj > max) max = proj;
    }
    return { min, max };
  },

  normalizeAxis(axis) {
    const len = Math.sqrt(axis.x * axis.x + axis.y * axis.y);
    if (len < 1e-8) return null;
    return { x: axis.x / len, y: axis.y / len };
  },

  getAxes(verts1, verts2) {
    const axes = [];
    const allVerts = [verts1, verts2];
    for (const verts of allVerts) {
      for (let i = 0; i < verts.length; i++) {
        const edge = {
          x: verts[(i + 1) % verts.length].x - verts[i].x,
          y: verts[(i + 1) % verts.length].y - verts[i].y
        };
        const axis = Physics.normalizeAxis({ x: -edge.y, y: edge.x });
        if (axis) axes.push(axis);
      }
    }
    const unique = [];
    for (const a of axes) {
      let dup = false;
      for (const u of unique) {
        if (Math.abs(a.x - u.x) < 1e-6 && Math.abs(a.y - u.y) < 1e-6) dup = true;
        if (Math.abs(a.x + u.x) < 1e-6 && Math.abs(a.y + u.y) < 1e-6) dup = true;
      }
      if (!dup) unique.push(a);
    }
    return unique;
  },

  resolveCharacterCollision(c1, c2) {
    const verts1 = Physics.getOctagonVertices(c1.x, c1.y, c1.octagonRadius);
    const verts2 = Physics.getOctagonVertices(c2.x, c2.y, c2.octagonRadius);

    const axes = Physics.getAxes(verts1, verts2);

    let minOverlap = Infinity;
    let collisionAxis = null;

    for (const axis of axes) {
      const proj1 = Physics.projectPolygon(verts1, axis);
      const proj2 = Physics.projectPolygon(verts2, axis);

      if (proj1.max < proj2.min || proj2.max < proj1.min) return;

      const overlap = Math.min(proj1.max - proj2.min, proj2.max - proj1.min);
      if (overlap < minOverlap) {
        minOverlap = overlap;
        collisionAxis = { x: axis.x, y: axis.y };
      }
    }

    if (!collisionAxis) return;

    const dx = c2.x - c1.x;
    const dy = c2.y - c1.y;
    const dot = dx * collisionAxis.x + dy * collisionAxis.y;
    if (dot < 0) {
      collisionAxis.x = -collisionAxis.x;
      collisionAxis.y = -collisionAxis.y;
    }

    const restitution = 0.5;
    const separation = minOverlap / 2 + 0.5;

    c1.x -= separation * collisionAxis.x;
    c1.y -= separation * collisionAxis.y;
    c2.x += separation * collisionAxis.x;
    c2.y += separation * collisionAxis.y;

    const dvx = c1.vx - c2.vx;
    const dvy = c1.vy - c2.vy;
    const velAlongNormal = dvx * collisionAxis.x + dvy * collisionAxis.y;

    if (velAlongNormal <= 0) return;

    const impulse = (1 + restitution) * velAlongNormal / 2;

    c1.vx -= impulse * collisionAxis.x;
    c1.vy -= impulse * collisionAxis.y;
    c2.vx += impulse * collisionAxis.x;
    c2.vy += impulse * collisionAxis.y;
  },

  resolveBoundary(entity, w, h, offsetX, offsetY) {
    const ox = offsetX || 0;
    const oy = offsetY || 0;
    const verts = Physics.getOctagonVertices(entity.x, entity.y, entity.octagonRadius);
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const v of verts) {
      if (v.x < minX) minX = v.x;
      if (v.x > maxX) maxX = v.x;
      if (v.y < minY) minY = v.y;
      if (v.y > maxY) maxY = v.y;
    }

    if (minX < ox) { entity.x += (ox - minX); entity.vx = Math.abs(entity.vx); }
    if (maxX > ox + w) { entity.x -= (maxX - (ox + w)); entity.vx = -Math.abs(entity.vx); }
    if (minY < oy) { entity.y += (oy - minY); entity.vy = Math.abs(entity.vy); }
    if (maxY > oy + h) { entity.y -= (maxY - (oy + h)); entity.vy = -Math.abs(entity.vy); }
  },

  dist(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  },

  isColliding(a, b) {
    return Physics.dist(a.x, a.y, b.x, b.y) < a.radius + b.radius;
  },

  isCircleOctagonColliding(circle, octagon) {
    const verts = Physics.getOctagonVertices(octagon.x, octagon.y, octagon.octagonRadius);
    const cx = circle.x;
    const cy = circle.y;
    const r = circle.radius;

    let closestDist = Infinity;
    let closestPoint = null;

    for (let i = 0; i < verts.length; i++) {
      const v1 = verts[i];
      const v2 = verts[(i + 1) % verts.length];

      const dx = v2.x - v1.x;
      const dy = v2.y - v1.y;
      const len2 = dx * dx + dy * dy;

      let t = ((cx - v1.x) * dx + (cy - v1.y) * dy) / len2;
      t = Math.max(0, Math.min(1, t));

      const px = v1.x + t * dx;
      const py = v1.y + t * dy;

      const dist = Math.sqrt((cx - px) * (cx - px) + (cy - py) * (cy - py));
      if (dist < closestDist) {
        closestDist = dist;
        closestPoint = { x: px, y: py };
      }
    }

    return closestDist < r;
  }
};
