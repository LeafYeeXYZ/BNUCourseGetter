package main

import (
	"fmt"
	"time"
	"github.com/playwright-community/playwright-go"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"regexp"
	"sync"
)

// 多线程蹲课的刷新时间 (单线程为此值的 2 倍)
var refreshTime = 150 * time.Second

// 蹲课模式对外接口
func (a *App) WatchCoursePub(speed int, studentID string, password string, courseID []string, classID []string, headless bool) error {
	var wg sync.WaitGroup
	var ch = make(chan error, 1)
	for {
		wg.Add(1)
		go a.watchCoursePubCore(speed, studentID, password, courseID, classID, headless, &wg, ch)
		wg.Wait()
		select {
			case err := <-ch:
				if err != nil {
					return err
				}
			default:
				continue
		}
	}
}

// 单线程蹲课模式对外接口
func (a *App) WatchCoursePubSync(speed int, studentID string, password string, courseID []string, classID []string, headless bool) error {
	var wg sync.WaitGroup
	var ch = make(chan error, 1)
	for {
		wg.Add(1)
		go a.watchCoursePubSyncCore(speed, studentID, password, courseID, classID, headless, &wg, ch)
		wg.Wait()
		select {
			case err := <-ch:
				if err != nil {
					return err
				}
			default:
				continue
		}
	}
}

