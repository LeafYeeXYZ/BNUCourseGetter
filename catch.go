package main

import (
	"fmt"
	"time"
	"github.com/playwright-community/playwright-go"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// 抢课模式主函数
func (a *App) CatchCoursePub(speed int, studentID string, password string, courseID []string, classID []string, headless bool) error {

	runtime.EventsEmit(a.ctx, "currentStatus", "开始抢课")

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

	// 捕获错误的管道
	errCh := make(chan error, 1)

	// 为每个课程创建一个协程
	for i := 0; i < len(courseID); i++ {
		go func(speed int, studentID string, password string, courseID string, classID string) {

		// 创建页面实例
		page, err := browser.NewPage()
		if err != nil { errCh <- err; return }
		runtime.EventsEmit(a.ctx, "currentStatus", fmt.Sprintf("为课程 %s 创建新页面", courseID))

		// 浏览器出现 confirm 时, 点击 "确定"
		page.On("dialog", func(dialog playwright.Dialog) {
			dialog.Accept()
		})

		// 跳转到登录页面
		_, err = page.Goto("https://cas.bnu.edu.cn/cas/login?service=http%3A%2F%2Fzyfw.bnu.edu.cn%2F")
		if err != nil { errCh <- err; return }

		// 输入学号
		err = page.Locator("#un").Fill(studentID)
		if err != nil { errCh <- err; return }

		// 输入密码
		err = page.Locator("#pd").Fill(password)
		if err != nil { errCh <- err; return }

		// 点击登录按钮
		err = page.Locator("#index_login_btn").Click()
		if err != nil { errCh <- err; return }

		// 等待加载
		page.WaitForLoadState(playwright.PageWaitForLoadStateOptions{
			State: playwright.LoadStateNetworkidle,
		})

		// 如果有, 点击 "继续访问原地址"
		ele := page.Locator("body > div > div.mid_container > div > div > div > div.select_login_box > div:nth-child(6) > a")
		if exists, _ := ele.IsVisible(); exists {
			err = ele.Click()
			if err != nil { errCh <- err; return }
		}

		// 点击 "网上选课"
		err = page.Locator("li[data-code=\"JW1304\"]").Click()
		if err != nil { errCh <- err; return }

		// 获取 iframe
		iframe := page.Frame(playwright.PageFrameOptions{
			Name: playwright.String("frmDesk"),
		})
		runtime.EventsEmit(a.ctx, "currentStatus", fmt.Sprintf("课程 %s 进入选课界面", courseID))

		// 点击 "抢公共选修课"
		err = iframe.Locator("#title1803").Click()
		if err != nil { errCh <- err; return }

		// 等待加载
		iframe.WaitForLoadState(playwright.FrameWaitForLoadStateOptions{
			State: playwright.LoadStateNetworkidle,
		})

		// 等待选课时间
		for {
			// 课程代码输入框
			ele = iframe.Locator("#kcmc")
			// 如果没到时间, 刷新
			if disabled, _ := ele.IsDisabled(); disabled {
				runtime.EventsEmit(a.ctx, "currentStatus", fmt.Sprintf("未到选课时间, 刷新课程 %s 页面 (关闭小鸦抢课即可停止)", courseID))
				page.Locator("#JW130415").Click()
				// 等待加载
				page.WaitForLoadState(playwright.PageWaitForLoadStateOptions{
					State: playwright.LoadStateNetworkidle,
				})
				continue
			// 如果到时间, 输入课程号
			} else {
				time.Sleep(time.Duration(speed) * time.Millisecond)
				if disabled, _ := ele.IsDisabled(); disabled {
					continue
				}
				err = ele.Fill(courseID)
				if err != nil { errCh <- err; return }
				break
			}
		}
		// 输入班号
		err = iframe.Locator("#t_skbh").Fill(classID)
		if err != nil { errCh <- err; return }

		// 点击 "检索"
		err = iframe.Locator("#btnQry").Click()
		if err != nil { errCh <- err; return }
		
		// 等待加载
		page.WaitForLoadState(playwright.PageWaitForLoadStateOptions{
			State: playwright.LoadStateNetworkidle,
		})
		
		// 获取子 iframe
		iiframe := iframe.FrameLocator("#frmReport")

		// 点击 "选择"
		runtime.EventsEmit(a.ctx, "currentStatus", fmt.Sprintf("检索课程 %s", courseID))
		ele = iiframe.Locator("#tr0_xz a")
		count := 0
		for {
			if count > 10000 { 
				runtime.EventsEmit(a.ctx, "currentStatus", fmt.Sprintf("课程 %s 网路超时或可选人数为零", courseID))
				errCh <- fmt.Errorf("课程 %s 网路超时或可选人数为零", courseID)
				return
			}
			if exists, _ := ele.IsVisible(); exists {
				err = ele.Click()
				if err != nil { errCh <- err; return }
				break
			} else {
				runtime.EventsEmit(a.ctx, "currentStatus", fmt.Sprintf("等待检索课程 %s 结果...", courseID))
				time.Sleep(time.Duration(speed) * time.Millisecond)
				count += speed
			}
		}

			// 等待加载
			runtime.EventsEmit(a.ctx, "currentStatus", fmt.Sprintf("成功选择课程 %s", courseID))
			page.WaitForLoadState(playwright.PageWaitForLoadStateOptions{
				State: playwright.LoadStateNetworkidle,
			})
			time.Sleep(2 * time.Second)

			// 成功
			errCh <- nil

		}(speed, studentID, password, courseID[i], classID[i])
	}

	// 捕获错误
	count := 0
	for {
		data := <-errCh
		if data != nil {
			runtime.EventsEmit(a.ctx, "currentStatus", "部分课程抢课失败, 继续抢课中...")
		}
		count++
		if count == len(courseID) {
			break
		}
	}

	// 成功
	return fmt.Errorf("抢课完成, 请手动确认结果")
}

func (a *App) CatchCourseMaj(speed int, studentID string, password string, tpcourseID []string, tpclassID []string, headless bool) error {

	courseID := tpcourseID[0]
	classID := tpclassID[0]
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
		if disabled, _ := ele.IsDisabled(); disabled {
			runtime.EventsEmit(a.ctx, "currentStatus", "未到选课时间, 刷新页面 (关闭小鸦抢课即可停止)")
			page.Locator("#JW130403").Click()
			page.WaitForLoadState(playwright.PageWaitForLoadStateOptions{
				State: playwright.LoadStateNetworkidle,
			})
			continue
		// 如果到时间, 点击元素
		} else {
			time.Sleep(time.Duration(speed) * time.Millisecond)
			if disabled, _ := ele.IsDisabled(); disabled {
				continue
			}
			err = ele.Click()
			if err != nil { return err }
			break
		}
	}

	// 输入课程号
	err = iframe.Locator("#kcmc").Fill(courseID)
	if err != nil { return err }

	// 点击 "检索"
	runtime.EventsEmit(a.ctx, "currentStatus", "检索课程")
	err = iframe.Locator("#btnQry").Click()
	if err != nil { return err }

	// 等待加载
	page.WaitForLoadState(playwright.PageWaitForLoadStateOptions{
		State: playwright.LoadStateNetworkidle,
	})

	// 获取子 iframe
	iiiiframe := page.Frame(playwright.PageFrameOptions{
		Name: playwright.String("frmReport"),
	})

	// 点击 "选择"
	ele = iiiiframe.Locator("#tr0_operation a")
	count := 0
	for {
		if count > 10000 { return fmt.Errorf("网络超时或可选人数为零") }
		if exists, _ := ele.IsVisible(); exists {
			err = ele.Click()
			if err != nil { return err }
			break
		} else {
			runtime.EventsEmit(a.ctx, "currentStatus", "等待检索课程结果...")
			time.Sleep(time.Duration(speed) * time.Millisecond)
			count += speed
		}
	}

	// 等待加载
	page.WaitForLoadState(playwright.PageWaitForLoadStateOptions{
		State: playwright.LoadStateNetworkidle,
	})

	// 获取子 iframe
	iiframe := page.Frames()[2]
	iiiframe := iiframe.FrameLocator("#frmReport")

	// 输入班号
	ele = iiframe.Locator("#txt_skbjdm")
	err = ele.Fill(classID)
	if err != nil { return err }

	// 等待加载
	time.Sleep(time.Duration(speed) * time.Millisecond)

	// 勾选 radio
	ele = iiiframe.Locator("#tr0_ischk input")
	err = ele.Click()
	if err != nil { return err }

	// 点击 "确定"
	ele = iiframe.Locator("#btnSubmit")
	err = ele.Click()
	if err != nil { return err }

	// 等待加载
	page.WaitForLoadState(playwright.PageWaitForLoadStateOptions{
		State: playwright.LoadStateNetworkidle,
	})
	time.Sleep(2 * time.Second)

	return fmt.Errorf("抢课完成, 请手动确认结果")
}