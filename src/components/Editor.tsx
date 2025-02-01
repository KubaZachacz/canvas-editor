import React, { useEffect, useRef, useState } from "react";
import { CanvasEditor } from "../CanvasEditor/CanvasEditor";
import { ColorPickerPlugin, TextEditorPlugin } from "../CanvasEditor/plugins";

const Editor: React.FC = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const editorRef = useRef<CanvasEditor | null>(null);
  const [canvasSize, setCanvasSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    const setSize = () => {
      if (wrapperRef.current) {
        const ratio = 5 / 4;
        const { width } = wrapperRef.current.getBoundingClientRect();
        setCanvasSize({ width, height: width * ratio });
      }
    };

    setSize();

    window.addEventListener("resize", setSize);
    return () => window.removeEventListener("resize", setSize);
  }, []);

  useEffect(() => {
    const addNodes = async () => {
      if (!editorRef.current) return;

      const editor = editorRef.current;
      editor.use(new ColorPickerPlugin());
      editor.use(new TextEditorPlugin());

      // await editor.addImage("https://picsum.photos/id/237/536/354", 100, 100);
      editor.addText("", 20, 20);
    };

    if (canvasSize && canvasRef.current) {
      editorRef.current = new CanvasEditor(canvasRef.current);
      addNodes();
    }
  }, [canvasSize]);

  return (
    <div ref={wrapperRef} className="w-full">
      {canvasSize && (
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          style={{ border: "1px solid black" }}
        />
      )}
    </div>
  );
};

export default Editor;