// 蹲课模式主函数
func (a *App) watchCoursePubCore(speed int, studentID string, password string, courseID []string, classID []string, headless bool, wg *sync.WaitGroup, ch chan error) {
  
	runtime.EventsEmit(a.ctx, "currentStatus", "开始蹲课")

	// 最后
	defer wg.Done()

	// 错误
	var err error
	
	// 安装浏览器
	err = playwright.Install()
	if err != nil { ch <- err; return }

	// 创建 Playwright 实例
	pw, err := playwright.Run()
	if err != nil { ch <- err; return }
	defer pw.Stop()

	// 创建浏览器实例
	browser, err := pw.Chromium.Launch(playwright.BrowserTypeLaunchOptions{
		Headless: playwright.Bool(headless),
	})
	if err != nil { ch <- err; return }
	defer browser.Close()

	// 捕获错误的管道
	errCh := make(chan error, 1)

	// 为每个课程创建一个协程
	for i := 0; i < len(courseID); i++ {
		go func(speed int, studentID string, password string, courseID string, classID string) {
			// 当前元素
			var ele playwright.Locator
			// 错误
			var err error

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
			ele = page.Locator("#un")
		  err = ele.Fill(studentID)
			if err != nil { errCh <- err; return }

			// 输入密码
			ele = page.Locator("#pd")
			err = ele.Fill(password)
			if err != nil { errCh <- err; return }

			// 点击登录按钮
			ele = page.Locator("#index_login_btn")
			err = ele.Click()
			if err != nil { errCh <- err; return }

			// 等待加载
			page.WaitForLoadState(playwright.PageWaitForLoadStateOptions{
				State: playwright.LoadStateNetworkidle,
			})

			// 如果有, 点击 "继续访问原地址"
			ele = page.Locator("body > div > div.mid_container > div > div > div > div.select_login_box > div:nth-child(6) > a")
			if exists, _ := ele.IsVisible(); exists {
				err = ele.Click()
				if err != nil { errCh <- err; return }
			}

			// 点击 "网上选课"
			ele = page.Locator("li[data-code=\"JW1304\"]")
			err = ele.Click()
			if err != nil { errCh <- err; return }

			// 获取 iframe
			iframe := page.Frame(playwright.PageFrameOptions{
				Name: playwright.String("frmDesk"),
			})
			runtime.EventsEmit(a.ctx, "currentStatus", fmt.Sprintf("课程 %s 进入选课界面", courseID))

			// 点击 "抢公共选修课"
			ele = iframe.Locator("#title1803")
			err = ele.Click()
			if err != nil { errCh <- err; return }

			// 等待加载
			iframe.WaitForLoadState(playwright.FrameWaitForLoadStateOptions{
				State: playwright.LoadStateNetworkidle,
			})

			// 课程号输入框
			// 是否是选课时间
			time.Sleep(time.Duration(speed) * time.Millisecond)
			ele = iframe.Locator("#kcmc")
			if disabled, _ := ele.IsDisabled(); disabled {
				errCh <- fmt.Errorf("当前时间不是有效的选课时间区段")
				return
			}

			// 输入课程号
			err = ele.Fill(courseID)
			if err != nil { errCh <- err; return }

			// 输入班号
			ele = iframe.Locator("#t_skbh")
			err = ele.Fill(classID)
			if err != nil { errCh <- err; return }

			// 点击 "检索"
			ele = iframe.Locator("#btnQry")
			err = ele.Click()
			if err != nil { errCh <- err; return }
			
			// 等待加载
			page.WaitForLoadState(playwright.PageWaitForLoadStateOptions{
				State: playwright.LoadStateNetworkidle,
			})
			
			// 获取子 iframe
			iiframe := iframe.FrameLocator("#frmReport")

			// 点击 "选择"
			runtime.EventsEmit(a.ctx, "currentStatus", fmt.Sprintf("检索课程 %s", courseID))
			for {
				ele = iiframe.Locator("#tr0_xz a")
				if exists, _ := ele.IsVisible(); exists {
					err = ele.Click()
					if err != nil { errCh <- err; return }
					break
				} else {
					runtime.EventsEmit(a.ctx, "currentStatus", fmt.Sprintf("未找到课程 %s, 重新检索 (关闭小鸦抢课即可停止)", courseID))
					time.Sleep(time.Duration(speed) * time.Millisecond)
					// 点击 "检索"
					ele = iframe.Locator("#btnQry")
					err = ele.Click()
					if err != nil { errCh <- err; return }
					// 等待加载
					page.WaitForLoadState(playwright.PageWaitForLoadStateOptions{
						State: playwright.LoadStateNetworkidle,
					})
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
	start := time.Now()
	LOOP:
	for {
		select {
			case data := <-errCh:
				if data != nil {
					ch <- data
					return
				} else {
					count++
					if count >= len(courseID) {
						break LOOP
					}
				}
			default:
				if time.Since(start) > refreshTime {
					runtime.EventsEmit(a.ctx, "currentStatus", "为降低内存占用, 重启浏览器...")
					return
				}

		}
	}

  // 成功	
	ch <- fmt.Errorf("全部课程蹲课完成, 请手动确认结果")
}

// 单线程蹲课模式主函数
func (a *App) watchCoursePubSyncCore(speed int, studentID string, password string, courseID []string, classID []string, headless bool, wg *sync.WaitGroup, ch chan error) {
  
	runtime.EventsEmit(a.ctx, "currentStatus", "开始蹲课")

	// 最后
	defer wg.Done()

	// 当前元素
	var ele playwright.Locator
	// 错误
	var err error
	
	// 安装浏览器
	err = playwright.Install()
	if err != nil { ch <- err; return }

	// 创建 Playwright 实例
	pw, err := playwright.Run()
	if err != nil { ch <- err; return }
	defer pw.Stop()

	// 创建浏览器实例
	browser, err := pw.Chromium.Launch(playwright.BrowserTypeLaunchOptions{
		Headless: playwright.Bool(headless),
	})
	if err != nil { ch <- err; return }
	defer browser.Close()

	// 创建页面实例
	page, err := browser.NewPage()
	if err != nil { ch <- err; return }
	runtime.EventsEmit(a.ctx, "currentStatus", fmt.Sprintf("为课程 %s 等创建新页面", courseID[0]))

	// 浏览器出现 confirm 时, 点击 "确定"
	page.On("dialog", func(dialog playwright.Dialog) {
		dialog.Accept()
	})

	// 跳转到登录页面
	_, err = page.Goto("https://cas.bnu.edu.cn/cas/login?service=http%3A%2F%2Fzyfw.bnu.edu.cn%2F")
	if err != nil { ch <- err; return }

	// 输入学号
	ele = page.Locator("#un")
	err = ele.Fill(studentID)
	if err != nil { ch <- err; return }

	// 输入密码
	ele = page.Locator("#pd")
	err = ele.Fill(password)
	if err != nil { ch <- err; return }

	// 点击登录按钮
	ele = page.Locator("#index_login_btn")
	err = ele.Click()
	if err != nil { ch <- err; return }

	// 等待加载
	page.WaitForLoadState(playwright.PageWaitForLoadStateOptions{
		State: playwright.LoadStateNetworkidle,
	})

	// 如果有, 点击 "继续访问原地址"
	ele = page.Locator("body > div > div.mid_container > div > div > div > div.select_login_box > div:nth-child(6) > a")
	if exists, _ := ele.IsVisible(); exists {
		err = ele.Click()
		if err != nil { ch <- err; return }
	}

	// 点击 "网上选课"
	ele = page.Locator("li[data-code=\"JW1304\"]")
	err = ele.Click()
	if err != nil { ch <- err; return }

	// 获取 iframe
	iframe := page.Frame(playwright.PageFrameOptions{
		Name: playwright.String("frmDesk"),
	})
	runtime.EventsEmit(a.ctx, "currentStatus", fmt.Sprintf("课程 %s 等进入选课界面", courseID[0]))

	// 点击 "抢公共选修课"
	ele = iframe.Locator("#title1803")
	err = ele.Click()
	if err != nil { ch <- err; return }

	// 等待加载
	iframe.WaitForLoadState(playwright.FrameWaitForLoadStateOptions{
		State: playwright.LoadStateNetworkidle,
	})

	time.Sleep(time.Duration(speed) * time.Millisecond)
	// 课程号输入框
	ele = iframe.Locator("#kcmc")
	// 是否是选课时间
	if disabled, _ := ele.IsDisabled(); disabled {
		ch <- fmt.Errorf("当前时间不是有效的选课时间区段")
		return
	}

	index := 0
	start := time.Now()
	LOOP:
	for {
		// 等待加载
		page.WaitForLoadState(playwright.PageWaitForLoadStateOptions{
			State: playwright.LoadStateNetworkidle,
		})

		// 输入课程号
		ele = iframe.Locator("#kcmc")
		err = ele.Fill(courseID[index])
		if err != nil { ch <- err; return }

		// 输入班号
		ele = iframe.Locator("#t_skbh")
		err = ele.Fill(classID[index])
		if err != nil { ch <- err; return }

		// 点击 "检索"
		ele = iframe.Locator("#btnQry")
		err = ele.Click()
		if err != nil { ch <- err; return }
		
		// 等待加载
		page.WaitForLoadState(playwright.PageWaitForLoadStateOptions{
			State: playwright.LoadStateNetworkidle,
		})
		
		// 获取子 iframe
		iiframe := iframe.FrameLocator("#frmReport")

		// 点击 "选择"
		runtime.EventsEmit(a.ctx, "currentStatus", fmt.Sprintf("检索课程 %s", courseID[index]))
		ele = iiframe.Locator("#tr0_xz a")
		if exists, _ := ele.IsVisible(); exists {
			err = ele.Click()
			if err != nil { ch <- err; return }
			break LOOP
		} else {
			runtime.EventsEmit(a.ctx, "currentStatus", fmt.Sprintf("未找到课程 %s, 重新检索 (关闭小鸦抢课即可停止)", courseID[index]))
			time.Sleep(time.Duration(speed) * time.Millisecond)
			// 更新索引
			if index < len(courseID) - 1 {
				index++
			} else {
				index = 0
			}
			if time.Since(start) > 2 * refreshTime {
				runtime.EventsEmit(a.ctx, "currentStatus", "为降低内存占用, 重启浏览器...")
				return
			}
			continue LOOP
		}
	}
	// 等待加载
	runtime.EventsEmit(a.ctx, "currentStatus", fmt.Sprintf("成功选择课程 %s", courseID[index]))
	page.WaitForLoadState(playwright.PageWaitForLoadStateOptions{
		State: playwright.LoadStateNetworkidle,
	})
	time.Sleep(2 * time.Second)

  // 成功	
	ch <- fmt.Errorf("某个课程蹲课成功, 请手动确认结果")
}

func (a *App) WatchCourseMaj(speed int, studentID string, password string, tpcourseID []string, tpclassID []string, headless bool) error {
  
	courseID := tpcourseID[0]
	classID := tpclassID[0]
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
	
	// 等待加载
	page.WaitForLoadState(playwright.PageWaitForLoadStateOptions{
		State: playwright.LoadStateNetworkidle,
	})
	
	// 点击 "网上选课"
	runtime.EventsEmit(a.ctx, "currentStatus", "进入选课界面")
	err = page.Locator("li[data-code=\"JW1304\"]").Click()
	if err != nil { return err }

	// 等待加载
	page.WaitForLoadState(playwright.PageWaitForLoadStateOptions{
		State: playwright.LoadStateNetworkidle,
	})

	// 获取 iframe
	iframe := page.Frame(playwright.PageFrameOptions{
		Name: playwright.String("frmDesk"),
	})
	if iframe == nil { return fmt.Errorf("找不到 iframe") }

	// 点击 "按开课计划抢课"
	err = iframe.Locator("#title1785").Click()
	if err != nil { return err }

	// 等待加载
	iframe.WaitForLoadState(playwright.FrameWaitForLoadStateOptions{
		State: playwright.LoadStateNetworkidle,
	})

	// "所有院系开设课程"
	ele = iframe.Locator("#kkdw_range_all")
	// 如果没到时间, 退出
	if disabled, _ := ele.IsDisabled(); disabled {
		return fmt.Errorf("未到选课时间")
	// 如果到时间, 点击元素
	} else {
		time.Sleep(time.Duration(speed) * time.Millisecond)
		err = ele.Click()
		if err != nil { return err }
	}

	// 取消勾选 "只显示有余量的课程"
	ele = iframe.Locator("#xwxmkc")
	err = ele.Uncheck()
	if err != nil { return err }	

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
	frmReport := iframe.FrameLocator("#frmReport")

	// 点击 "选择"
	eleBtn := frmReport.Locator("#tr0_operation a")
	count := 0
	for {
		if count > 10000 { return fmt.Errorf("网络超时") }
		if exists, _ := eleBtn.IsVisible(); exists {
			err = eleBtn.Click()
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
	time.Sleep(2 * time.Second)

	// 获取子 iframe
	iiframe := page.Frame(playwright.PageFrameOptions{
		URL: regexp.MustCompile(`http://zyfw.bnu.edu.cn:80/student/report/wsxk.zx_promt.jsp/`),
	})
	iiiframe := iiframe.FrameLocator("#frmReport")

	// 输入班号
	ele = iiframe.Locator("#txt_skbjdm")
	err = ele.Fill(classID)
	if err != nil { return err }

	// 等待加载
	time.Sleep(time.Duration(speed) * time.Millisecond)

	// 如果可选人数为零, 点击返回
	ele = iiiframe.Locator("#tr0_kxrs")
	text, err := ele.InnerText()
	if err != nil { return err }
	if text == "0" {
		// 刷新页面
		page.Reload()
		runtime.EventsEmit(a.ctx, "currentStatus", "可选人数为零, 重试 (关闭小鸦抢课即可停止)")
	}

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

	return fmt.Errorf("蹲课完成, 请手动确认结果")
}

func (a *App) WatchCourseMajSync(speed int, studentID string, password string, tpcourseID []string, tpclassID []string, headless bool) error {
  
	courseID := tpcourseID[0]
	classID := tpclassID[0]
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
	
	// 等待加载
	page.WaitForLoadState(playwright.PageWaitForLoadStateOptions{
		State: playwright.LoadStateNetworkidle,
	})
	
	// 点击 "网上选课"
	runtime.EventsEmit(a.ctx, "currentStatus", "进入选课界面")
	err = page.Locator("li[data-code=\"JW1304\"]").Click()
	if err != nil { return err }

	// 等待加载
	page.WaitForLoadState(playwright.PageWaitForLoadStateOptions{
		State: playwright.LoadStateNetworkidle,
	})

	// 获取 iframe
	iframe := page.Frame(playwright.PageFrameOptions{
		Name: playwright.String("frmDesk"),
	})
	if iframe == nil { return fmt.Errorf("找不到 iframe") }

	// 点击 "按开课计划抢课"
	err = iframe.Locator("#title1785").Click()
	if err != nil { return err }

	// 等待加载
	iframe.WaitForLoadState(playwright.FrameWaitForLoadStateOptions{
		State: playwright.LoadStateNetworkidle,
	})

	// "所有院系开设课程"
	ele = iframe.Locator("#kkdw_range_all")
	// 如果没到时间, 退出
	if disabled, _ := ele.IsDisabled(); disabled {
		return fmt.Errorf("未到选课时间")
	// 如果到时间, 点击元素
	} else {
		time.Sleep(time.Duration(speed) * time.Millisecond)
		err = ele.Click()
		if err != nil { return err }
	}

	// 取消勾选 "只显示有余量的课程"
	ele = iframe.Locator("#xwxmkc")
	err = ele.Uncheck()
	if err != nil { return err }	

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
	frmReport := iframe.FrameLocator("#frmReport")

	// 点击 "选择"
	eleBtn := frmReport.Locator("#tr0_operation a")
	count := 0
	for {
		if count > 10000 { return fmt.Errorf("网络超时") }
		if exists, _ := eleBtn.IsVisible(); exists {
			err = eleBtn.Click()
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
	time.Sleep(2 * time.Second)

	// 获取子 iframe
	iiframe := page.Frame(playwright.PageFrameOptions{
		URL: regexp.MustCompile(`http://zyfw.bnu.edu.cn:80/student/report/wsxk.zx_promt.jsp/`),
	})
	iiiframe := iiframe.FrameLocator("#frmReport")

	// 输入班号
	ele = iiframe.Locator("#txt_skbjdm")
	err = ele.Fill(classID)
	if err != nil { return err }

	// 等待加载
	time.Sleep(time.Duration(speed) * time.Millisecond)

	// 如果可选人数为零, 点击返回
	ele = iiiframe.Locator("#tr0_kxrs")
	text, err := ele.InnerText()
	if err != nil { return err }
	if text == "0" {
		// 刷新页面
		page.Reload()
		runtime.EventsEmit(a.ctx, "currentStatus", "可选人数为零, 重试 (关闭小鸦抢课即可停止)")
	}

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

	return fmt.Errorf("蹲课完成, 请手动确认结果")
}