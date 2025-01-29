import React, { useEffect, useRef } from "react";
import { CanvasEditor } from "../utils/CanvasEditor";

const CanvasComponent: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  let editor: CanvasEditor | null = null;

  useEffect(() => {
    if (canvasRef.current) {
      editor = new CanvasEditor(canvasRef.current);
      editor.addText("Hello, Canvas!", 50, 50);
      editor.addImage("https://picsum.photos/id/237/536/354", 100, 100);
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
