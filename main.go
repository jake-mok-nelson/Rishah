package main

import (
	"context"
	"embed"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/menu"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Create an instance of the app structure
	app := NewApp()

	// Application Menu
	appMenu := menu.NewMenu()

	fileMenu := appMenu.AddSubmenu("File")
	fileMenu.AddText("New", nil, func(_ *menu.CallbackData) {
		wailsruntime.EventsEmit(app.ctx, "menu-new")
	})
	fileMenu.AddText("Open", nil, func(_ *menu.CallbackData) {
		wailsruntime.EventsEmit(app.ctx, "menu-open")
	})
	fileMenu.AddText("Save", nil, func(_ *menu.CallbackData) {
		wailsruntime.EventsEmit(app.ctx, "menu-save")
	})
	fileMenu.AddText("Save As", nil, func(_ *menu.CallbackData) {
		wailsruntime.EventsEmit(app.ctx, "menu-save-as")
	})
	fileMenu.AddSeparator()
	fileMenu.AddText("Export as PNG", nil, func(_ *menu.CallbackData) {
		wailsruntime.EventsEmit(app.ctx, "menu-export-as-png")
	})
	fileMenu.AddText("Export as SVG", nil, func(_ *menu.CallbackData) {
		wailsruntime.EventsEmit(app.ctx, "menu-export-as-svg")
	})

	infoMenu := appMenu.AddSubmenu("Info")
	infoMenu.AddText("About", nil, func(_ *menu.CallbackData) {
		wailsruntime.EventsEmit(app.ctx, "menu-about")
	})

	// Create application with options
	err := wails.Run(&options.App{
		Title:  "Rishah",
		Width:  800,
		Height: 600,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		OnStartup: app.startup,
		OnBeforeClose: func(_ context.Context) bool {
			return false
		},
		Menu: appMenu,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
