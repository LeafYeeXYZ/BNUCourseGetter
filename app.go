package main

import (
	"context"
	"fmt"
	"github.com/playwright-community/playwright-go"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"github.com/wailsapp/wails/v2/pkg/options"
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
			})
		default:
			return "", fmt.Errorf("未知的对话框类型")
	}
}
