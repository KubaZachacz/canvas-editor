import React, { useEffect, useRef, useState } from "react";
import { CanvasEditor } from "../CanvasEditor/CanvasEditor";
import { ColorPickerPlugin, TextEditorPlugin } from "../CanvasEditor/plugins";
import { Background, Img, Logo, Reset, Text } from "./icons";
import ImgLoadButton from "./ImgLoadButton";

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

  const imgControls = [
    {
      icon: Img,
      label: "Image",
      onLoad: (src: string) => {
        editorRef.current?.addImage(src, 100, 100);
      },
    },
    {
      icon: Background,
      label: "Background",
      onLoad: (src: string) => {
        editorRef.current?.setBackgroundImage(src);
      },
    },
  ];

  const onAddText = () => {
    editorRef.current?.addText("Hello, world!", 20, 20);
  };

  return (
    <div className="grid grid-cols-2 gap-6 my-16">
      <div ref={wrapperRef} className="w-full">
        {canvasSize && (
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            className="bg-black-50 select-none"
          />
        )}
      </div>
      <div className="h-full flex flex-col">
        <div className="space-y-8 flex-1">
          <div className="flex justify-between items-center">
            <h1 className="text-display font-bold text-black-75">
              <Logo className="inline text-display-large" /> CanvasEditor
            </h1>
            <button
              className="text-red border-b border-red cursor-pointer"
              onClick={() => editorRef.current?.reset()}
            >
              Reset
              <Reset className="inline text-display ml-2" />
            </button>
          </div>
          <hr className="text-white-98" />
          <div className="bg-white-97 rounded-primary font-bold px-4 py-6">
            Add content
          </div>
          <div className="grid grid-cols-2 gap-8">
            <button
              onClick={onAddText}
              className="bg-white-97 rounded-primary font-bold px-4 py-6 flex items-center flex-col gap-6 cursor-pointer"
            >
              <Text className="text-black-75 text-9xl" />
              <span className="font-medium">Text</span>
            </button>
            {imgControls.map(({ icon: Icon, label, onLoad }) => (
              <ImgLoadButton
                key={label}
                onLoad={onLoad}
                className="bg-white-97 rounded-primary font-bold px-4 py-6 flex items-center flex-col gap-6 cursor-pointer"
              >
                <Icon className="text-black-75 text-9xl" />
                <span className="font-medium">{label}</span>
              </ImgLoadButton>
            ))}
          </div>
        </div>
        <div>
          <hr className="text-white-98 my-8" />
          <button
            className="block ml-auto"
            onClick={() => {
              editorRef.current?.downloadImage();
            }}
          >
            Export to PNG
          </button>
        </div>
      </div>
    </div>
  );
};

export default Editor;
