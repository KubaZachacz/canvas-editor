import { CanvasEditor } from "../CanvasEditor";
import { TextNode } from "../nodes";
import { ICanvasEditorPlugin } from "./CanvasEditorPlugin";

export class ColorPickerPlugin implements ICanvasEditorPlugin {
  private editor!: CanvasEditor;
  private colors = ["black", "white", "red", "blue", "green"];
  private circleRadius = 8;
  private spacing = 12;
  private yOffset = 16;
  private xOffset = 8;
  private canvasListener?: (e: MouseEvent) => void;

  constructor(colors?: string[]) {
    if (colors) this.colors = colors;
  }

  init(editor: CanvasEditor) {
    this.editor = editor;
    // Add canvas listener for color pick
    this.canvasListener = this.onCanvasMouseDown.bind(this);
    // Use capture phase to ensure we get the event first
    this.editor.canvas.addEventListener("mousedown", this.canvasListener, true);
  }

  /**
   * Removing event listeners when plugin is destroyed
   */
  destroy() {
    if (this.canvasListener) {
      this.editor.canvas.removeEventListener(
        "mousedown",
        this.canvasListener,
        true
      );
    }
  }

  onRender(ctx: CanvasRenderingContext2D, editor: CanvasEditor) {
    // If the active node is a TextNode, draw the color picker circles
    const activeNode = editor.activeNode;
    if (!(activeNode instanceof TextNode)) return;

    const { x, y, width, height, rotation } = activeNode.getBounds(
      activeNode.transformerPadding
    );
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    // Position the color picker below the text bounding box
    const pickerX = x + this.xOffset;
    const pickerY = y + height + this.yOffset;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);
    ctx.translate(-centerX, -centerY);

    this.colors.forEach((color, index) => {
      const circleX = pickerX + index * (this.circleRadius * 2 + this.spacing);
      const circleY = pickerY;

      // If the node's current color is the same, draw a highlight
      if (activeNode.color === color) {
        ctx.beginPath();
        ctx.arc(circleX, circleY, this.circleRadius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(circleX, circleY, this.circleRadius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.closePath();
    });

    ctx.restore();
  }

  private onCanvasMouseDown(event: MouseEvent) {
    const { offsetX, offsetY } = event;
    const activeNode = this.editor.activeNode;
    if (!(activeNode instanceof TextNode)) return;

    const { x, y, width, height, rotation } = activeNode.getBounds(
      activeNode.transformerPadding
    );
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    // Convert mouse coords into node's local space
    const cos = Math.cos(-rotation);
    const sin = Math.sin(-rotation);
    const localX =
      cos * (offsetX - centerX) - sin * (offsetY - centerY) + centerX;
    const localY =
      sin * (offsetX - centerX) + cos * (offsetY - centerY) + centerY;

    const pickerX = x + this.xOffset;
    const pickerY = y + height + this.yOffset;

    for (let index = 0; index < this.colors.length; index++) {
      const circleX = pickerX + index * (this.circleRadius * 2 + this.spacing);
      const circleY = pickerY;
      const distance = Math.hypot(localX - circleX, localY - circleY);

      if (distance <= this.circleRadius) {
        activeNode.color = this.colors[index];
        // Force re-render
        this.editor.render();
        event.preventDefault();
        event.stopPropagation();
        break;
      }
    }
  }
}
