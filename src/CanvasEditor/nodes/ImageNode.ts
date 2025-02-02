import { Node } from "./Node";
/**
 * ImageNode: draws an image that can be moved, scaled, rotated.
 */
export class ImageNode extends Node {
  constructor(
    private img: HTMLImageElement,
    x: number,
    y: number,
    canvasWidth: number,
    canvasHeight: number
  ) {
    super(x, y);

    this.scaleToFit(canvasWidth, canvasHeight);
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.img.complete) return;

    const bounds = this.getBounds();
    const cx = bounds.x + bounds.width / 2;
    const cy = bounds.y + bounds.height / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.rotation);

    // Apply scaling properly
    ctx.scale(this.scaleX, this.scaleY);

    ctx.drawImage(
      this.img,
      -this.img.width / 2,
      -this.img.height / 2,
      this.img.width,
      this.img.height
    );

    ctx.restore();
  }

  contains(mx: number, my: number): boolean {
    const { x, y, width, height, rotation } = this.getBounds();

    // Compute the center of the image
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    // Convert mouse coordinates to the image’s local space by rotating in reverse
    const cos = Math.cos(-rotation);
    const sin = Math.sin(-rotation);
    const localX = cos * (mx - centerX) - sin * (my - centerY) + centerX;
    const localY = sin * (mx - centerX) + cos * (my - centerY) + centerY;

    // Now check if the transformed local point is inside the original (unrotated) rectangle
    return (
      localX >= x && localX <= x + width && localY >= y && localY <= y + height
    );
  }

  getBounds() {
    // base w/h times current scale
    const baseWidth = this.img.width;
    const baseHeight = this.img.height;
    const scaledWidth = baseWidth * this.scaleX;
    const scaledHeight = baseHeight * this.scaleY;
    return {
      x: this.x,
      y: this.y,
      width: scaledWidth,
      height: scaledHeight,
      rotation: this.rotation,
    };
  }

  scaleToFit(width: number, height: number) {
    const imgRatio = this.img.width / this.img.height;
    const canvasRatio = width / height;

    if (this.img.width > width || this.img.height > height) {
      if (imgRatio > canvasRatio) {
        // Image is wider than the canvas
        this.scaleX = width / this.img.width;
        this.scaleY = width / this.img.width;
      } else {
        // Image is taller than the canvas
        this.scaleX = height / this.img.height;
        this.scaleY = height / this.img.height;
      }
    }

    this.centerPosition();
  }
}
