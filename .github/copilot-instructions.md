# Copilot Instructions for Rishah

## Project Overview

Rishah is a cross-platform desktop drawing and whiteboarding application built with **Tauri 2** (Rust backend) and **tldraw** (React/TypeScript frontend). It provides an offline-first, native-performance drawing experience on Windows, macOS, and Linux.

## Tech Stack

- **Frontend**: React 18, TypeScript 5.6, Vite 6
- **Backend**: Rust (Tauri 2)
- **Drawing engine**: tldraw 4.3
- **UI components**: Ant Design (antd), Lucide React icons
- **File format**: `.tldr` (tldraw JSON format)
- **Tauri plugins**: dialog, fs, store, opener, deep-link

## Project Structure

```
src/                          # React/TypeScript frontend
├── App.tsx                   # Main app component (file management, menus, keyboard shortcuts)
├── main.tsx                  # React entry point
├── components/tldraw/        # Custom tldraw extensions
│   ├── IconButton.tsx        # Lucide icon insertion tool (extends StateNode)
│   ├── shapeButtons.tsx      # Shape duplication with arrow connections
│   └── customStylePanel.tsx  # Custom style panel for icon color/stroke
├── utils/
│   └── settingsManager.ts    # User preferences persistence via Tauri plugin-store
└── assets/                   # Static assets (icons, images)

src-tauri/                    # Rust/Tauri backend
├── src/
│   ├── main.rs               # Window setup entry point
│   └── lib.rs                # Tauri commands (file I/O, startup file handling)
├── Cargo.toml                # Rust dependencies
├── tauri.conf.json            # App configuration, file associations, bundle settings
├── capabilities/              # Tauri security capabilities
└── icons/                     # App icons
```

## Development Commands

```bash
npm install          # Install frontend dependencies
npm run dev          # Start Vite dev server on port 1420
npm run build        # TypeScript check + Vite production build
npm run tauri dev    # Run full Tauri app in dev mode with hot reload
npm run tauri build  # Build for current platform
```

## Coding Conventions

### TypeScript / React

- Use **functional components** with React hooks (`useState`, `useEffect`, `useReactor`).
- Use `async/await` for asynchronous operations (file I/O, Tauri commands).
- Use Tauri plugin APIs for native features: `@tauri-apps/plugin-dialog` for file dialogs, `@tauri-apps/plugin-fs` for file operations, `@tauri-apps/plugin-store` for settings persistence.
- Use `invoke` from `@tauri-apps/api/core` to call Rust backend commands.
- Extend tldraw via custom `StateNode` subclasses for tools, `TLComponents` for UI overrides, and `TLUiOverrides` for toolbar integration.
- Use Ant Design components (`Button`, `Modal`, `Popover`, `Input`, `Tooltip`, `ColorPicker`) for UI elements outside the tldraw canvas.
- Use Lucide React for icons.
- TypeScript strict mode is enabled with `noUnusedLocals` and `noUnusedParameters`.

### Rust / Tauri

- Define IPC commands with the `#[tauri::command]` attribute macro.
- Register commands in the Tauri builder via `invoke_handler(tauri::generate_handler![...])`.
- Register plugins via `.plugin(...)` on the Tauri builder.
- Use `Result<T, String>` for error handling in commands.
- Use `serde` for serialization/deserialization.

### General

- The app uses `getCurrentWindow()` from `@tauri-apps/api/window` for window lifecycle management (close handling, title updates).
- Settings are persisted to `rishah-settings.json` via Tauri plugin-store, storing only values that differ from defaults.
- File save/open uses Tauri dialog and fs plugins, not web APIs.
- The app supports opening `.tldr` files via command-line arguments and deep linking.

## Key Patterns

- **File management**: Save/Open/SaveAs/New operations use Tauri dialog plugin for native file dialogs and plugin-fs for reading/writing files.
- **tldraw integration**: The editor instance is stored in React state and accessed throughout the component for snapshot export, content loading, and shape manipulation.
- **Custom tools**: New tldraw tools extend `StateNode` and are registered via the `tools` prop on `<Tldraw>`.
- **UI overrides**: Custom toolbar items and style panels are provided via `TLComponents` and `TLUiOverrides`.
- **Reactors**: `useReactor` from tldraw is used to watch for editor state changes (grid mode, user preferences) and auto-save them.

## CI/CD

The GitHub Actions workflow (`.github/workflows/main.yml`) builds cross-platform installers (MSI, DMG, AppImage, DEB) on push to the release branch.
