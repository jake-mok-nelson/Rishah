# Copilot Instructions for Rishah

## Project Overview

Rishah is a cross-platform desktop drawing and whiteboarding application built with **Wails v2** (Go backend) and **tldraw** (React/TypeScript frontend). It provides an offline-first, native-performance drawing experience on Windows, macOS, and Linux.

## Tech Stack

- **Frontend**: React 18, TypeScript 5.6, Vite 6
- **Backend**: Go (Wails v2)
- **Drawing engine**: tldraw 4.3
- **UI components**: Ant Design (antd), Lucide React icons
- **File format**: `.tldr` (tldraw JSON format)

## Project Structure

```
main.go                        # Wails app entry point (window setup, menus, options)
app.go                         # Go backend methods (file I/O, dialogs, settings)
app_test.go                    # Go backend tests
go.mod / go.sum                # Go module dependencies
wails.json                     # Wails project configuration

frontend/                      # React/TypeScript frontend
├── src/
│   ├── App.tsx                # Main app component (file management, keyboard shortcuts)
│   ├── main.tsx               # React entry point
│   ├── components/tldraw/     # Custom tldraw extensions
│   │   ├── IconButton.tsx     # Lucide icon insertion tool (extends StateNode)
│   │   ├── shapeButtons.tsx   # Shape duplication with arrow connections
│   │   └── customStylePanel.tsx # Custom style panel for icon color/stroke
│   ├── utils/
│   │   └── settingsManager.ts # User preferences persistence via Go backend
│   └── assets/                # Static assets (icons, images)
├── wailsjs/                   # Auto-generated Wails JS/TS bindings
│   ├── go/main/App.{js,d.ts}  # Go method bindings for frontend
│   └── runtime/runtime.{js,d.ts} # Wails runtime (events, window, quit)
├── index.html                 # HTML entry point
├── package.json               # Frontend dependencies & scripts
├── vite.config.ts             # Vite bundler configuration
└── tsconfig.json              # TypeScript configuration
```

## Development Commands

```bash
# Install Wails CLI
go install github.com/wailsapp/wails/v2/cmd/wails@latest

# Install frontend dependencies
cd frontend && npm install && cd ..

# Run full Wails app in dev mode with hot reload
wails dev

# Build for current platform
wails build

# Frontend only (for testing)
cd frontend && npm run dev     # Start Vite dev server
cd frontend && npm run build   # TypeScript check + Vite production build

# Run Go backend tests
go test ./...
```

## Coding Conventions

### TypeScript / React

- Use **functional components** with React hooks (`useState`, `useEffect`, `useReactor`).
- Use `async/await` for asynchronous operations (file I/O, Go backend calls).
- Import Go backend methods from `../wailsjs/go/main/App` to call bound Go functions.
- Import Wails runtime from `../wailsjs/runtime/runtime` for events, window management, and app lifecycle.
- Extend tldraw via custom `StateNode` subclasses for tools, `TLComponents` for UI overrides, and `TLUiOverrides` for toolbar integration.
- Use Ant Design components (`Button`, `Modal`, `Popover`, `Input`, `Tooltip`, `ColorPicker`) for UI elements outside the tldraw canvas.
- Use Lucide React for icons.
- TypeScript strict mode is enabled with `noUnusedLocals` and `noUnusedParameters`.

### Go / Wails

- Define exported methods on the `App` struct to expose them to the frontend via Wails bindings.
- Use `github.com/wailsapp/wails/v2/pkg/runtime` for native dialogs, events, and window management.
- Store the `context.Context` from `startup()` for use in runtime calls.
- Use standard Go `os` package for file I/O operations.
- Use `encoding/json` for settings serialization.
- Application menus are defined in `main.go` using `github.com/wailsapp/wails/v2/pkg/menu` and communicate with the frontend via events.
- Frontend assets are embedded using Go's `//go:embed` directive from `frontend/dist`.

### General

- Window title is set via `SetTitle()` Go method called from the frontend.
- Settings are persisted to a JSON file in the user's config directory via Go backend methods (`LoadSettings`/`SaveSettings`), storing only values that differ from defaults.
- File save/open uses Wails native dialogs (`OpenFileDialog`/`SaveFileDialog`) and Go file I/O, not web APIs.
- The app supports opening `.tldr` files via command-line arguments.
- Native menus (File, Info) are defined in Go and emit events to the frontend via `runtime.EventsEmit`.

## Key Patterns

- **File management**: Save/Open/SaveAs/New operations use Go backend methods for native file dialogs and file reading/writing.
- **tldraw integration**: The editor instance is stored in React state and accessed throughout the component for snapshot export, content loading, and shape manipulation.
- **Custom tools**: New tldraw tools extend `StateNode` and are registered via the `tools` prop on `<Tldraw>`.
- **UI overrides**: Custom toolbar items and style panels are provided via `TLComponents` and `TLUiOverrides`.
- **Reactors**: `useReactor` from tldraw is used to watch for editor state changes (grid mode, user preferences) and auto-save them.
- **Menu events**: Native menus are created in Go (`main.go`) and communicate with the React frontend via Wails events (`EventsOn`/`EventsEmit`).

## CI/CD

The GitHub Actions workflow (`.github/workflows/main.yml`) builds cross-platform binaries on push to the release branch using `wails build`.
