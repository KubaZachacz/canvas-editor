import { Node } from "./Node";

/**
 * TextNode: a simple text string that we can move/scale/rotate.
 */
export class TextNode extends Node {
  private fontSize = 20;
  private fontFamily = "Arial";
  private textWidth = 0;
  private isEditing = false;
  private cursorVisible = false;
  private cursorPos = { line: 0, char: 0 }; // Track cursor in multi-line
  private textLines: string[]; // Store text as an array of lines
  private colors = ["black", "white", "red", "blue", "green"];
  color = this.colors[0];
  transformerPadding = 16;

  constructor(text: string, x: number, y: number) {
    super(x, y);
    this.textLines = text.split("\n"); // Initialize with multi-line support

    setInterval(() => {
      if (this.isEditing) this.cursorVisible = !this.cursorVisible;
    }, 500); // Blinking cursor effect
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();

    const scaledFontSize = this.fontSize * this.scaleY;
    ctx.font = `${scaledFontSize}px ${this.fontFamily}`;

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

    // If in edit mode, show cursor
    if (this.isEditing && this.cursorVisible) {
      const currentLine = this.textLines[this.cursorPos.line] || "";
      const cursorX = ctx.measureText(
        currentLine.slice(0, this.cursorPos.char)
      ).width;
      const cursorY = this.cursorPos.line * scaledFontSize;
      ctx.fillRect(
        (this.textWidth - ctx.measureText(currentLine).width) / 2 + cursorX,
        cursorY,
        2,
        scaledFontSize * 0.8
      );
    }

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

  startEditing() {
    this.isEditing = true;
    this.cursorPos = {
      line: this.textLines.length - 1,
      char: this.textLines[this.textLines.length - 1].length,
    };
  }

  stopEditing() {
    this.isEditing = false;
  }

  handleKeyPress(event: KeyboardEvent) {
    if (!this.isEditing) return;

    const { key, ctrlKey, shiftKey } = event;

    if (key === "Enter" && (ctrlKey || shiftKey)) {
      // Insert new line at cursor position
      const currentLine = this.textLines[this.cursorPos.line];
      const beforeCursor = currentLine.slice(0, this.cursorPos.char);
      const afterCursor = currentLine.slice(this.cursorPos.char);

      this.textLines.splice(this.cursorPos.line + 1, 0, afterCursor);
      this.textLines[this.cursorPos.line] = beforeCursor;

      // Move cursor to the new line
      this.cursorPos.line++;
      this.cursorPos.char = 0;
    } else if (key === "Enter") {
      this.stopEditing();
    } else if (key === "Backspace") {
      if (this.cursorPos.char > 0) {
        // Remove character before cursor
        const currentLine = this.textLines[this.cursorPos.line];
        this.textLines[this.cursorPos.line] =
          currentLine.slice(0, this.cursorPos.char - 1) +
          currentLine.slice(this.cursorPos.char);
        this.cursorPos.char--;
      } else if (this.cursorPos.line > 0) {
        // Merge with previous line
        const removedLine = this.textLines.splice(this.cursorPos.line, 1)[0];
        this.cursorPos.line--;
        this.cursorPos.char = this.textLines[this.cursorPos.line].length;
        this.textLines[this.cursorPos.line] += removedLine;
      }
    } else if (key.length === 1) {
      // Insert character at cursor position
      const currentLine = this.textLines[this.cursorPos.line];
      this.textLines[this.cursorPos.line] =
        currentLine.slice(0, this.cursorPos.char) +
        key +
        currentLine.slice(this.cursorPos.char);
      this.cursorPos.char++;
    }
  }

  // In class TextNode, added method getColorPickerSelection()
  getColorPickerSelection(mx: number, my: number): string | null {
    const { x, y, width, height, rotation } = this.getBounds(
      this.transformerPadding
    );

    const centerX = x + width / 2;
    const centerY = y + height / 2;

    // Convert mouse coordinates into rotated local space
    const cos = Math.cos(-rotation);
    const sin = Math.sin(-rotation);
    const localX = cos * (mx - centerX) - sin * (my - centerY) + centerX;
    const localY = sin * (mx - centerX) + cos * (my - centerY) + centerY;

    const pickerX = x;
    const pickerY = y + height + 24;
    const circleRadius = 8;
    const spacing = 6;

    for (let index = 0; index < this.colors.length; index++) {
      const circleX = pickerX + index * (circleRadius * 2 + spacing);
      const circleY = pickerY;

      const distance = Math.hypot(localX - circleX, localY - circleY);
      if (distance <= circleRadius) {
        this.color = this.colors[index];

        return this.color;
      }
    }
    return null;
  }
}
