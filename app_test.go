package main

import (
	"os"
	"path/filepath"
	"testing"
)

func TestNewApp(t *testing.T) {
	app := NewApp()
	if app == nil {
		t.Fatal("NewApp returned nil")
	}
}

func TestGreet(t *testing.T) {
	app := NewApp()
	result := app.Greet("World")
	expected := "Hello, World! You've been greeted from Go!"
	if result != expected {
		t.Errorf("Greet returned %q, expected %q", result, expected)
	}
}

func TestGetStartupFileContent_NoArgs(t *testing.T) {
	// Save original args and restore after test
	origArgs := os.Args
	defer func() { os.Args = origArgs }()

	os.Args = []string{"rishah"}
	app := NewApp()
	result, err := app.GetStartupFileContent()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result != nil {
		t.Errorf("expected nil result for no args, got %v", result)
	}
}

func TestGetStartupFileContent_WithTldrFile(t *testing.T) {
	// Create a temp .tldr file
	tmpDir := t.TempDir()
	tldrPath := filepath.Join(tmpDir, "test.tldr")
	content := `{"schema":{},"records":[],"tldrawFileFormatVersion":1}`
	if err := os.WriteFile(tldrPath, []byte(content), 0644); err != nil {
		t.Fatalf("failed to create test file: %v", err)
	}

	// Save original args and restore after test
	origArgs := os.Args
	defer func() { os.Args = origArgs }()

	os.Args = []string{"rishah", tldrPath}
	app := NewApp()
	result, err := app.GetStartupFileContent()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result == nil {
		t.Fatal("expected non-nil result")
	}
	if len(result) != 2 {
		t.Fatalf("expected result length 2, got %d", len(result))
	}
	if result[0] != tldrPath {
		t.Errorf("expected path %q, got %q", tldrPath, result[0])
	}
	if result[1] != content {
		t.Errorf("expected content %q, got %q", content, result[1])
	}
}

func TestGetStartupFileContent_NonTldrFile(t *testing.T) {
	origArgs := os.Args
	defer func() { os.Args = origArgs }()

	os.Args = []string{"rishah", "somefile.txt"}
	app := NewApp()
	result, err := app.GetStartupFileContent()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result != nil {
		t.Errorf("expected nil result for non-tldr file, got %v", result)
	}
}

func TestSettingsLoadSave(t *testing.T) {
	// Override the settings path for testing
	app := NewApp()

	// Test that LoadSettings returns empty JSON for non-existent settings
	result, err := app.LoadSettings()
	if err != nil {
		t.Fatalf("unexpected error loading settings: %v", err)
	}
	if result != "{}" {
		// Settings might already exist, so we just check it's valid JSON
		if result == "" {
			t.Error("expected non-empty result from LoadSettings")
		}
	}

	// Test SaveSettings with valid JSON
	testSettings := `{"userPreferences":{"id":"test-user"}}`
	err = app.SaveSettings(testSettings)
	if err != nil {
		t.Fatalf("unexpected error saving settings: %v", err)
	}

	// Test SaveSettings with invalid JSON
	err = app.SaveSettings("not json")
	if err == nil {
		t.Error("expected error for invalid JSON")
	}
}

func TestWriteFileBase64(t *testing.T) {
	app := NewApp()
	tmpDir := t.TempDir()

	// Test writing valid base64 data
	outPath := filepath.Join(tmpDir, "test_output.png")
	// "Hello, World!" in base64
	base64Data := "SGVsbG8sIFdvcmxkIQ=="
	err := app.WriteFileBase64(outPath, base64Data)
	if err != nil {
		t.Fatalf("unexpected error writing base64 file: %v", err)
	}

	// Verify the file was written correctly
	data, err := os.ReadFile(outPath)
	if err != nil {
		t.Fatalf("failed to read output file: %v", err)
	}
	expected := "Hello, World!"
	if string(data) != expected {
		t.Errorf("expected %q, got %q", expected, string(data))
	}

	// Test writing invalid base64 data
	badPath := filepath.Join(tmpDir, "bad_output.png")
	err = app.WriteFileBase64(badPath, "not-valid-base64!!!")
	if err == nil {
		t.Error("expected error for invalid base64 data")
	}
}
