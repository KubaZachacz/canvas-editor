import React, { useEffect, useRef } from "react";
import { CanvasEditor } from "../utils/CanvasEditor";

const CanvasComponent: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const editorRef = useRef<CanvasEditor | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      editorRef.current = new CanvasEditor(canvasRef.current);
      const editor = editorRef.current;
      editor.addText("Hello, Canvas!", 20, 20);
      // editor.addImage("https://picsum.photos/id/237/536/354", 0, 0);
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
