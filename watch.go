package main

import (
	"fmt"
	"github.com/playwright-community/playwright-go"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// 蹲课模式主函数
func (a *App) WatchCourse(speed int, studentID string, password string, courseID string, classID string, headless bool) error {
  
	runtime.EventsEmit(a.ctx, "currentStatus", "开始蹲课" + " - " + courseID + " - " + classID)

	// 安装浏览器
	err := playwright.Install()
	if err != nil { return err }

	// 创建 Playwright 实例
	pw, err := playwright.Run()
	if err != nil { return err }
	defer pw.Stop()

	// 创建浏览器实例
	browser, err := pw.Chromium.Launch(playwright.BrowserTypeLaunchOptions{
		Headless: playwright.Bool(headless),
	})
	if err != nil { return err }
	defer browser.Close()

	// 创建页面实例
	page, err := browser.NewPage()
	if err != nil { return err }
	runtime.EventsEmit(a.ctx, "currentStatus", "已打开浏览器")

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
	runtime.EventsEmit(a.ctx, "currentStatus", "已登录")

	// 如果有, 点击 "继续访问原地址"
	ele := page.Locator("body > div > div.mid_container > div > div > div > div.select_login_box > div:nth-child(6) > a")
	if exists, _ := ele.IsVisible(); exists {
		err = ele.Click()
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
	runtime.EventsEmit(a.ctx, "currentStatus", "进入选课界面")

	// 点击 "按开课计划抢课"
	err = iframe.Locator("#title1785").Click()
	if err != nil { return err }

	// 等待加载
	iframe.WaitForLoadState(playwright.FrameWaitForLoadStateOptions{
		State: playwright.LoadStateNetworkidle,
	})

	// "所有院系开设课程"
	ele = iframe.Locator("#kkdw_range_all")
	if disabled, _ := ele.IsDisabled(); disabled {
		browser.Close()
		pw.Stop()
		return fmt.Errorf("当前时间不是有效的选课时间区段")
	}


	
	return fmt.Errorf("蹲课取消")
}