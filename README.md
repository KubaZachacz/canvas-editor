# CanvasEditor

CanvasEditor is a simple canvas editor built with React, TypeScript, and Vite. This project provides a minimal setup to get started with a canvas editor that supports adding text and images, along with plugins for extended functionality.

## Core Libraries

- **React**: A JavaScript library for building user interfaces.
- **TypeScript**: A strongly typed programming language that builds on JavaScript.
- **Vite**: A fast build tool and development server.
- **Tailwind CSS**: A utility-first CSS framework for rapid UI development.
- **Framer Motion**: A library for animations and gestures in React.
- **Jest**: A delightful JavaScript testing framework with a focus on simplicity.

## Project Structure

The project is organized into several key directories:

- **src**: Contains the main source code for the project.

  - **CanvasEditor**: Core functionality of the canvas editor, including the `CanvasEditor` class and node management.
  - **components**: Reusable React components used throughout the application.
  - **plugins**: Plugins to extend the functionality of the canvas editor.
  - **utils**: Utility functions and helpers.
  - **icons**: SVG icons used in the application.
  - **ui**: UI components and styles.

This structure helps in maintaining a clean and organized codebase, making it easier to navigate and extend.

## CanvasEditor Class

The `CanvasEditor` class, located in [`src/CanvasEditor/CanvasEditor.ts`](src/CanvasEditor/CanvasEditor.ts), is the core of the canvas editor. It provides methods to add and manipulate nodes (text and images) on the canvas. The class also supports plugins to extend its functionality.

### Key Features

- **Add Text and Images**: Easily add text and images to the canvas.
- **Plugins**: Extend functionality with plugins like `ColorPickerPlugin` and `TextEditorPlugin`.
- **Export and Download**: Export the canvas content as an image and download it.

## Scripts

The following scripts are available in the project:

- **Development**: Start the development server. `npm run dev`

- **Build**: Build the project for production. `npm run build`

- **Lint**: Run ESLint to check for code quality issues. `npm run lint`

- **Preview**: Preview the production build. `npm run preview`

- **Test**: Run tests using Jest. `npm run test`

- **SVGR**: Convert SVG files to React components. `npm run svgr`

## Getting Started

1. **Install dependencies**: `npm install `

2. **Start the development server**: `npm run dev `

3. **Open your browser** and navigate to `http://localhost:3000`.

## Demo

[Try it out](https://canvas-editor-a8757.web.app/)

## License

This project is licensed under the MIT License.
