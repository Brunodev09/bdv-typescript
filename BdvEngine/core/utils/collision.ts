/**
 * 2D collision detection utilities.
 *
 * Usage:
 *   if (Collision.rectRect(ax, ay, aw, ah, bx, by, bw, bh)) { ... }
 *   if (Collision.circleCircle(ax, ay, ar, bx, by, br)) { ... }
 *   if (Collision.pointRect(mx, my, rx, ry, rw, rh)) { ... }
 */
export class Collision {

  /** AABB vs AABB. */
  static rectRect(
    ax: number, ay: number, aw: number, ah: number,
    bx: number, by: number, bw: number, bh: number,
  ): boolean {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  /** Circle vs circle. */
  static circleCircle(
    ax: number, ay: number, ar: number,
    bx: number, by: number, br: number,
  ): boolean {
    let dx = ax - bx, dy = ay - by;
    let dist = dx * dx + dy * dy;
    let radSum = ar + br;
    return dist < radSum * radSum;
  }

  /** Point inside rect. */
  static pointRect(
    px: number, py: number,
    rx: number, ry: number, rw: number, rh: number,
  ): boolean {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
  }

  /** Point inside circle. */
  static pointCircle(
    px: number, py: number,
    cx: number, cy: number, cr: number,
  ): boolean {
    let dx = px - cx, dy = py - cy;
    return dx * dx + dy * dy < cr * cr;
  }

  /** Circle vs AABB. */
  static circleRect(
    cx: number, cy: number, cr: number,
    rx: number, ry: number, rw: number, rh: number,
  ): boolean {
    let nearestX = Math.max(rx, Math.min(cx, rx + rw));
    let nearestY = Math.max(ry, Math.min(cy, ry + rh));
    let dx = cx - nearestX, dy = cy - nearestY;
    return dx * dx + dy * dy < cr * cr;
  }

  /** Line segment vs AABB. Returns true if any part of the line intersects the rect. */
  static lineRect(
    x1: number, y1: number, x2: number, y2: number,
    rx: number, ry: number, rw: number, rh: number,
  ): boolean {
    // Check if either endpoint is inside
    if (Collision.pointRect(x1, y1, rx, ry, rw, rh)) return true;
    if (Collision.pointRect(x2, y2, rx, ry, rw, rh)) return true;

    // Check line against each edge
    if (Collision.lineLine(x1, y1, x2, y2, rx, ry, rx + rw, ry)) return true;
    if (Collision.lineLine(x1, y1, x2, y2, rx + rw, ry, rx + rw, ry + rh)) return true;
    if (Collision.lineLine(x1, y1, x2, y2, rx, ry + rh, rx + rw, ry + rh)) return true;
    if (Collision.lineLine(x1, y1, x2, y2, rx, ry, rx, ry + rh)) return true;

    return false;
  }

  /** Line segment vs line segment. */
  static lineLine(
    x1: number, y1: number, x2: number, y2: number,
    x3: number, y3: number, x4: number, y4: number,
  ): boolean {
    let denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (denom === 0) return false;

    let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
  }

  /**
   * AABB overlap resolution — returns the minimum translation vector to separate A from B.
   * Returns null if not overlapping.
   */
  static rectOverlap(
    ax: number, ay: number, aw: number, ah: number,
    bx: number, by: number, bw: number, bh: number,
  ): { x: number; y: number } | null {
    let overlapX = Math.min(ax + aw - bx, bx + bw - ax);
    let overlapY = Math.min(ay + ah - by, by + bh - ay);

    if (overlapX <= 0 || overlapY <= 0) return null;

    if (overlapX < overlapY) {
      return { x: (ax + aw / 2 < bx + bw / 2) ? -overlapX : overlapX, y: 0 };
    } else {
      return { x: 0, y: (ay + ah / 2 < by + bh / 2) ? -overlapY : overlapY };
    }
  }

  /**
   * Ray cast against AABB. Returns distance to intersection (0-1 along ray), or -1 if no hit.
   */
  static rayRect(
    originX: number, originY: number,
    dirX: number, dirY: number,
    rx: number, ry: number, rw: number, rh: number,
  ): number {
    let tmin = -Infinity, tmax = Infinity;

    if (dirX !== 0) {
      let t1 = (rx - originX) / dirX;
      let t2 = (rx + rw - originX) / dirX;
      tmin = Math.max(tmin, Math.min(t1, t2));
      tmax = Math.min(tmax, Math.max(t1, t2));
    } else if (originX < rx || originX > rx + rw) {
      return -1;
    }

    if (dirY !== 0) {
      let t1 = (ry - originY) / dirY;
      let t2 = (ry + rh - originY) / dirY;
      tmin = Math.max(tmin, Math.min(t1, t2));
      tmax = Math.min(tmax, Math.max(t1, t2));
    } else if (originY < ry || originY > ry + rh) {
      return -1;
    }

    if (tmax >= tmin && tmax >= 0) {
      return tmin >= 0 ? tmin : tmax;
    }
    return -1;
  }
}
