package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello, %s! You've been greeted from Go!", name)
}

// GetStartupFileContent reads a .tldr file passed as a command-line argument
func (a *App) GetStartupFileContent() ([]string, error) {
	rawArgs := os.Args[1:]

	if len(rawArgs) == 0 {
		return nil, nil
	}

	// Process all arguments to handle potential comma-separated values
	var processedArgs []string
	for _, arg := range rawArgs {
		splitArgs := strings.Split(arg, ",")
		for _, splitArg := range splitArgs {
			if splitArg != "" {
				processedArgs = append(processedArgs, splitArg)
			}
		}
	}

	// Filter for .tldr files and normalize paths
	var tldrFiles []string
	for _, arg := range processedArgs {
		lower := strings.ToLower(arg)
		if strings.HasSuffix(lower, ".tldr") || strings.HasSuffix(lower, ".tldr\\") {
			cleanPath := strings.TrimRight(arg, "\\")
			if filepath.IsAbs(cleanPath) {
				tldrFiles = append(tldrFiles, cleanPath)
			} else {
				cwd, err := os.Getwd()
				if err == nil {
					absPath := filepath.Join(cwd, cleanPath)
					tldrFiles = append(tldrFiles, absPath)
				} else {
					tldrFiles = append(tldrFiles, cleanPath)
				}
			}
		}
	}

	// Get the first .tldr file and read its content
	if len(tldrFiles) > 0 {
		content, err := os.ReadFile(tldrFiles[0])
		if err != nil {
			return nil, fmt.Errorf("failed to read file %s: %w", tldrFiles[0], err)
		}
		return []string{tldrFiles[0], string(content)}, nil
	}

	return nil, nil
}

// OpenFileDialog opens a native file dialog to select a .tldr file
func (a *App) OpenFileDialog() (string, error) {
	selection, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Open Drawing",
		Filters: []runtime.FileFilter{
			{DisplayName: "TLDraw Files (*.tldr)", Pattern: "*.tldr"},
		},
	})
	return selection, err
}

// SaveFileDialog opens a native file dialog to choose where to save a file
func (a *App) SaveFileDialog(defaultFilename string) (string, error) {
	selection, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Save Drawing",
		DefaultFilename: defaultFilename,
		Filters: []runtime.FileFilter{
			{DisplayName: "TLDraw Files (*.tldr)", Pattern: "*.tldr"},
		},
	})
	return selection, err
}

// ReadFile reads a file and returns its content as a string
func (a *App) ReadFile(path string) (string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return "", fmt.Errorf("failed to read file: %w", err)
	}
	return string(data), nil
}

// WriteFile writes string content to a file
func (a *App) WriteFile(path string, content string) error {
	return os.WriteFile(path, []byte(content), 0644)
}

// WriteFileBase64 decodes base64-encoded data and writes it to a file
func (a *App) WriteFileBase64(path string, base64Data string) error {
	data, err := base64.StdEncoding.DecodeString(base64Data)
	if err != nil {
		return fmt.Errorf("failed to decode base64 data: %w", err)
	}
	return os.WriteFile(path, data, 0644)
}

// SaveFileDialogForExport opens a native save dialog with format-specific filters for image export
func (a *App) SaveFileDialogForExport(defaultFilename string, format string) (string, error) {
	var filter runtime.FileFilter
	switch format {
	case "png":
		filter = runtime.FileFilter{DisplayName: "PNG Image (*.png)", Pattern: "*.png"}
	case "svg":
		filter = runtime.FileFilter{DisplayName: "SVG Image (*.svg)", Pattern: "*.svg"}
	case "jpeg":
		filter = runtime.FileFilter{DisplayName: "JPEG Image (*.jpeg)", Pattern: "*.jpeg;*.jpg"}
	case "webp":
		filter = runtime.FileFilter{DisplayName: "WebP Image (*.webp)", Pattern: "*.webp"}
	case "json":
		filter = runtime.FileFilter{DisplayName: "JSON File (*.json)", Pattern: "*.json"}
	default:
		filter = runtime.FileFilter{DisplayName: "All Files", Pattern: "*.*"}
	}

	selection, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Export Drawing",
		DefaultFilename: defaultFilename,
		Filters:         []runtime.FileFilter{filter},
	})
	return selection, err
}

