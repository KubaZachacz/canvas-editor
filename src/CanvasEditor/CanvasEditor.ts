import { Node, TextNode, ImageNode } from "./nodes";
import { ICanvasEditorPlugin } from "./plugins/CanvasEditorPlugin";

interface CanvasEditorOptions {
  placeholderImage: string;
}
export class CanvasEditor {
  canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  nodes: Node[] = [];
  activeNode: Node | null = null;
  private plugins: ICanvasEditorPlugin[] = [];

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

  private backgroundImage: HTMLImageElement | null = null;
  private placeholderImage: HTMLImageElement | null = null;
  private showPlaceholder = false;

  constructor(canvas: HTMLCanvasElement, options?: CanvasEditorOptions) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.initEvents();
    this.render();

    if (options?.placeholderImage) {
      this.showPlaceholder = true;
      this.setPlaceholderImage(options.placeholderImage);
    }
  }

  /**
   * Public method to register a plugin. This plugin can add its own
   * canvas listeners in init() if desired.
   */
  public use(plugin: ICanvasEditorPlugin) {
    this.plugins.push(plugin);
    plugin.init?.(this);
  }

  /**
   * Optional: if you want to remove a plugin at runtime.
   */
  public removePlugin(plugin: ICanvasEditorPlugin) {
    const idx = this.plugins.indexOf(plugin);
    if (idx !== -1) {
      this.plugins.splice(idx, 1);
      plugin.destroy?.();
    }
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

  addNode(node: Node) {
    this.nodes.push(node);
    this.plugins.forEach((p) => p.onAddNode?.(node, this));

    this.showPlaceholder = false;

    this.render();
  }

  addText(text: string, x: number, y: number) {
    this.addNode(new TextNode(text, x, y));
  }

  async addImage(src: string, x: number, y: number) {
    const img = new Image();
    img.src = src;
    await new Promise<void>((resolve) => {
      img.onload = () => {
        this.addNode(new ImageNode(img, x, y));
        resolve();
      };
    });
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
  }

  private onMouseUp() {
    this.dragging = false;
    this.activeHandle = null;
  }

  private onDoubleClick() {}

  private onKeyDown() {}

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    // Draw background image first
    this.drawBackgroundImage(
      this.showPlaceholder ? this.placeholderImage : this.backgroundImage
    );

    this.nodes.forEach((node) => node.draw(this.ctx));

    // Call plugin's onRender
    this.plugins.forEach((p) => p.onRender?.(this.ctx, this));

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

  /**
   * Load and set a background image
   */
  setBackgroundImage(imageSrc: string) {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      this.backgroundImage = img;
      this.showPlaceholder = false;
      this.render(); // Re-render canvas after setting background
    };
  }

  /**
   * Load and set a background image
   */
  setPlaceholderImage(imageSrc: string) {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      this.placeholderImage = img;
      this.showPlaceholder = true;
      this.render(); // Re-render canvas after setting background
    };
  }

  /**
   * Draws the background image with 'object-fit: cover' effect
   */
  private drawBackgroundImage(img: HTMLImageElement | null) {
    if (!img) return;

    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;
    const imgRatio = img.width / img.height;
    const canvasRatio = canvasWidth / canvasHeight;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (imgRatio > canvasRatio) {
      // Image is wider than canvas
      drawWidth = canvasHeight * imgRatio;
      drawHeight = canvasHeight;
      offsetX = (canvasWidth - drawWidth) / 2;
      offsetY = 0;
    } else {
      // Image is taller than canvas
      drawWidth = canvasWidth;
      drawHeight = canvasWidth / imgRatio;
      offsetX = 0;
      offsetY = (canvasHeight - drawHeight) / 2;
    }

    this.ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  }

  reset() {
    this.nodes = [];
    this.activeNode = null;
    this.backgroundImage = null;
    this.showPlaceholder = this.placeholderImage !== null;
    this.render();
  }

  exportImage(format: "png" | "jpeg" = "png", quality?: number): string {
    this.activeNode = null; // Don't show transformer in the exported image
    this.render();
    return this.canvas.toDataURL(`image/${format}`, quality);
  }

  downloadImage(
    filename: string = "canvas.png",
    format: "png" | "jpeg" = "png",
    quality?: number
  ) {
    const dataUrl = this.exportImage(format, quality);
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  onResize() {
    this.render();
  }
}

/**
 * Type of handle.
 */
type HandleType = "translate" | "delete" | "rotate" | "resize";
