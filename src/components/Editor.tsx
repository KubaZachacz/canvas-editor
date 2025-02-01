import React, { useEffect, useRef, useState } from "react";
import { CanvasEditor } from "../CanvasEditor/CanvasEditor";
import { ColorPickerPlugin, TextEditorPlugin } from "../CanvasEditor/plugins";
import { Background, Img, Logo, Text } from "./icons";

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
    };

    if (canvasSize && canvasRef.current) {
      editorRef.current = new CanvasEditor(canvasRef.current);
      addNodes();
    }
  }, [canvasSize]);

  const controls = [
    {
      icon: Text,
      label: "Text",
      onClick: () => {
        editorRef.current?.addText("", 20, 20);
      },
    },
    {
      icon: Img,
      label: "Image",
      onClick: () => {
        editorRef.current?.addImage(
          "https://picsum.photos/id/237/536/354",
          100,
          100
        );
      },
    },
    {
      icon: Background,
      label: "Background",
      onClick: () => {},
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-6">
      <div ref={wrapperRef} className="w-full">
        {canvasSize && (
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            className="bg-black-50"
          />
        )}
      </div>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-display font-bold text-black-75">
            <Logo className="inline text-display-large" /> CanvasEditor
          </h1>
        </div>
        <hr className="text-white-98" />
        <div className="bg-white-97 rounded-primary font-bold px-4 py-6">
          Add content
        </div>
        <div className="grid grid-cols-2 gap-8">
          {controls.map(({ icon: Icon, label, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className="bg-white-97 rounded-primary font-bold px-4 py-6 flex items-center flex-col gap-6 cursor-pointer"
              type="button"
            >
              <Icon className="text-black-75 text-9xl" />
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Editor;
