export class CanvasEditor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private nodes: Node[] = [];
  private activeNode: Node | null = null;

  // Tracking mouse interactions
  private dragging = false;
  private dragStart = { x: 0, y: 0 };

  // Which handle is being dragged?
  private activeHandle: HandleType | null = null;

  // Store handle images (replace URLs with your own icons)
  private handleIcons = {
    translate: this.loadIcon("/images/translate.png"),
    delete: this.loadIcon("/images/delete.png"),
    rotate: this.loadIcon("/images/rotate.png"),
    resize: this.loadIcon("/images/resize.png"),
  };

  // Handle radius for the corner circles
  private handleRadius = 12;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.initEvents();
    this.render();
  }

  /**
   * Helper to load an icon as an HTMLImageElement.
   */
  private loadIcon(src: string): HTMLImageElement {
    const img = new Image();
    img.src = src;
    return img;
  }

  private initEvents() {
    this.canvas.addEventListener("mousedown", this.onMouseDown.bind(this));
    this.canvas.addEventListener("mousemove", this.onMouseMove.bind(this));
    this.canvas.addEventListener("mouseup", this.onMouseUp.bind(this));
    this.canvas.addEventListener("dblclick", this.onDoubleClick.bind(this));
    window.addEventListener("keydown", this.onKeyDown.bind(this));
  }

  addText(text: string, x: number, y: number) {
    this.nodes.push(new TextNode(text, x, y));
    this.render();
  }

  addImage(src: string, x: number, y: number) {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      this.nodes.push(new ImageNode(img, x, y));
      this.render();
    };
  }

  private onMouseDown(event: MouseEvent) {
    const { offsetX, offsetY } = event;

    // Check if we clicked on a handle of the currently active node first
    if (this.activeNode) {
      const handleType = this.getHandleClicked(
        this.activeNode,
        offsetX,
        offsetY
      );
      if (handleType) {
        // We clicked on a handle of the active node
        this.activeHandle = handleType;
        this.dragging = handleType !== "delete"; // for delete, we won't drag
        this.dragStart = { x: offsetX, y: offsetY };

        if (handleType === "delete") {
          // Remove active node from the array
          const index = this.nodes.indexOf(this.activeNode);
          if (index > -1) {
            this.nodes.splice(index, 1);
            this.activeNode = null;
          }
          this.render();
        } else if (handleType === "rotate") {
          // Initialize rotation anchor angle
          this.activeNode.startRotate(offsetX, offsetY);
        } else if (handleType === "resize") {
          // Initialize scale anchor
          this.activeNode.startResize(offsetX, offsetY);
        }
        return;
      }
    }

    // If not clicked on a handle, see if we clicked on any node
    const clickedNode = this.nodes
      .slice()
      .reverse()
      .find((node) => node.contains(offsetX, offsetY));

    if (clickedNode !== this.activeNode) {
      if (this.activeNode instanceof TextNode) {
        this.activeNode.stopEditing(); // Stop editing when clicking outside
      }
      this.activeNode = clickedNode || null;
    }

    // If we clicked on the active node *outside* any handle, do nothing or
    // if you want to ONLY translate from the top-left handle, do nothing here.
    // But if you'd like the entire node to be draggable (in addition to the handle),
    // you could set `this.dragging = true` here.
    //
    // For the request: "so no drag at whole node" we do NOT set dragging unless top-left handle is chosen.
    // So we leave dragging = false here.

    this.render();
  }

  private onMouseMove(event: MouseEvent) {
    if (!this.dragging || !this.activeNode || !this.activeHandle) return;

    const dx = event.offsetX - this.dragStart.x;
    const dy = event.offsetY - this.dragStart.y;

    switch (this.activeHandle) {
      case "translate":
        // Move the node
        this.activeNode.move(dx, dy);
        break;
      case "rotate":
        // Rotate the node around its center
        this.activeNode.updateRotate(event.offsetX, event.offsetY);
        break;
      case "resize":
        // Scale the node
        this.activeNode.updateResize(event.offsetX, event.offsetY);
        break;
      default:
        break;
    }

    this.dragStart = { x: event.offsetX, y: event.offsetY };
  }

  private onMouseUp() {
    this.dragging = false;
    this.activeHandle = null;
  }

  private onDoubleClick() {
    if (this.activeNode instanceof TextNode) {
      this.activeNode.startEditing();
    }
  }

  private onKeyDown(event: KeyboardEvent) {
    if (this.activeNode instanceof TextNode) {
      this.activeNode.handleKeyPress(event);
    }
  }

  private render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.nodes.forEach((node) => node.draw(this.ctx));

    if (this.activeNode) {
      this.drawTransformer(this.activeNode);
      requestAnimationFrame(() => this.render());
    }
  }

  /**
   * Draws the bounding box + corner handles for the active node.
   */
  private drawTransformer(node: Node) {
    const { x, y, width, height, rotation } = node.getBounds(
      node.transformerPadding
    );
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    // Draw bounding box (purple)
    this.ctx.save();
    this.ctx.translate(centerX, centerY);
    this.ctx.rotate(rotation);
    this.ctx.translate(-centerX, -centerY);
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = "purple";
    this.ctx.strokeRect(x, y, width, height);
    this.ctx.restore();

    // Draw the 4 handles:
    //   Top-left    => translate
    //   Top-right   => delete
    //   Bottom-right => rotate
    //   Bottom-left  => resize
    //
    // Define handle positions in local (unrotated) space
    const handles = [
      { x, y, icon: this.handleIcons.translate },
      { x: x + width, y, icon: this.handleIcons.delete },
      { x: x + width, y: y + height, icon: this.handleIcons.rotate },
      { x, y: y + height, icon: this.handleIcons.resize },
    ];

    // Rotate and draw handles
    handles.forEach(({ x, y, icon }) => {
      this.drawHandle(x, y, icon, rotation, centerX, centerY);
    });
  }

  /**
   * Draws a single handle (circle + icon).
   */
  private drawHandle(
    cx: number,
    cy: number,
    icon: HTMLImageElement,
    angle: number,
    centerX: number,
    centerY: number
  ) {
    this.ctx.save();
    // Rotate handle position
    this.ctx.translate(centerX, centerY);
    this.ctx.rotate(angle);
    this.ctx.translate(-centerX, -centerY);

    // Draw circle
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, this.handleRadius, 0, 2 * Math.PI, false);
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    this.ctx.fill();
    this.ctx.strokeStyle = "#999";
    this.ctx.stroke();
    this.ctx.closePath();

    // Draw the icon centered
    if (icon.complete) {
      const iconSize = this.handleRadius * 1.5;
      this.ctx.drawImage(
        icon,
        cx - iconSize / 2,
        cy - iconSize / 2,
        iconSize,
        iconSize
      );
    }
    this.ctx.restore();
  }

  /**
   * Checks if a mouse click is on one of the 4 handles and returns which handle type.
   */
  private getHandleClicked(
    node: Node,
    mx: number,
    my: number
  ): HandleType | null {
    const { x, y, width, height, rotation } = node.getBounds(
      node.transformerPadding
    );
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    // Convert mouse position into node's local (unrotated) space
    const cos = Math.cos(-rotation);
    const sin = Math.sin(-rotation);
    const localX = cos * (mx - centerX) - sin * (my - centerY) + centerX;
    const localY = sin * (mx - centerX) + cos * (my - centerY) + centerY;

    // Define handle positions in local space
    const handles = [
      { x, y, type: "translate" },
      { x: x + width, y, type: "delete" },
      { x: x + width, y: y + height, type: "rotate" },
      { x, y: y + height, type: "resize" },
    ];

    // Check if the transformed mouse position is within any handle
    for (const handle of handles) {
      const distance = Math.hypot(localX - handle.x, localY - handle.y);
      if (distance <= this.handleRadius) {
        return handle.type as HandleType;
      }
    }

    return null;
  }
}

