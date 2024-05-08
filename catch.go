package main

import (
	"fmt"
	"time"
	"github.com/playwright-community/playwright-go"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// 抢课模式主函数
func (a *App) CatchCourse(speed int, studentID string, password string, courseID string, classID string) error {

	runtime.EventsEmit(a.ctx, "currentStatus", "开始抢课" + " - " + courseID + " - " + classID)

	// 安装浏览器
	err := playwright.Install()
	if err != nil { return err }

	// 创建 Playwright 实例
	pw, err := playwright.Run()
	if err != nil { return err }
	defer pw.Stop()

	// 创建浏览器实例
	browser, err := pw.Chromium.Launch(playwright.BrowserTypeLaunchOptions{
		Headless: playwright.Bool(false),
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

	// 等待选课时间
	for {
		// "所有院系开设课程"
		ele = iframe.Locator("#kkdw_range_all")
		// 如果没到时间, 刷新
		if disabled, errR := ele.IsDisabled(); disabled {
			if errR != nil { return errR }
			runtime.EventsEmit(a.ctx, "currentStatus", "未到选课时间, 刷新页面 (手动关闭浏览器即可停止)")
			errR = page.Locator("#JW130403").Click()
			if errR != nil { return errR }
			time.Sleep(time.Duration(speed) * time.Millisecond)
			continue
		} else {
			break
		}
	}

	// 循环监控课程
	/// TO BE IMPLEMENTED

	return fmt.Errorf("抢课取消")
}