// AskDialog shows a confirmation dialog and returns the user's choice
func (a *App) AskDialog(title string, message string) (bool, error) {
	selection, err := runtime.MessageDialog(a.ctx, runtime.MessageDialogOptions{
		Type:          runtime.WarningDialog,
		Title:         title,
		Message:       message,
		Buttons:       []string{"Yes", "No"},
		DefaultButton: "Yes",
		CancelButton:  "No",
	})
	if err != nil {
		return false, err
	}
	return selection == "Yes", nil
}

// InfoDialog shows an informational dialog
func (a *App) InfoDialog(title string, message string) error {
	_, err := runtime.MessageDialog(a.ctx, runtime.MessageDialogOptions{
		Type:    runtime.InfoDialog,
		Title:   title,
		Message: message,
	})
	return err
}

// SetTitle sets the window title
func (a *App) SetTitle(title string) {
	runtime.WindowSetTitle(a.ctx, title)
}

// Quit closes the application
func (a *App) Quit() {
	runtime.Quit(a.ctx)
}

// Settings management

func (a *App) getSettingsPath() (string, error) {
	configDir, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	settingsDir := filepath.Join(configDir, "rishah")
	if err := os.MkdirAll(settingsDir, 0755); err != nil {
		return "", err
	}
	return filepath.Join(settingsDir, "rishah-settings.json"), nil
}

// LoadSettings loads settings from the config file
func (a *App) LoadSettings() (string, error) {
	path, err := a.getSettingsPath()
	if err != nil {
		return "{}", nil
	}
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return "{}", nil
		}
		return "{}", nil
	}
	return string(data), nil
}

// SelectDirectoryDialog opens a native directory selection dialog
func (a *App) SelectDirectoryDialog() (string, error) {
	selection, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select Output Directory",
	})
	return selection, err
}

// GenerateImageWithAI runs the copilot-sdk script to generate styled versions of a diagram image.
// It accepts a base64-encoded PNG image and an output style ("all", "mermaid", "description", "svg").
// Returns a JSON string with the result.
func (a *App) GenerateImageWithAI(base64Image string, outputStyle string) (string, error) {
	// Decode image to a temp file
	imgData, err := base64.StdEncoding.DecodeString(base64Image)
	if err != nil {
		return "", fmt.Errorf("failed to decode image data: %w", err)
	}

	tmpDir, err := os.MkdirTemp("", "rishah-ai-*")
	if err != nil {
		return "", fmt.Errorf("failed to create temp directory: %w", err)
	}
	defer os.RemoveAll(tmpDir)

	inputPath := filepath.Join(tmpDir, "input.png")
	if err := os.WriteFile(inputPath, imgData, 0600); err != nil {
		return "", fmt.Errorf("failed to write temp image: %w", err)
	}

	outputDir := filepath.Join(tmpDir, "output")
	if err := os.MkdirAll(outputDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create output directory: %w", err)
	}

	// Find the copilot script directory relative to the executable
	execPath, err := os.Executable()
	if err != nil {
		return "", fmt.Errorf("failed to get executable path: %w", err)
	}
	copilotDir := filepath.Join(filepath.Dir(execPath), "copilot")

	// Fall back to source directory layout if bundled copilot dir doesn't exist
	if _, err := os.Stat(copilotDir); os.IsNotExist(err) {
		// Try relative to working directory (development mode)
		cwd, _ := os.Getwd()
		copilotDir = filepath.Join(cwd, "copilot")
	}

	scriptPath := filepath.Join(copilotDir, "generate.ts")
	if _, err := os.Stat(scriptPath); os.IsNotExist(err) {
		return "", fmt.Errorf("copilot generate script not found at %s - ensure the copilot directory is set up", scriptPath)
	}

	// Run the copilot generation script
	cmd := exec.Command("npx", "tsx", scriptPath, inputPath, outputDir, outputStyle)
	cmd.Dir = copilotDir
	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("copilot generation failed: %w", err)
	}

	// Parse the last line of output as JSON result
	lines := strings.Split(strings.TrimSpace(string(output)), "\n")
	if len(lines) == 0 {
		return "", fmt.Errorf("no output from copilot generation script")
	}

	return lines[len(lines)-1], nil
}

// SaveSettings saves settings to the config file
func (a *App) SaveSettings(settingsJSON string) error {
	// Validate JSON
	var js json.RawMessage
	if err := json.Unmarshal([]byte(settingsJSON), &js); err != nil {
		return fmt.Errorf("invalid JSON: %w", err)
	}

	path, err := a.getSettingsPath()
	if err != nil {
		return err
	}
	return os.WriteFile(path, []byte(settingsJSON), 0644)
}
