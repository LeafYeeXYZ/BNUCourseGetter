package main

import (
	"fmt"
	"time"
	"github.com/playwright-community/playwright-go"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// 蹲课模式主函数
func (a *App) WatchCoursePub(speed int, studentID string, password string, courseID string, classID string, headless bool) error {
  
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

	// 浏览器出现 confirm 时, 点击 "确定"
  page.On("dialog", func(dialog playwright.Dialog) {
    dialog.Accept()
	})

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

	// 等待加载
	page.WaitForLoadState(playwright.PageWaitForLoadStateOptions{
		State: playwright.LoadStateNetworkidle,
	})

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

	// 点击 "抢公共选修课"
	err = iframe.Locator("#title1803").Click()
	if err != nil { return err }

	// 等待加载
	iframe.WaitForLoadState(playwright.FrameWaitForLoadStateOptions{
		State: playwright.LoadStateNetworkidle,
	})

	// 课程号输入框
	ele = iframe.Locator("#kcmc")
	time.Sleep(time.Duration(speed) * time.Millisecond)
	// 是否是选课时间
	if disabled, _ := ele.IsDisabled(); disabled {
		return fmt.Errorf("当前时间不是有效的选课时间区段")
	}

	// 输入课程号
	err = ele.Fill(courseID)
	if err != nil { return err }

	// 输入班号
	err = iframe.Locator("#t_skbh").Fill(classID)
	if err != nil { return err }

	// 点击 "检索"
	err = iframe.Locator("#btnQry").Click()
	if err != nil { return err }
  
  // 等待加载
	page.WaitForLoadState(playwright.PageWaitForLoadStateOptions{
		State: playwright.LoadStateNetworkidle,
	})
	
	// 获取子 iframe
	iiframe := iframe.FrameLocator("#frmReport")

	// 点击 "选择"
	runtime.EventsEmit(a.ctx, "currentStatus", "检索课程")
	ele = iiframe.Locator("#tr0_xz a")
	for {
		if exists, _ := ele.IsVisible(); exists {
			err = ele.Click()
			if err != nil { return err }
			break
		} else {
			runtime.EventsEmit(a.ctx, "currentStatus", "未找到可选课程, 重新检索 (关闭小鸦抢课即可停止)")
			time.Sleep(time.Duration(speed) * time.Millisecond)
			// 点击 "检索"
			err = iframe.Locator("#btnQry").Click()
			if err != nil { return err }
			// 等待加载
			page.WaitForLoadState(playwright.PageWaitForLoadStateOptions{
				State: playwright.LoadStateNetworkidle,
			})
		}
	}

	// 等待加载
	page.WaitForLoadState(playwright.PageWaitForLoadStateOptions{
		State: playwright.LoadStateNetworkidle,
	})
	time.Sleep(2 * time.Second)

  // 成功	
	return fmt.Errorf("蹲课完成, 请手动确认结果")
}

func (a *App) WatchCourseMaj(speed int, studentID string, password string, courseID string, classID string, headless bool) error {
  
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
		return fmt.Errorf("当前时间不是有效的选课时间区段")
	}


	// 等待加载
	page.WaitForLoadState(playwright.PageWaitForLoadStateOptions{
		State: playwright.LoadStateNetworkidle,
	})
	time.Sleep(2 * time.Second)
	
	return fmt.Errorf("蹲课取消")
}