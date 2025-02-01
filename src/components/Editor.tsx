import React, { useEffect, useRef, useState } from "react";
import { CanvasEditor } from "../CanvasEditor/CanvasEditor";
import { ColorPickerPlugin, TextEditorPlugin } from "../CanvasEditor/plugins";
import { Background, Img, Logo, Reset, Text } from "./icons";
import ImgLoadButton from "./ImgLoadButton";
import { Button, ActionButton } from "@/components/ui";
import WarningModal from "./WarningModal";

const Editor: React.FC = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const editorRef = useRef<CanvasEditor | null>(null);
  const [canvasSize, setCanvasSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    const setSize = () => {
      if (wrapperRef.current) {
        const ratio = 5 / 4;
        const { width } = wrapperRef.current.getBoundingClientRect();
        const height = width * ratio;

        setCanvasSize({ width, height });
      }
    };

    setSize();

    window.addEventListener("resize", setSize);
    return () => window.removeEventListener("resize", setSize);
  }, []);

  useEffect(() => {
    if (canvasRef.current && !editorRef.current) {
      const editor = new CanvasEditor(canvasRef.current, {
        placeholderImage: "/images/placeholder.jpg",
      });
      editorRef.current = editor;

      editor.use(new ColorPickerPlugin());
      editor.use(new TextEditorPlugin());
    }

    if (canvasSize) {
      editorRef.current?.onResize();
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
    editorRef.current?.addText("", 20, 20);
  };

  return (
    <>
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
                onClick={() => setIsWarning(true)}
              >
                Reset
                <Reset className="inline text-display ml-2" />
              </button>
            </div>
            <hr className="text-white-98 border-t-2" />
            <div className="bg-white-97 rounded-large font-bold px-4 py-6">
              Add content
            </div>
            <div className="grid grid-cols-2 gap-8">
              <ActionButton onClick={onAddText} icon={Text}>
                Text
              </ActionButton>
              {imgControls.map(({ icon: Icon, label, onLoad }) => (
                <ImgLoadButton
                  key={label}
                  onLoaded={onLoad}
                  icon={Icon}
                  className="bg-white-97 rounded-large font-bold px-4 py-6 flex items-center flex-col gap-6 cursor-pointer"
                >
                  {label}
                </ImgLoadButton>
              ))}
            </div>
          </div>
          <div>
            <hr className="text-white-98 my-8 border-t-2" />
            <Button
              className="block ml-auto"
              onClick={() => {
                editorRef.current?.downloadImage();
              }}
            >
              Export to PNG
            </Button>
          </div>
        </div>
      </div>
      <WarningModal
        isOpen={isWarning}
        onClose={() => setIsWarning(false)}
        onConfirm={() => editorRef.current?.reset()}
      />
    </>
  );
};

export default Editor;
