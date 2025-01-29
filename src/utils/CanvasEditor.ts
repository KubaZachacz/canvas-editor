export class CanvasEditor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private nodes: Node[] = [];
  private activeNode: Node | null = null;
  private dragging: boolean = false;
  private dragStart = { x: 0, y: 0 };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.initEvents();
    this.render();
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
    this.activeNode =
      this.nodes.find((node) => node.contains(offsetX, offsetY)) || null;
    if (this.activeNode) {
      this.dragging = true;
      this.dragStart = { x: offsetX, y: offsetY };
    }
    this.render();
  }

  private onMouseMove(event: MouseEvent) {
    if (!this.dragging || !this.activeNode) return;
    const dx = event.offsetX - this.dragStart.x;
    const dy = event.offsetY - this.dragStart.y;
    this.activeNode.move(dx, dy);
    this.dragStart = { x: event.offsetX, y: event.offsetY };
    this.render();
  }

  private onMouseUp() {
    this.dragging = false;
  }

  private render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.nodes.forEach((node) => node.draw(this.ctx));
    if (this.activeNode) this.drawTransformer(this.activeNode);
  }

  private drawTransformer(node: Node) {
    const { x, y, width, height } = node.getBounds();
    this.ctx.strokeStyle = "purple";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, width, height);
  }
}

abstract class Node {
  constructor(protected x: number, protected y: number) {}
  abstract draw(ctx: CanvasRenderingContext2D): void;
  abstract contains(x: number, y: number): boolean;
  move(dx: number, dy: number) {
    this.x += dx;
    this.y += dy;
  }
  abstract getBounds(): { x: number; y: number; width: number; height: number };
}

class TextNode extends Node {
  constructor(private text: string, x: number, y: number) {
    super(x, y);
  }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "black";
    ctx.fillText(this.text, this.x, this.y);
  }
  contains(x: number, y: number) {
    return x >= this.x && x <= this.x + 100 && y >= this.y - 20 && y <= this.y;
  }
  getBounds() {
    return { x: this.x, y: this.y - 20, width: 100, height: 20 };
  }
}

class ImageNode extends Node {
  constructor(private img: HTMLImageElement, x: number, y: number) {
    super(x, y);
  }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.drawImage(this.img, this.x, this.y);
  }
  contains(x: number, y: number) {
    return (
      x >= this.x &&
      x <= this.x + this.img.width &&
      y >= this.y &&
      y <= this.y + this.img.height
    );
  }
  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.img.width,
      height: this.img.height,
    };
  }
}
