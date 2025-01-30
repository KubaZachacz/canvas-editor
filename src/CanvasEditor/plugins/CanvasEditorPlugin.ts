import { CanvasEditor } from "../CanvasEditor";

export interface ICanvasEditorPlugin {
  /**
   * Called once when plugin is registered
   */
  init?(editor: CanvasEditor): void;

  /**
   * Called once when plugin is unregistered
   */
  destroy?(): void;

  /**
   * Called on every render loop from the editor
   */
  onRender?(ctx: CanvasRenderingContext2D, editor: CanvasEditor): void;

  /**
   * Called from editor's mouseDown handler.
   */
  onMouseDown?(event: MouseEvent, editor: CanvasEditor): void;

  /**
   * Called from editor's mouseMove handler.
   */
  onMouseMove?(event: MouseEvent, editor: CanvasEditor): void;

  /**
   * Called from editor's mouseUp handler.
   */
  onMouseUp?(event: MouseEvent, editor: CanvasEditor): void;
}
