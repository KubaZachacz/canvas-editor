import { fireEvent, render, screen, act } from "@testing-library/react";
import Editor from "./Editor";

interface MockCanvasEditor {
  addText: jest.Mock;
  addImage: jest.Mock;
  setBackgroundImage: jest.Mock;
  downloadImage: jest.Mock;
  reset: jest.Mock;
  onResize: jest.Mock;
  use: jest.Mock;
}

// Mock CanvasEditor instance
jest.mock("../CanvasEditor/CanvasEditor", () => {
  const mockCanvasEditorInstance: MockCanvasEditor = {
    addText: jest.fn(),
    addImage: jest.fn(),
    setBackgroundImage: jest.fn(),
    downloadImage: jest.fn(),
    reset: jest.fn(),
    onResize: jest.fn(),
    use: jest.fn(),
  };
  return { CanvasEditor: jest.fn(() => mockCanvasEditorInstance) };
});

let mockCanvasEditorInstance: MockCanvasEditor;

describe("Editor Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCanvasEditorInstance =
      require("../CanvasEditor/CanvasEditor").CanvasEditor();

    // Mock canvas size
    jest.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      width: 500,
      height: 400,
      top: 0,
      left: 0,
      right: 500,
      bottom: 400,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("renders canvas element", () => {
    render(<Editor />);
    expect(screen.getByTestId("canvas")).toBeInTheDocument();
  });

  test("adds text when text button is clicked", async () => {
    render(<Editor />);
    fireEvent.click(screen.getByText("Text"));
    expect(mockCanvasEditorInstance.addText).toHaveBeenCalledWith("");
  });

  const mockFileUpload = async (
    buttonText: string,
    method: keyof MockCanvasEditor
  ) => {
    render(<Editor />);
    const file = new File(["dummy content"], "test-image.png", {
      type: "image/png",
    });

    const fileReaderMock: Partial<FileReader> = {
      readAsDataURL: jest.fn(),
      result: "data:image/png;base64,fakebase64data",
      onloadend: jest.fn(),
    };

    jest
      .spyOn(global, "FileReader")
      .mockImplementation(() => fileReaderMock as FileReader);
    fireEvent.click(screen.getByText(buttonText));

    const input = screen.getByTestId(
      `file-input-for-${buttonText}`
    ) as HTMLInputElement;
    expect(input).toBeInTheDocument();

    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
      fileReaderMock.readAsDataURL?.(file);
      (fileReaderMock.onloadend as jest.Mock)?.();
    });

    expect(mockCanvasEditorInstance[method]).toHaveBeenCalledWith(
      "data:image/png;base64,fakebase64data"
    );
  };

  test("calls addImage when Image button is clicked", async () => {
    await mockFileUpload("Image", "addImage");
  });

  test("calls setBackgroundImage when Background button is clicked", async () => {
    await mockFileUpload("Background", "setBackgroundImage");
  });

  test("calls downloadImage when Export to PNG button is clicked", () => {
    render(<Editor />);
    fireEvent.click(screen.getByText("Export to PNG"));
    expect(mockCanvasEditorInstance.downloadImage).toHaveBeenCalled();
  });

  test("calls reset when Reset button is confirmed", () => {
    render(<Editor />);
    fireEvent.click(screen.getByText("Reset"));
    fireEvent.click(screen.getByTestId("reset-confirm"));
    expect(mockCanvasEditorInstance.reset).toHaveBeenCalled();
  });
});
