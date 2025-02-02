// TextNode.ts

import { Node } from "./Node";

/**
 * TextNode: a simple text string that we can move/scale/rotate.
 */
export class TextNode extends Node {
  fontSize = 20;
  fontFamily = "Poppins";
  fontWeight = "bold";
  text: string;
  textLines: string[]; // actual user text lines
  color = "black";
  transformerPadding = 16;

  /**
   * We use textWidth as actual measured width of current text (if any).
   * The plugin can enforce a minWidth (e.g. for placeholder).
   */
  textWidth = 0;
  minWidth = 0; // plugin will set this if needed (e.g. placeholder measurement)
  minLines = 0; // plugin will set this if needed (e.g. placeholder measurement)

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

    // Calculate actual text width for the user input text
    this.textWidth = Math.max(
      ...this.textLines.map((line) => ctx.measureText(line).width),
      this.minWidth * this.scaleY
    );

    const textBlockHeight = scaledFontSize * this.textLines.length;

    // Center of text for rotation pivot
    const cx = this.x + this.textWidth / 2;
    const cy = this.y + textBlockHeight / 2;

    ctx.translate(cx, cy);
    ctx.rotate(this.rotation);
    ctx.translate(-this.textWidth / 2, -textBlockHeight / 2);

    // Draw actual user text line by line
    ctx.fillStyle = this.color;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    this.textLines.forEach((line, i) => {
      const lineWidth = ctx.measureText(line).width;
      const offsetX = (this.textWidth - lineWidth) / 2; // center each line
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
    /**
     * Use the measured textWidth or the plugin-enforced minWidth
     */
    const scaledFontSize = this.fontSize * this.scaleY;
    const linesCount = this.text ? this.textLines.length : this.minLines; // handle empty text as single line
    const width =
      Math.max(this.textWidth, this.minWidth * this.scaleY) + padding * 2;
    const height = linesCount * scaledFontSize + padding * 2;

    return {
      x: this.x - padding,
      y: this.y - padding,
      width,
      height,
      rotation: this.rotation,
    };
  }
}
