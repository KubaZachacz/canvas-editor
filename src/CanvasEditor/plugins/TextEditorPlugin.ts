import { CanvasEditor } from "../CanvasEditor";
import { ICanvasEditorPlugin } from "./CanvasEditorPlugin";
import { TextNode } from "../nodes/TextNode";
import { Node } from "../nodes/Node";

abstract class EditableTextNode extends TextNode {
  originalColor?: string;
  originalFontFamily?: string;
  originalFontWeight?: string;
}

const isEditableTextNode = (node: Node | null): node is EditableTextNode =>
  node instanceof TextNode;

export class TextEditorPlugin implements ICanvasEditorPlugin {
  private editor!: CanvasEditor;
  private isEditing = false;
  private cursorVisible = false;
  private cursorPos = { line: 0, char: 0 }; // Cursor position
  private cursorBlinkInterval: NodeJS.Timeout | null = null;
  private placeholderText = "Type your text\nhere";
  private textNode: EditableTextNode | null = null;

  init(editor: CanvasEditor) {
    this.editor = editor;
    window.addEventListener("keydown", this.onKeyDown.bind(this));

    this.editor.canvas.addEventListener(
      "mousedown",
      this.onMouseDown.bind(this)
    );
  }

  destroy() {
    window.removeEventListener("keydown", this.onKeyDown);
    if (this.cursorBlinkInterval) clearInterval(this.cursorBlinkInterval);
  }

  onMouseDown(event: MouseEvent) {
    const { offsetX, offsetY } = event;
    const clickedNode = this.editor.nodes
      .filter((node) => node instanceof TextNode)
      .find((node) => node.contains(offsetX, offsetY));

    if (clickedNode instanceof TextNode) {
      this.startEditing(clickedNode);
    }

    if (!clickedNode) {
      this.stopEditing();
    }
    this.editor.render();
  }

  onKeyDown(event: KeyboardEvent) {
    if (this.isEditing && this.editor.activeNode instanceof TextNode) {
      this.handleTextInput(event);
      this.editor.render();
    }
  }

  private startEditing(node: EditableTextNode) {
    this.isEditing = true;

    this.textNode = node;

    if (!node.text.length) {
      node.textLines = [""];
      node.color = node.originalColor || "black";
    }

    this.cursorPos = {
      line: node.textLines.length - 1,
      char: node.textLines[node.textLines.length - 1].length,
    };

    if (!this.cursorBlinkInterval) {
      this.cursorBlinkInterval = setInterval(() => {
        this.cursorVisible = !this.cursorVisible;
      }, 500);
    }
  }

  private stopEditing() {
    this.isEditing = false;

    if (this.textNode && !this.textNode?.text.length) {
      this.setPlaceholderText(this.textNode);
    }

    if (this.cursorBlinkInterval) {
      clearInterval(this.cursorBlinkInterval);
      this.cursorBlinkInterval = null;
    }
  }

  private handleTextInput(event: KeyboardEvent) {
    if (!(this.editor.activeNode instanceof TextNode)) return;

    const textNode = this.editor.activeNode;
    const { key, ctrlKey, shiftKey } = event;

    if (key === "Enter" && (ctrlKey || shiftKey)) {
      // Insert new line at cursor position
      const currentLine = textNode.textLines[this.cursorPos.line];
      const beforeCursor = currentLine.slice(0, this.cursorPos.char);
      const afterCursor = currentLine.slice(this.cursorPos.char);

      textNode.textLines.splice(this.cursorPos.line + 1, 0, afterCursor);
      textNode.textLines[this.cursorPos.line] = beforeCursor;
      textNode.text += "\n";
      // Move cursor to the new line
      this.cursorPos.line++;
      this.cursorPos.char = 0;
    } else if (key === "Enter") {
      this.stopEditing();
    } else if (key === "Backspace") {
      if (this.cursorPos.char > 0) {
        // Remove character before cursor
        const currentLine = textNode.textLines[this.cursorPos.line];
        textNode.textLines[this.cursorPos.line] =
          currentLine.slice(0, this.cursorPos.char - 1) +
          currentLine.slice(this.cursorPos.char);
        textNode.text = textNode.text.slice(0, -1);
        this.cursorPos.char--;
      } else if (this.cursorPos.line > 0) {
        // Merge with previous line
        const removedLine = textNode.textLines.splice(
          this.cursorPos.line,
          1
        )[0];
        this.cursorPos.line--;
        this.cursorPos.char = textNode.textLines[this.cursorPos.line].length;
        textNode.textLines[this.cursorPos.line] += removedLine;
        textNode.text = textNode.text.slice(0, -1);
      }
    } else if (key.length === 1) {
      // Insert character at cursor position
      const currentLine = textNode.textLines[this.cursorPos.line];
      textNode.textLines[this.cursorPos.line] =
        currentLine.slice(0, this.cursorPos.char) +
        key +
        currentLine.slice(this.cursorPos.char);
      textNode.text += key;
      this.cursorPos.char++;
    }
  }

  onRender(ctx: CanvasRenderingContext2D) {
    if (
      !this.isEditing ||
      !this.cursorVisible ||
      !(this.editor.activeNode instanceof TextNode)
    )
      return;

    const textNode = this.editor.activeNode;
    const { scaleY, textWidth, textLines, fontSize, color, fontFamily } =
      textNode;
    const { x, y, rotation } = textNode.getBounds();
    const scaledFontSize = fontSize * scaleY;
    const height = scaledFontSize * textLines.length;

    const cx = x + textWidth / 2;
    const cy = y + height / 2;

    ctx.save();

    ctx.font = `${scaledFontSize}px ${fontFamily}`;

    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    ctx.translate(-textWidth / 2, -height / 2);

    const currentLine = textLines[this.cursorPos.line] || "";
    const cursorX = ctx.measureText(
      currentLine.slice(0, this.cursorPos.char)
    ).width;
    const cursorY = this.cursorPos.line * scaledFontSize;
    ctx.fillStyle = color;
    ctx.fillRect(
      (textWidth - ctx.measureText(currentLine).width) / 2 + cursorX,
      cursorY,
      2,
      scaledFontSize * 0.8
    );

    ctx.restore();
  }

  setPlaceholderText(node: TextNode) {
    node.textLines = this.placeholderText.split("\n");
    node.color = "#818181";
    this.editor.render();
  }

  onAddNode(node: Node): void {
    if (isEditableTextNode(node)) {
      node.originalColor = node.color;
      node.originalFontFamily = node.fontFamily;
      node.originalFontWeight = node.fontWeight;

      if (!node.text.length) {
        this.setPlaceholderText(node);
        node.centerPosition();
      }

      this.startEditing(node);
    }
  }
}
