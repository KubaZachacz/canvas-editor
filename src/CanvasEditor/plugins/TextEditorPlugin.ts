// TextEditorPlugin.ts

import { CanvasEditor } from "../CanvasEditor";
import { ICanvasEditorPlugin } from "./CanvasEditorPlugin";
import { TextNode } from "../nodes/TextNode";
import { Node } from "../nodes/Node";

export class TextEditorPlugin implements ICanvasEditorPlugin {
  private editor!: CanvasEditor;
  private isEditing = false;
  private cursorVisible = false;
  private cursorPos = { line: 0, char: 0 };
  private cursorBlinkInterval: NodeJS.Timeout | null = null;

  // multiline placeholder
  private placeholderText = "Type your text\nhere";
  private placeholderColor = "#818181";

  // current editing node
  private textNode: TextNode | null = null;

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
    if (this.cursorBlinkInterval) {
      clearInterval(this.cursorBlinkInterval);
    }
  }

  onMouseDown(event: MouseEvent) {
    const { offsetX, offsetY } = event;
    const clickedNode = this.editor.nodes
      .filter((node) => node instanceof TextNode)
      .find((node) => node.contains(offsetX, offsetY));

    if (clickedNode instanceof TextNode) {
      this.startEditing(clickedNode);
    } else {
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

  private startEditing(node: TextNode) {
    this.isEditing = true;
    this.editor.activeNode = node;
    this.textNode = node;

    // If no user text, ensure lines = [""]
    if (!node.text) {
      node.setText("");
      this.cursorPos = { line: 0, char: 0 };
    } else {
      this.cursorPos = {
        line: node.textLines.length - 1,
        char: node.textLines[node.textLines.length - 1].length,
      };
    }

    // measure placeholder to enforce minWidth
    this.ensureMinWidthFromPlaceholder(node);

    if (!this.cursorBlinkInterval) {
      this.cursorBlinkInterval = setInterval(() => {
        this.cursorVisible = !this.cursorVisible;
        this.editor.render();
      }, 500);
    }
  }

  private stopEditing() {
    this.isEditing = false;

    // If editing node was empty and we never typed, it remains empty => placeholder used
    // (No direct placeholder injection here; we rely on the plugin's draw logic.)

    if (this.cursorBlinkInterval) {
      clearInterval(this.cursorBlinkInterval);
      this.cursorBlinkInterval = null;
    }

    this.textNode = null;
    this.cursorPos = { line: 0, char: 0 };
    this.editor.render();
  }

  private ensureMinWidthFromPlaceholder(node: TextNode) {
    const ctx = this.editor.canvas.getContext("2d");
    if (!ctx) return;

    ctx.save();
    ctx.font = `${node.fontWeight} ${node.fontSize}px ${node.fontFamily}`;
    const lines = this.placeholderText.split("\n");
    const placeholderWidth = Math.max(
      ...lines.map((line) => ctx.measureText(line).width)
    );
    node.minWidth = placeholderWidth;
    node.minLines = lines.length;

    ctx.restore();
  }

  private handleTextInput(event: KeyboardEvent) {
    const node = this.textNode;
    if (!node) return;

    const { key, shiftKey, ctrlKey } = event;

    // SHIFT or CTRL + ENTER => insert newline at cursor
    if (key === "Enter" && (shiftKey || ctrlKey)) {
      event.preventDefault();
      const currentLine = node.textLines[this.cursorPos.line] ?? "";
      const before = currentLine.slice(0, this.cursorPos.char);
      const after = currentLine.slice(this.cursorPos.char);

      node.textLines[this.cursorPos.line] = before;
      node.textLines.splice(this.cursorPos.line + 1, 0, after);
      node.text = node.textLines.join("\n");

      this.cursorPos.line++;
      this.cursorPos.char = 0;
      return;
    }

    // ENTER => stop editing
    if (key === "Enter") {
      event.preventDefault();
      this.stopEditing();
      return;
    }

    // BACKSPACE
    if (key === "Backspace") {
      event.preventDefault();
      if (this.cursorPos.char > 0) {
        const lineStr = node.textLines[this.cursorPos.line] || "";
        node.textLines[this.cursorPos.line] =
          lineStr.slice(0, this.cursorPos.char - 1) +
          lineStr.slice(this.cursorPos.char);
        this.cursorPos.char--;
      } else if (this.cursorPos.line > 0) {
        // merge with previous line
        const removedLine = node.textLines.splice(this.cursorPos.line, 1)[0];
        this.cursorPos.line--;
        const prevLine = node.textLines[this.cursorPos.line];
        this.cursorPos.char = prevLine.length;
        node.textLines[this.cursorPos.line] = prevLine + removedLine;
      }
      node.text = node.textLines.join("\n");
      return;
    }

    // Basic character typing
    if (key.length === 1) {
      event.preventDefault();
      const lineStr = node.textLines[this.cursorPos.line] || "";
      node.textLines[this.cursorPos.line] =
        lineStr.slice(0, this.cursorPos.char) +
        key +
        lineStr.slice(this.cursorPos.char);

      this.cursorPos.char++;
      node.text = node.textLines.join("\n");
      return;
    }

    // You could add arrow key handling, etc. here
  }

  /**
   * We draw placeholder (if node has empty text) for all text nodes, not just the active one.
   * If the node is currently being edited (isEditing && node === textNode), we also draw the cursor if visible.
   */
  onRender(ctx: CanvasRenderingContext2D) {
    // The core engine calls each node's draw() first. That draws user text if it exists.
    // Now we overlay placeholder/cursor for *all* text nodes if needed.
    const textNodes = this.editor.nodes.filter(
      (node) => node instanceof TextNode
    );

    textNodes.forEach((node) => {
      const scaledFontSize = node.fontSize * node.scaleY;
      const linesCount = node.textLines.length || 1;

      // measure either user text or fallback to minWidth for bounding
      const actualWidth = Math.max(node.textWidth, node.minWidth);
      const actualHeight = linesCount * scaledFontSize;

      const { x, y, rotation } = node.getBounds(); // getBounds includes minWidth in width
      const cx = x + actualWidth / 2;
      const cy = y + actualHeight / 2;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);
      ctx.translate(-actualWidth / 2, -actualHeight / 2);

      // If node has no user text => show placeholder
      const isNodeEmpty = !node.text;
      if (isNodeEmpty) {
        ctx.font = `${node.fontWeight} ${scaledFontSize}px ${node.fontFamily}`;
        ctx.fillStyle = this.placeholderColor;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";

        const placeholderLines = this.placeholderText.split("\n");
        placeholderLines.forEach((pLine, i) => {
          const pw = ctx.measureText(pLine).width;
          const offsetX = (actualWidth - pw) / 2;
          ctx.fillText(pLine, offsetX, i * scaledFontSize);
        });
      }

      // Draw cursor only if this node is the one currently editing
      if (this.isEditing && node === this.textNode && this.cursorVisible) {
        ctx.font = `${node.fontWeight} ${scaledFontSize}px ${node.fontFamily}`;
        const lines = node.textLines.length ? node.textLines : [""];

        const lineStr = lines[this.cursorPos.line] || "";
        const typedWidthSoFar = ctx.measureText(
          lineStr.slice(0, this.cursorPos.char)
        ).width;

        // center line within actualWidth
        const fullLineWidth = ctx.measureText(lineStr).width;
        const offsetX = (actualWidth - fullLineWidth) / 2;
        const cursorX = offsetX + typedWidthSoFar;
        const cursorY = this.cursorPos.line * scaledFontSize;

        ctx.fillStyle = isNodeEmpty ? "black" : node.color;
        ctx.fillRect(cursorX, cursorY, 2, scaledFontSize * 0.8);
      }

      ctx.restore();
    });
  }

  onAddNode(node: Node): void {
    if (node instanceof TextNode) {
      // if it's an empty node, measure placeholder for minWidth
      if (!node.text) {
        this.ensureMinWidthFromPlaceholder(node);
      }

      // auto-start editing new text nodes
      this.startEditing(node);
    }
  }
}
