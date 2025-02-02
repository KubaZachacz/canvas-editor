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
  private cursorBlinkInterval: ReturnType<typeof setInterval> | null = null;

  private placeholderText = "Type your text\nhere";
  private placeholderColor = "#818181";
  private textNode: TextNode | null = null;

  /**
   * Avoid multiple re-renders in quick succession.
   */
  private requestRender = (() => {
    let frameRequested = false;
    return () => {
      if (!frameRequested) {
        frameRequested = true;
        requestAnimationFrame(() => {
          frameRequested = false;
          this.editor.render();
        });
      }
    };
  })();

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
    this.editor.canvas.removeEventListener("mousedown", this.onMouseDown);
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
    this.requestRender();
  }

  onKeyDown(event: KeyboardEvent) {
    if (this.isEditing && this.editor.activeNode instanceof TextNode) {
      this.handleTextInput(event);
      this.requestRender();
    }
  }

  private startEditing(node: TextNode) {
    this.isEditing = true;
    this.editor.activeNode = node;
    this.textNode = node;

    if (!node.text) {
      node.setText("");
      this.cursorPos = { line: 0, char: 0 };
    } else {
      this.cursorPos = {
        line: node.textLines.length - 1,
        char: node.textLines[node.textLines.length - 1].length,
      };
    }

    this.ensureMinWidthFromPlaceholder(node);
    this.updateNodeTextMetrics(node);

    if (!this.cursorBlinkInterval) {
      this.cursorBlinkInterval = setInterval(() => {
        this.cursorVisible = !this.cursorVisible;
        this.requestRender();
      }, 500);
    }
  }

  private stopEditing() {
    this.isEditing = false;

    if (this.cursorBlinkInterval) {
      clearInterval(this.cursorBlinkInterval);
      this.cursorBlinkInterval = null;
    }
    this.textNode = null;
    this.cursorPos = { line: 0, char: 0 };
    this.requestRender();
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

  /**
   * Store text metrics in the node (textWidth) to avoid repetitive measurements on every render.
   */
  private updateNodeTextMetrics(node: TextNode) {
    const ctx = this.editor.canvas.getContext("2d");
    if (!ctx) return;

    ctx.save();
    ctx.font = `${node.fontWeight} ${node.fontSize}px ${node.fontFamily}`;
    const widths = node.textLines.map((line) => ctx.measureText(line).width);
    node.textWidth = Math.max(...widths, 0);
    ctx.restore();
  }

  private handleTextInput(event: KeyboardEvent) {
    const node = this.textNode;
    if (!node) return;
    const { key, ctrlKey } = event;

    // Enter =>  new line
    if (key === "Enter") {
      event.preventDefault();
      const currentLine = node.textLines[this.cursorPos.line] || "";
      const before = currentLine.slice(0, this.cursorPos.char);
      const after = currentLine.slice(this.cursorPos.char);

      node.textLines[this.cursorPos.line] = before;
      node.textLines.splice(this.cursorPos.line + 1, 0, after);
      node.text = node.textLines.join("\n");
      this.cursorPos.line++;
      this.cursorPos.char = 0;
      this.updateNodeTextMetrics(node);
      return;
    }

    // Paste
    if (ctrlKey && key === "v") {
      event.preventDefault();
      navigator.clipboard.readText().then((text) => {
        const lines = text.split("\n");
        const currentLine = node.textLines[this.cursorPos.line] || "";
        const before = currentLine.slice(0, this.cursorPos.char);
        const after = currentLine.slice(this.cursorPos.char);

        node.textLines[this.cursorPos.line] = before + lines[0] + after;
        node.text = node.textLines.join("\n");
        this.updateNodeTextMetrics(node);

        lines.slice(1).forEach((line) => {
          this.cursorPos.line++;
          this.cursorPos.char = 0;
          node.textLines.splice(this.cursorPos.line, 0, line);
        });
        node.text = node.textLines.join("\n");
        this.updateNodeTextMetrics(node);
      });
      return;
    }

    // Backspace
    if (key === "Backspace") {
      event.preventDefault();
      if (this.cursorPos.char > 0) {
        const lineStr = node.textLines[this.cursorPos.line] || "";
        node.textLines[this.cursorPos.line] =
          lineStr.slice(0, this.cursorPos.char - 1) +
          lineStr.slice(this.cursorPos.char);
        this.cursorPos.char--;
      } else if (this.cursorPos.line > 0) {
        const removedLine = node.textLines.splice(this.cursorPos.line, 1)[0];
        this.cursorPos.line--;
        const prevLine = node.textLines[this.cursorPos.line];
        this.cursorPos.char = prevLine.length;
        node.textLines[this.cursorPos.line] = prevLine + removedLine;
      }
      node.text = node.textLines.join("\n");
      this.updateNodeTextMetrics(node);
      return;
    }

    // Arrow key handling
    if (key === "ArrowLeft") {
      event.preventDefault();
      if (this.cursorPos.char > 0) {
        this.cursorPos.char--;
      } else if (this.cursorPos.line > 0) {
        this.cursorPos.line--;
        this.cursorPos.char = node.textLines[this.cursorPos.line].length;
      }
      return;
    }
    if (key === "ArrowRight") {
      event.preventDefault();
      const lineLength = node.textLines[this.cursorPos.line].length;
      if (this.cursorPos.char < lineLength) {
        this.cursorPos.char++;
      } else if (this.cursorPos.line < node.textLines.length - 1) {
        this.cursorPos.line++;
        this.cursorPos.char = 0;
      }
      return;
    }
    if (key === "ArrowUp") {
      event.preventDefault();
      if (this.cursorPos.line > 0) {
        this.cursorPos.line--;
        this.cursorPos.char = Math.min(
          this.cursorPos.char,
          node.textLines[this.cursorPos.line].length
        );
      }
      return;
    }
    if (key === "ArrowDown") {
      event.preventDefault();
      if (this.cursorPos.line < node.textLines.length - 1) {
        this.cursorPos.line++;
        this.cursorPos.char = Math.min(
          this.cursorPos.char,
          node.textLines[this.cursorPos.line].length
        );
      }
      return;
    }

    // Character typing
    if (key.length === 1) {
      event.preventDefault();
      const lineStr = node.textLines[this.cursorPos.line] || "";
      node.textLines[this.cursorPos.line] =
        lineStr.slice(0, this.cursorPos.char) +
        key +
        lineStr.slice(this.cursorPos.char);

      this.cursorPos.char++;
      node.text = node.textLines.join("\n");
      this.updateNodeTextMetrics(node);
      return;
    }
  }

  onRender(ctx: CanvasRenderingContext2D) {
    const textNodes = this.editor.nodes.filter(
      (node) => node instanceof TextNode
    );

    textNodes.forEach((node) => {
      const scaledFontSize = node.fontSize * node.scaleY;
      const linesCount = node.textLines.length || 1;

      const actualWidth = Math.max(node.textWidth, node.minWidth * node.scaleX);
      const actualHeight = linesCount * scaledFontSize;

      const { x, y, rotation } = node.getBounds();
      const cx = x + actualWidth / 2;
      const cy = y + actualHeight / 2;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);
      ctx.translate(-actualWidth / 2, -actualHeight / 2);

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

      if (this.isEditing && node === this.textNode && this.cursorVisible) {
        ctx.font = `${node.fontWeight} ${scaledFontSize}px ${node.fontFamily}`;
        const lines = node.textLines.length ? node.textLines : [""];
        const lineStr = lines[this.cursorPos.line] || "";

        const typedWidthSoFar = ctx.measureText(
          lineStr.slice(0, this.cursorPos.char)
        ).width;
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
      if (!node.text) {
        this.ensureMinWidthFromPlaceholder(node);
      }
      this.startEditing(node);
    }
  }
}
