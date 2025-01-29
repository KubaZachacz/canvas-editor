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
    this.render();
  }

  private onMouseUp() {
    this.dragging = false;
    this.activeHandle = null;
  }

  private render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.nodes.forEach((node) => node.draw(this.ctx));

    if (this.activeNode) {
      this.drawTransformer(this.activeNode);
    }
  }

  /**
   * Draws the bounding box + corner handles for the active node.
   */
  private drawTransformer(node: Node) {
    const { x, y, width, height, rotation } = node.getBounds();
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
    const { x, y, width, height, rotation } = node.getBounds();
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
  abstract getBounds(): {
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

  constructor(private text: string, x: number, y: number) {
    super(x, y);
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Save and apply transformation
    ctx.save();

    // get size for bounding
    ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    this.textWidth = ctx.measureText(this.text).width;

    // Move to (this.x, this.y), then rotate and scale
    const { x, y, width, height } = this.getBounds();
    const cx = x + width / 2;
    const cy = y + height / 2;

    ctx.translate(cx, cy);
    ctx.rotate(this.rotation);
    ctx.scale(this.scaleX, this.scaleY);

    // Draw text centered at 0,0
    ctx.fillStyle = "black";
    // Because our bounding box expects top-left at x,y -  we align the text
    // so that (x, y) is effectively the top-left. However, for correct
    // rotation about the center, we shift by half the bounding box:
    ctx.fillText(this.text, -width / 2, height / 2 - 5);

    ctx.restore();
  }

  contains(mx: number, my: number) {
    // Simple bounding box check in unrotated space:
    // Get bounding box
    const { x, y, width, height } = this.getBounds();
    return mx >= x && mx <= x + width && my >= y && my <= y + height;
  }

  getBounds() {
    // Approx bounding box: textWidth x fontSize
    // Use scale to expand the bounding box
    // Rotational bounding box is not accounted for, so it’s an approximation.
    const scaledWidth = this.textWidth * this.scaleX;
    const scaledHeight = this.fontSize * this.scaleY;
    return {
      x: this.x,
      y: this.y - scaledHeight, // so text baseline sits near y
      width: scaledWidth,
      height: scaledHeight,
      rotation: this.rotation,
    };
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
    const { width, height } = this.getBounds();

    ctx.save();
    // center of bounding box
    const cx = this.x + width / 2;
    const cy = this.y + height / 2;
    ctx.translate(cx, cy);
    ctx.rotate(this.rotation);
    ctx.scale(this.scaleX, this.scaleY);

    // draw image with top-left corner at (-width/2, -height/2)
    // so that rotation occurs around the center
    ctx.drawImage(this.img, -width / 2, -height / 2);

    ctx.restore();
  }

  contains(mx: number, my: number) {
    // Approx bounding box check ignoring rotation
    const { x, y, width, height } = this.getBounds();
    return mx >= x && mx <= x + width && my >= y && my <= y + height;
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
