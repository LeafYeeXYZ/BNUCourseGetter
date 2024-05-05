package main

import (
	"context"
	"fmt"
	"os"
	"github.com/playwright-community/playwright-go"
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
// 用作测试和参考
func (a *App) GetTimetable(studentID string, password string, isBusy bool) error {
	// 安装浏览器
	err := playwright.Install()
	if err != nil { return err }

	// 创建 Playwright 实例
	pw, err := playwright.Run()
	if err != nil { return err }

	// 创建浏览器实例
	browser, err := pw.Chromium.Launch(playwright.BrowserTypeLaunchOptions{
		Headless: playwright.Bool(false),
	})
	if err != nil { return err }

	// 创建页面实例
	page, err := browser.NewPage(playwright.BrowserNewPageOptions{
		Viewport: &playwright.Size{
			Width: 2160,
			Height: 1440,
		},
	})
	if err != nil { return err }

	// 跳转到登录页面
	_, err = page.Goto("https://cas.bnu.edu.cn/cas/login?service=http%3A%2F%2Fzyfw.bnu.edu.cn%2F")
	if err != nil { return err }

	// 输入学号
	err = page.Locator("#un").Fill(studentID)
	if err != nil { return err }

	// 输入密码
	err = page.Locator("#pd").Fill(password)
	if err != nil { return err }

	// 点击登录按钮
	err = page.Locator("#index_login_btn").Click()
	if err != nil { return err }

	// 如果有, 点击 "继续访问原地址"
	if isBusy {
		err = page.Locator("body > div > div.mid_container > div > div > div > div.select_login_box > div:nth-child(6) > a").Click()
		if err != nil { return err }
	}
	// 点击 "网上选课"
	err = page.Locator("li[data-code=\"JW1304\"]").Click()
	if err != nil { return err }

	// 获取 iframe
	frameName := "frmDesk"
	iframe := page.Frame(playwright.PageFrameOptions{
		Name: &frameName,
	})
	if iframe == nil { return fmt.Errorf("找不到 iframe") }

	// 点击 "我的课表"
	err = iframe.Locator("#title2135").Click()
	if err != nil { return err }

	// 等待加载
	iframe.WaitForLoadState(playwright.FrameWaitForLoadStateOptions{
		State: playwright.LoadStateNetworkidle,
	})

	// 点击 "按课表查看"
	err = iframe.Locator("#cxfs_ewb").Click()
	if err != nil { return err }

	// 点击 "检索"
	err = iframe.Locator("#btnQry").Click()
	if err != nil { return err }

	// 等待加载
	iframe.WaitForTimeout(1000)
	// 截图
	var buf []byte
	buf, err = page.Screenshot()
	if err != nil { return err }
		
	// 保存截图
	err = os.WriteFile("screenshot.png", buf, 0644)
	if err != nil { return err }

	// 关闭浏览器
	err = browser.Close()
	if err != nil { return err }

	// 关闭 Playwright 实例
	err = pw.Stop()
	if err != nil { return err }

	return nil
}
