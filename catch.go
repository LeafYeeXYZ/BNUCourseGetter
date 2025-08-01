package main

import (
	"fmt"
	"time"

	"github.com/playwright-community/playwright-go"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// 抢课模式主函数
func (a *App) CatchCoursePub(
	speed int, 
	studentID string, 
	password string, 
	courseID []string, 
	classID []string, 
	headless bool,
	useWebVpn bool,
) error {

	runtime.EventsEmit(a.ctx, "currentStatus", "开始抢课")

	// 错误
	var err error

	// 安装浏览器
	err = playwright.Install()
	if err != nil { return err }

	// 创建 Playwright 实例
	pw, err := playwright.Run()
	if err != nil { return err }
	defer pw.Stop()

	// 创建浏览器实例
	browser, err := pw.Chromium.Launch(playwright.BrowserTypeLaunchOptions{
		Headless: playwright.Bool(headless),
		SlowMo: playwright.Float(30),
	})
	if err != nil { return err }
	defer browser.Close()

	// 捕获错误的管道
	errCh := make(chan error, 1)

	// 为每个课程创建一个协程
	for i := range courseID {
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
				runtime.EventsEmit(a.ctx, "currentStatus", fmt.Sprintf("课程 %s 页面出现 %s 弹窗: %s", courseID, dialog.Type(), dialog.Message()))
				runtime.EventsEmit(a.ctx, "currentStatus", fmt.Sprintf("已自动确认弹窗, 请手动确认课程 %s 选课结果", courseID))
				runtime.EventsEmit(a.ctx, "importantStatus", fmt.Sprintf("课程 %s 页面出现 %s 弹窗: %s", courseID, dialog.Type(), dialog.Message()))
				runtime.EventsEmit(a.ctx, "importantStatus", fmt.Sprintf("已自动确认弹窗, 请手动确认课程 %s 选课结果", courseID))
				dialog.Accept()
			})

			// 跳转到登录页面
			if useWebVpn {
				_, err = page.Goto("https://one.bnu.edu.cn/dcp/forward.action?path=/portal/portal&p=home")
				if err != nil { errCh <- err; return }
			} else {
				_, err = page.Goto("https://cas.bnu.edu.cn/cas/login?service=http%3A%2F%2Fzyfw.bnu.edu.cn%2F")
				if err != nil { errCh <- err; return }
			}

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

			// 如果是 Web VPN 模式, 则点击 "教务管理系统"
			if (useWebVpn) {
				// 监听新页面的创建
				var newPage playwright.Page
				page.Context().On("page", func(p playwright.Page) {
					newPage = p
				})
				// 点击 "教务管理系统"
				page.Evaluate(`() => {
					const items = document.querySelectorAll('.ml_item_name')
					for (const item of items) {
						if (item.textContent?.includes('教务管理系统')) {
							item.parentElement?.click()
							break
						}
					}
				}`)
				// 等待加载
				page.WaitForLoadState(playwright.PageWaitForLoadStateOptions{
					State: playwright.LoadStateNetworkidle,
				})
				// 等待新页面创建
				time.Sleep(1 * time.Second)
				// 使用新页面
				if newPage == nil {
					errCh <- fmt.Errorf("未能成功打开教务管理系统页面")
					return
				}
				page = newPage
				page.WaitForLoadState(playwright.PageWaitForLoadStateOptions{
					State: playwright.LoadStateNetworkidle,
				})
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

			// 等待选课时间
			for {
				// 课程代码输入框
				ele = iframe.Locator("#kcmc")
				// 如果没到时间, 刷新
				if disabled, _ := ele.IsDisabled(); disabled {
					runtime.EventsEmit(a.ctx, "currentStatus", fmt.Sprintf("未到选课时间, 刷新课程 %s 页面 (关闭小鸦抢课即可停止)", courseID))
				  ele = page.Locator("#JW130415")
					err = ele.Click()
					if err != nil { errCh <- err; return }
					// 等待加载
					time.Sleep(time.Duration(speed) * time.Millisecond)
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
			ele = iiframe.Locator("#tr0_xz a")
			count := 0
			for {
				if count > 15000 { 
					runtime.EventsEmit(a.ctx, "currentStatus", fmt.Sprintf("课程 %s 网络超时或可选人数为零", courseID))
					// runtime.EventsEmit(a.ctx, "importantStatus", fmt.Sprintf("课程 %s 网络超时或可选人数为零", courseID)) 在错误处理时发出
					errCh <- fmt.Errorf("课程 %s 网络超时或可选人数为零", courseID)
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
			runtime.EventsEmit(a.ctx, "importantStatus", fmt.Sprintf("成功选择课程 %s", courseID))
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
			runtime.EventsEmit(a.ctx, "currentStatus", data.Error())
			runtime.EventsEmit(a.ctx, "importantStatus", data.Error())
			runtime.EventsEmit(a.ctx, "currentStatus", "部分课程抢课失败, 继续抢课中...")
		}
		count++
		if count == len(courseID) {
			break
		}
	}

	// 成功
	runtime.EventsEmit(a.ctx, "currentStatus", "抢课完成, 请手动确认结果")
	return nil
}

func (a *App) CatchCourseMaj(
	speed int, 
	studentID string, 
	password string, 
	courseID []string, 
	classID []string, 
	headless bool,
	useWebVpn bool,
) error {

	runtime.EventsEmit(a.ctx, "currentStatus", "开始抢课")

	// 错误
	var err error

	// 安装浏览器
	err = playwright.Install()
	if err != nil { return err }

	// 创建 Playwright 实例
	pw, err := playwright.Run()
	if err != nil { return err }
	defer pw.Stop()

	// 创建浏览器实例
	browser, err := pw.Chromium.Launch(playwright.BrowserTypeLaunchOptions{
		Headless: playwright.Bool(headless),
		SlowMo: playwright.Float(30),
	})
	if err != nil { return err }
	defer browser.Close()

	// 捕获错误的管道
	errCh := make(chan error, 1)

	// 为每个课程创建一个协程
	for i := range courseID {
		go func(speed int, studentID string, password string, courseID string, classID string) {
			// 当前元素
			var ele playwright.Locator
			// 错误
			var err error

			// 创建页面实例
			page, err := browser.NewPage()
			if err != nil { errCh <- err; return }
			runtime.EventsEmit(a.ctx, "currentStatus", fmt.Sprintf("为课程 %s 创建新页面", courseID))

			// 专业课特殊处理
			page.On("dialog", func(dialog playwright.Dialog) {
				runtime.EventsEmit(a.ctx, "currentStatus", fmt.Sprintf("课程 %s 页面出现 %s 弹窗: %s", courseID, dialog.Type(), dialog.Message()))
				runtime.EventsEmit(a.ctx, "currentStatus", fmt.Sprintf("已自动确认弹窗, 请手动确认课程 %s 选课结果", courseID))
				runtime.EventsEmit(a.ctx, "importantStatus", fmt.Sprintf("课程 %s 页面出现 %s 弹窗: %s", courseID, dialog.Type(), dialog.Message()))
				runtime.EventsEmit(a.ctx, "importantStatus", fmt.Sprintf("已自动确认弹窗, 请手动确认课程 %s 选课结果", courseID))
				dialog.Accept()
			})

			// 跳转到登录页面
			if useWebVpn {
				_, err = page.Goto("https://one.bnu.edu.cn/dcp/forward.action?path=/portal/portal&p=home")
				if err != nil { errCh <- err; return }
			} else {
				_, err = page.Goto("https://cas.bnu.edu.cn/cas/login?service=http%3A%2F%2Fzyfw.bnu.edu.cn%2F")
				if err != nil { errCh <- err; return }
			}

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

			// 如果是 Web VPN 模式, 则点击 "教务管理系统"
			if (useWebVpn) {
				// 监听新页面的创建
				var newPage playwright.Page
				page.Context().On("page", func(p playwright.Page) {
					newPage = p
				})
				// 点击 "教务管理系统"
				page.Evaluate(`() => {
					const items = document.querySelectorAll('.ml_item_name')
					for (const item of items) {
						if (item.textContent?.includes('教务管理系统')) {
							item.parentElement?.click()
							break
						}
					}
				}`)
				// 等待加载
				page.WaitForLoadState(playwright.PageWaitForLoadStateOptions{
					State: playwright.LoadStateNetworkidle,
				})
				// 等待新页面创建
				time.Sleep(1 * time.Second)
				// 使用新页面
				if newPage == nil {
					errCh <- fmt.Errorf("未能成功打开教务管理系统页面")
					return
				}
				page = newPage
				page.WaitForLoadState(playwright.PageWaitForLoadStateOptions{
					State: playwright.LoadStateNetworkidle,
				})
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

			// 点击 "按开课计划抢课"
			ele = iframe.Locator("#title1785")
			err = ele.Click()
			if err != nil { errCh <- err; return }

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
					runtime.EventsEmit(a.ctx, "currentStatus", fmt.Sprintf("未到选课时间, 刷新课程 %s 页面 (关闭小鸦抢课即可停止)", courseID))
					ele = page.Locator("#JW130403")
					err = ele.Click()
					if err != nil { errCh <- err; return }
					// 等待加载
					time.Sleep(time.Duration(speed) * time.Millisecond)
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
					if err != nil { errCh <- err; return }
					break
				}
			}

			// 输入课程号
			ele = iframe.Locator("#kcmc")
			err = ele.Fill(courseID)
			if err != nil { errCh <- err; return }

			// 点击 "检索"
			ele = iframe.Locator("#btnQry")
			err = ele.Click()
			if err != nil { errCh <- err; return }

			// 等待加载
			iframe.WaitForLoadState(playwright.FrameWaitForLoadStateOptions{
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
				if count > 15000 { 
					runtime.EventsEmit(a.ctx, "currentStatus", fmt.Sprintf("课程 %s 网络超时或可选人数为零", courseID))
					// runtime.EventsEmit(a.ctx, "importantStatus", fmt.Sprintf("课程 %s 网络超时或可选人数为零", courseID)) 在错误处理时发出
					errCh <- fmt.Errorf("课程 %s 网络超时或可选人数为零", courseID)
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
			page.WaitForLoadState(playwright.PageWaitForLoadStateOptions{
				State: playwright.LoadStateNetworkidle,
			})

			// 获取子 iframe
			iiframe := page.Frames()[2]
			iiiframe := iiframe.FrameLocator("#frmReport")

			// ------ 2024.12.25 ------
			// 不再通过输入班号来检索课程, 而是直接依次检索 DOM
			// ------------------------

			// 等待加载
			iiframe.WaitForLoadState(playwright.FrameWaitForLoadStateOptions{
				State: playwright.LoadStateNetworkidle,
			})
			
			// 检索课程
			eleIndex := 0
			count = 0
			for {
				// 班号
				ele = iiiframe.Locator(fmt.Sprintf("#tr%d_curent_skbjdm", eleIndex))
				if exists, _ := ele.IsVisible(); exists {
					// 如果不是给定的班号, 则继续检索
					if text, _ := ele.InnerText(); text != classID {
						eleIndex++
						continue
					}
					// 如果是给定的班号, 则检查是否可选人数为 0
					ele = iiiframe.Locator(fmt.Sprintf("#tr%d_kxrs", eleIndex))
					if text, _ := ele.InnerText(); text == "0" {
						runtime.EventsEmit(a.ctx, "currentStatus", fmt.Sprintf("课程 %s 可选人数为零", courseID))
						errCh <- fmt.Errorf("课程 %s 可选人数为零", courseID)
						return
					} else {
						// 勾选
						ele = iiiframe.Locator(fmt.Sprintf("#tr%d_ischk input", eleIndex))
						err = ele.Click()
						if err != nil { errCh <- err; return }
						break
					}
				} else {
					runtime.EventsEmit(a.ctx, "currentStatus", fmt.Sprintf("等待检索课程 %s 结果...", courseID))
					time.Sleep(time.Duration(speed) * time.Millisecond)
					count += speed
					if count > 15000 { 
						runtime.EventsEmit(a.ctx, "currentStatus", fmt.Sprintf("课程 %s 网络超时", courseID))
						errCh <- fmt.Errorf("课程 %s 网络超时", courseID)
						return
					}
				}
			}

			// // 输入班号
			// ele = iiframe.Locator("#txt_skbjdm")
			// err = ele.Fill(classID)
			// if err != nil { errCh <- err; return }

			// // 点击 "检索"
			// ele = iiframe.Locator("#btnQry")
			// err = ele.Click()
			// if err != nil { errCh <- err; return }

			// // 等待加载
			// iiframe.WaitForLoadState(playwright.FrameWaitForLoadStateOptions{
			// 	State: playwright.LoadStateNetworkidle,
			// })
			// time.Sleep(time.Duration(speed) * time.Millisecond)

			// // 可选人数
			// ele = iiiframe.Locator("#tr0_kxrs")
			// count = 0
			// for {
			// 	if count > 15000 { 
			// 		runtime.EventsEmit(a.ctx, "currentStatus", fmt.Sprintf("课程 %s 网络超时或可选人数为零", courseID))
			// 		// runtime.EventsEmit(a.ctx, "importantStatus", fmt.Sprintf("课程 %s 网络超时或可选人数为零", courseID)) 在错误处理时发出
			// 		errCh <- fmt.Errorf("课程 %s 网络超时或可选人数为零", courseID)
			// 		return
			// 	}
			// 	if exists, _ := ele.IsVisible(); exists {
			// 		// 检查是否可选人数为 0
			// 		if text, _ := ele.InnerText(); text == "0" {
			// 			runtime.EventsEmit(a.ctx, "currentStatus", fmt.Sprintf("课程 %s 可选人数为零", courseID))
			// 			// runtime.EventsEmit(a.ctx, "importantStatus", fmt.Sprintf("课程 %s 可选人数为零", courseID)) 在错误处理时发出
			// 			errCh <- fmt.Errorf("课程 %s 可选人数为零", courseID)
			// 			return
			// 		} else {
			// 		  // 勾选
			// 			ele = iiiframe.Locator("#tr0_ischk input")
			// 			err = ele.Click()
			// 			if err != nil { errCh <- err; return }
			// 			break
			// 		}
			// 	} else {
			// 		runtime.EventsEmit(a.ctx, "currentStatus", fmt.Sprintf("等待检索课程 %s 结果...", courseID))
			// 		time.Sleep(time.Duration(speed) * time.Millisecond)
			// 		count += speed
			// 	}
			// }

			// 点击 "确定"
			ele = iiframe.Locator("#btnSubmit")
			err = ele.Click()
			if err != nil { errCh <- err; return }

			// 等待加载
			runtime.EventsEmit(a.ctx, "currentStatus", fmt.Sprintf("成功选择课程 %s", courseID))
			runtime.EventsEmit(a.ctx, "importantStatus", fmt.Sprintf("成功选择课程 %s", courseID))
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
			runtime.EventsEmit(a.ctx, "currentStatus", data.Error())
			runtime.EventsEmit(a.ctx, "importantStatus", data.Error())
			runtime.EventsEmit(a.ctx, "currentStatus", "部分课程抢课失败, 继续抢课中...")
		}
		count++
		if count == len(courseID) {
			break
		}
	}

	// 成功
	runtime.EventsEmit(a.ctx, "currentStatus", "抢课完成, 请手动确认结果")
	return nil
}