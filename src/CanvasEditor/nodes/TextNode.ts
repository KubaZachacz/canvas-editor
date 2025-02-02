import { Node } from "./Node";

/**
 * TextNode: a simple text string that we can move/scale/rotate.
 */
export class TextNode extends Node {
  fontSize = 20;
  fontFamily = "Arial";
  textWidth = 0;
  text: string;
  textLines: string[]; // Store text as an array of lines
  color = "black";
  transformerPadding = 16;
  fontWeight = "bold";

  constructor(text: string, x: number, y: number) {
    super(x, y);
    this.text = text;
    this.textLines = text.split("\n");
    this.centerPosition();
  }

  setText(text: string) {
    this.text = text;
    this.textLines = text.split("\n");
  }

  getText() {
    return this.text;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();

    const scaledFontSize = this.fontSize * this.scaleY;
    ctx.font = `${this.fontWeight} ${scaledFontSize}px ${this.fontFamily}`;

    // Determine max width for alignment
    this.textWidth = Math.max(
      ...this.textLines.map((line) => ctx.measureText(line).width)
    );

    const height = scaledFontSize * this.textLines.length;

    // Compute center for correct rotation
    const cx = this.x + this.textWidth / 2;
    const cy = this.y + height / 2;

    // Apply transformations centered at (cx, cy)
    ctx.translate(cx, cy);
    ctx.rotate(this.rotation);
    ctx.translate(-this.textWidth / 2, -height / 2);

    // Draw text line by line, centering shorter lines
    ctx.fillStyle = this.color;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    this.textLines.forEach((line, i) => {
      const lineWidth = ctx.measureText(line).width;
      const offsetX = (this.textWidth - lineWidth) / 2; // Center the line
      ctx.fillText(line, offsetX, i * scaledFontSize);
    });

    ctx.restore();
  }

  contains(mx: number, my: number) {
    const { x, y, width, height, rotation } = this.getBounds();
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    const cos = Math.cos(-rotation);
    const sin = Math.sin(-rotation);
    const localX = cos * (mx - centerX) - sin * (my - centerY) + centerX;
    const localY = sin * (mx - centerX) + cos * (my - centerY) + centerY;

    return (
      localX >= x && localX <= x + width && localY >= y && localY <= y + height
    );
  }

  getBounds(padding = 0) {
    const scaledFontSize = this.fontSize * this.scaleY;
    return {
      x: this.x - padding,
      y: this.y - padding,
      width: this.textWidth + padding * 2,
      height: scaledFontSize * this.textLines.length + padding * 2,
      rotation: this.rotation,
    };
  }
}
