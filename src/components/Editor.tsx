import React, { useEffect, useRef } from "react";
import { CanvasEditor } from "../CanvasEditor/CanvasEditor";
import { ColorPickerPlugin } from "../CanvasEditor/plugins";

const CanvasComponent: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const editorRef = useRef<CanvasEditor | null>(null);

  useEffect(() => {
    const addNodes = async () => {
      if (!editorRef.current) return;

      const editor = editorRef.current;
      editor.use(new ColorPickerPlugin());

      await editor.addImage("https://picsum.photos/id/237/536/354", 100, 100);
      editor.addText("Hello, Canvas!", 20, 20);
    };

    if (canvasRef.current) {
      editorRef.current = new CanvasEditor(canvasRef.current);
      addNodes();
    }
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      style={{ border: "1px solid black" }}
    />
  );
};

export default CanvasComponent;
