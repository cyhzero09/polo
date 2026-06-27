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

  getAxes(verts1, verts2) {
    const axes = [];
    for (let i = 0; i < verts1.length; i++) {
      const edge = {
        x: verts1[(i + 1) % verts1.length].x - verts1[i].x,
        y: verts1[(i + 1) % verts1.length].y - verts1[i].y
      };
      axes.push({ x: -edge.y, y: edge.x });
    }
    return axes;
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
        collisionAxis = axis;
      }
    }

    if (!collisionAxis) return;

    const len = Math.sqrt(collisionAxis.x * collisionAxis.x + collisionAxis.y * collisionAxis.y);
    const nx = collisionAxis.x / len;
    const ny = collisionAxis.y / len;

    const dvx = c1.vx - c2.vx;
    const dvy = c1.vy - c2.vy;
    const velAlongNormal = dvx * nx + dvy * ny;

    if (velAlongNormal <= 0) return;

    c1.vx -= velAlongNormal * nx;
    c1.vy -= velAlongNormal * ny;
    c2.vx += velAlongNormal * nx;
    c2.vy += velAlongNormal * ny;

    const overlap = minOverlap / 2;
    c1.x -= overlap * nx;
    c1.y -= overlap * ny;
    c2.x += overlap * nx;
    c2.y += overlap * ny;
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