/**
 * Type of handle.
 */
type HandleType = "translate" | "delete" | "rotate" | "resize";

/**
 * Base Node class
 */
abstract class Node {
  // Add optional rotation / scale for demonstration
  protected rotation = 0;
  protected scaleX = 1;
  protected scaleY = 1;
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

/**
 * TextNode: a simple text string that we can move/scale/rotate.
 */
class TextNode extends Node {
  private fontSize = 20;
  private fontFamily = "Arial";
  private textWidth = 0;
  private isEditing = false;
  private cursorVisible = false;
  private cursorPos = { line: 0, char: 0 }; // Track cursor in multi-line
  private textLines: string[]; // Store text as an array of lines
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

    // Draw text line by line
    ctx.fillStyle = "black";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    this.textLines.forEach((line, i) => {
      ctx.fillText(line, 0, i * scaledFontSize);
    });

    // If in edit mode, show cursor
    if (this.isEditing && this.cursorVisible) {
      const currentLine = this.textLines[this.cursorPos.line] || "";
      const cursorX = ctx.measureText(
        currentLine.slice(0, this.cursorPos.char)
      ).width;
      const cursorY = this.cursorPos.line * scaledFontSize;
      ctx.fillRect(cursorX, cursorY, 2, scaledFontSize * 0.8); // Cursor
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
}

/**
 * ImageNode: draws an image that can be moved, scaled, rotated.
 */
class ImageNode extends Node {
  constructor(private img: HTMLImageElement, x: number, y: number) {
    super(x, y);
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
}
