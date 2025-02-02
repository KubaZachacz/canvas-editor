/**
 * Base Node class
 */
export abstract class Node {
  // Add optional rotation / scale for demonstration
  rotation = 0;
  scaleX = 1;
  scaleY = 1;
  public transformerPadding = 0;

  // For rotate/scale calculations
  private rotateStartAngle = 0;
  private initialRotation = 0;

  private resizeStartDist = 1;
  private initialScaleX = 1;
  private initialScaleY = 1;

  constructor(public x: number, public y: number) {}

  // Called on mousedown for the rotate handle
  startRotate(mx: number, my: number) {
    // Angle from node center to mouse
    const center = this.getCenter();
    const dx = mx - center.x;
    const dy = my - center.y;
    this.rotateStartAngle = Math.atan2(dy, dx);
    this.initialRotation = this.rotation;
  }

  // Called on mousemove while rotating
  updateRotate(mx: number, my: number) {
    const center = this.getCenter();
    const dx = mx - center.x;
    const dy = my - center.y;
    const currentAngle = Math.atan2(dy, dx);
    const angleDiff = currentAngle - this.rotateStartAngle;
    this.rotation = this.initialRotation + angleDiff;
  }

  // Called on mousedown for the resize handle
  startResize(mx: number, my: number) {
    const center = this.getCenter();
    const dx = mx - center.x;
    const dy = my - center.y;
    this.resizeStartDist = Math.sqrt(dx * dx + dy * dy);
    this.initialScaleX = this.scaleX;
    this.initialScaleY = this.scaleY;
  }

  // Called on mousemove while resizing
  updateResize(mx: number, my: number) {
    const center = this.getCenter();
    const dx = mx - center.x;
    const dy = my - center.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (this.resizeStartDist !== 0) {
      const scaleFactor = dist / this.resizeStartDist;
      this.scaleX = this.initialScaleX * scaleFactor;
      this.scaleY = this.initialScaleY * scaleFactor;
    }
  }

  centerPosition() {
    const { x, y, width, height } = this.getBounds();

    this.x = x - width / 2;
    this.y = y - height / 2;
  }

  abstract draw(ctx: CanvasRenderingContext2D): void;
  abstract contains(x: number, y: number): boolean;
  abstract getBounds(padding?: number): {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
  };

  move(dx: number, dy: number) {
    this.x += dx;
    this.y += dy;
  }

  /**
   * Returns center of the node’s bounding box (in unrotated space).
   */
  getCenter() {
    const { x, y, width, height } = this.getBounds();
    return {
      x: x + width / 2,
      y: y + height / 2,
    };
  }
}
