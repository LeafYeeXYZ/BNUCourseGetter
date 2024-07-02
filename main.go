package main

import (
	"embed"
	"context"
	"fmt"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
	"github.com/playwright-community/playwright-go"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Create an instance of the app structure
	app := NewApp()

	// Create application with options
	err := wails.Run(&options.App{
		Title:  "小鸦抢课",
		Width:  1024,
		Height: 768,
		MinWidth: 640,
		MinHeight: 512,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 255, G: 255, B: 255, A: 0},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
		},
		Frameless: true,
		Windows: &windows.Options{
			WebviewIsTransparent: true,
			WindowIsTranslucent: true,
			BackdropType: 2,
		},
		Mac: &mac.Options{
			WebviewIsTransparent: true,
			WindowIsTranslucent: false,
		},
		Debug: options.Debug{
			OpenInspectorOnStartup: true,
		},
		SingleInstanceLock: &options.SingleInstanceLock{
			UniqueId:               "90a3e88b-4da4-ae12-924e-9fd9c0bc6300",
			OnSecondInstanceLaunch: app.onSecondInstanceLaunch,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}

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

// 第二个进程的开启回调
func (a *App) onSecondInstanceLaunch(secondInstanceData options.SecondInstanceData) {
	runtime.WindowUnminimise(a.ctx)
	runtime.Show(a.ctx)
}

// 安装浏览器
func (a *App) InstallBrowser() error {
	return playwright.Install()
}

// 对话框
func (a *App) Dialog(dialogType, message string) (string, error) {
  switch dialogType {
		case "info":
			return runtime.MessageDialog(a.ctx, runtime.MessageDialogOptions{
				Type: runtime.InfoDialog,
				Title: "提示",
				Message: message,
			})
		case "warning":
			return runtime.MessageDialog(a.ctx, runtime.MessageDialogOptions{
				Type: runtime.WarningDialog,
				Title: "警告",
				Message: message,
			})
		case "error":
			return runtime.MessageDialog(a.ctx, runtime.MessageDialogOptions{
				Type: runtime.ErrorDialog,
				Title: "错误",
				Message: message,
			})
		case "question":
			return runtime.MessageDialog(a.ctx, runtime.MessageDialogOptions{
				Type: runtime.QuestionDialog,
				Title: "提示",
				Message: message,
				Buttons: []string{"Yes", "No"},
				DefaultButton: "Yes",
				CancelButton: "No",
			})
		default:
			return "", fmt.Errorf("未知的对话框类型")
	}
}
