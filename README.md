# Rishah

A powerful desktop drawing and whiteboarding application built with Wails and tldraw. This cross-platform app brings the intuitive tldraw sketching experience to your desktop with native performance and offline capabilities.

![Screenshot](./screenshots/1.png)

## Download and Installation
Visit the [Releases](https://github.com/devjaw/Rishah/releases) page
Download the latest version for your platform:

* **Windows**: rishah-windows-x64.exe
* **macOS**: rishah-macos-universal
* **Linux**: rishah-linux-x64

Install or run the downloaded file


## Features

* **Intuitive Drawing Interface**: Leverage the full power of tldraw's intuitive drawing tools
* **Offline Access**: Create and edit drawings without an internet connection
* **Native Performance**: Enjoy smooth, responsive drawing with native desktop performance
* **Cross-Platform**: Available for Windows, macOS, and Linux
* **File Management**: Save, export, and manage your drawing files locally
* **Custom Shapes and Tools**: Access the complete tldraw toolkit with additional desktop-specific features
* **Keyboard Shortcuts**: Boost your productivity with custom keyboard shortcuts


## Minimum Requirements

Windows: 10 (1903+) | macOS: 10.15+ | Linux: Ubuntu 18.04+
RAM: 4 GB (8 GB recommended)
Storage: 500 MB available space
Graphics: DirectX 11 / Metal / OpenGL 3.3 compatible

## Development

Go 1.21+ | Node.js 16+ | Wails CLI v2

### Setup

```bash
# Install Wails CLI
go install github.com/wailsapp/wails/v2/cmd/wails@latest

# Install frontend dependencies
cd frontend && npm install && cd ..

# Run in development mode
wails dev

# Build for production
wails build
```

### Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the Apache 2.0 License - see the LICENSE file for details.

## Acknowledgments

* [tldraw](https://tldraw.com/) - The amazing drawing library that powers this application
* [Wails](https://wails.io/) - For making it possible to build lightweight desktop applications with Go