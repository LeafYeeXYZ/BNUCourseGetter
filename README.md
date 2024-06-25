# 小鸦抢课
一个使用简单, 开源安全的北师大自动抢课/蹲课程序, 支持公选课/专业课, 支持批量抢课/蹲课, 欢迎点亮 `Star` 关注本项目~

![](./README.png)

![](./EXAMPLE.png)

## 使用方法
[点击下载](https://github.com/LeafYeeXYZ/BNUCourseGetter/releases)适用于你的设备的最新版本程序, 直接运行即可 (杀毒软件可能会误报为病毒, 如不放心可自行从源码编译)

- 请提前确认各项信息填写正确
- 请确认无课程时间冲突
- 请确认剩余学分足够
- 请确保网络环境流畅 (不要去人多的地方)
- 抢课时, 请提前两三分钟开启抢课模式; **抢课模式下没有重启机制, 由于 `Playwright` 的特性, 消耗内存会逐渐增加, 提前开启太久可能会导致内存不足** (蹲课模式下浏览器会定期重启, 没有这个问题)
- 其他年级抢课开始前后, 教务系统会显示账号已锁定, 与小鸦抢课无关!
- **据传, 选课系统同时只支持约三/四/五（说法不一）个页面同时操作, 小鸦抢课会为每门课都打开一个页面 (`单线程蹲课` 模式除外), 所以如果要同时选多门课, 请自行承担风险** (但是我这边测试的时候, 排除了上面说的其他年级抢课的影响, 同时多线程蹲六门课也是正常的, 不知道到底有没有限制)
- 成功率不是百分之百, 请手动二次确认选课结果; 同时, 千万不要将本软件作为唯一的选课手段!

| 选项 | 说明 |
| :---: | :---: |
| 抢课模式 | 见下面的抢课模式说明 |
| 刷新频率 | 设太快可能会起反效果, 一般 `每秒` 即可 |
| 课程类别 | 请确认相关课程在分类里存在 |
| 学号 | 你的学号, 所有信息都保存在你的设备本地 |
| 密码 | 你的密码, 所有信息都保存在你的设备本地 |
| 课程代码 | 你要抢的课程代码, 多门课程请用空格隔开 |
| 上课班号 | 你要抢的上课班号, 多门课程请用空格隔开 |
| 记住密码 | 勾选后, 下次打开程序会自动填写密码 |
| 显示浏览器 | 勾选后, 会显示浏览器窗口, 用于调试 |
| 蹲课保护 | **仅对蹲课生效**. 勾选后, 发生任何错误都会强制重启<br>可以避免一些网络错误导致的蹲课中断 |

### 抢课模式说明
| 模式 | 开启教务页面数 | 如果系统未开启 | 如果可选人数为零 | 多个课程中一个成功 | 多个课程中一个出错 | 速度 |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| 抢课 | 每个课程一个 | 刷新 | 退出 | 继续剩余课程 | 继续剩余课程 | 快 |
| 多线程蹲课 | 每个课程一个 | 退出 | 刷新 | 继续剩余课程 | 退出 | 快 |
| 单线程蹲课 | 一个 | 退出 | 刷新 | 退出 | 退出 | 课程越多越慢 |

## 免责声明
本项目仅供学习交流使用, 开源免费. 请勿用于非法用途, 请严格遵守开源协议, 请勿滥用, 请勿使用此项目牟利 (它永远是免费的!), 请自行承担使用此项目的风险

## 打赏我
如果你觉得这个项目对你有帮助, 可以请我喝杯奶茶~

![](./WECHAT.JPG)

## 技术相关
后端基于 `Go`, 前端基于 `TypeScript`, 使用 `Wails`、`React`、`Playwright`、`AntD` 等工具或框架开发

由于没有选择直接发送请求, 而是以浏览器自动化的方式实现, 所以使用风险较小, 但是效率也会低一些

二进制文件仅在 `Windows` 下测试过, 其他平台如果有问题请提交 `Issue` 或 `Pull Request`

#### MacOS 使用方法
由于 `Github Action` 构建时出错, 所以请自行编译, 流程如下:

1. 安装 `Go`、`Node.js`
2. 执行 `npm install -g bun` 安装 `bun`
3. 执行 `go install github.com/wailsapp/wails/cmd/wails@latest` 安装 `Wails`
4. 克隆本项目
5. 在项目目录下执行 `wails build` 编译
6. 在 `build/bin` 目录下找到编译好的二进制文件, 执行即可