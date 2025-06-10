import { driver } from 'driver.js'

export function tutorial() {
  const d = driver({
    showProgress: true,
    doneBtnText: '完成',
    nextBtnText: '下一步',
    prevBtnText: '上一步',
    progressText: '{{current}} / {{total}}',
    steps: [
      { 
        element: undefined,
        popover: { title: '使用教程', description: '欢迎使用小鸦抢课, 这个简单的教程将帮助您快速理解如何使用本软件' },
      },
      {
        element: '#version',
        popover: { title: '版本信息', description: '这里显示了当前软件的版本号, 请记得使用最新版本哦' },
      },
      {
        element: '#status',
        popover: { title: '当前状态', description: '这里显示了当前软件的状态, 如空闲、抢课中、蹲课中等' },
      },
      {
        element: '#help-button',
        popover: { title: '帮助按钮', description: '点击这个按钮可以再次查看本教程' },
      },
      {
        element: '#always-on-top-button',
        popover: { title: '置顶按钮', description: '点击这个按钮可以将软件窗口置顶' },
      },
      {
        element: '#refresh-button',
        popover: { title: '刷新按钮', description: '点击这个按钮可以刷新软件, 刷新会重置日志, 但不会中断抢课' },
      },
      {
        element: '#minimise-button',
        popover: { title: '最小化按钮', description: '点击这个按钮可以将软件窗口最小化' },
      },
      {
        element: '#maximise-button',
        popover: { title: '最大化按钮', description: '点击这个按钮可以将软件窗口最大化, 也可以通过双击标题栏实现相同功能' },
      },
      {
        element: '#quit-button',
        popover: { title: '关闭按钮', description: '点击这个按钮可以关闭软件, 并中断所有正在执行的抢课、蹲课任务' },
      },
      {
        element: '#github',
        popover: { title: 'Github', description: '点击这里会打开小鸦抢课的 GitHub 页面, 用于发布软件的最新版本' },
      },
      {
        element: '#current-status',
        popover: { title: '当前日志', description: '这里会显示小鸦抢课正在干什么' },
      },
      {
        element: '#important-status',
        popover: { title: '重要日志', description: '这里会显示一些重要的信息, 如抢课成功、抢课失败等' },
      },
      {
        element: '#form',
        popover: { title: '抢课设置', description: '这里就是你设置学号、密码、课程等信息的地方' },
      },
      {
        element: '#catch-mode',
        popover: { title: '抢课模式', description: '这里可以选择抢课模式和设置收否开启蹲课保护' },
      },
      {
        element: '#catch-mode-select',
        popover: { title: '抢课', description: '抢课: 会在抢课系统未开放时自动刷新网页, 并在开放时自动抢课' },
      },
      {
        element: '#catch-mode-select',
        popover: { title: '多线程蹲课', description: '多线程蹲课: 会在课程可选人数为零时自动刷新网页, 并在有可选名额时自动选课' },
      },
      {
        element: '#catch-mode-select',
        popover: { title: '单线程蹲课', description: '单线程蹲课: 与多线程蹲课相似, 区别是最多只会打开两个浏览器窗口' },
      },
      {
        element: '#catch-mode-select',
        popover: { title: '抢课模式', description: '三个模式的详细区别详见 Github, 特别提示: 两个蹲课模式都会定期重启浏览器以降低内存消耗, 但抢课模式不会, 所以请不要提前太久开启抢课模式 (建议提前 2-3 分钟开启即可), 以免内存占用过高导致抢课失败' },
      },
      {
        element: '#protect-select',
        popover: { title: '蹲课保护', description: '开启蹲课保护后, 多线程蹲课和单线程蹲课时发生任何错误都会自动重试, 可以有效地避免网络波动导致的蹲课中断' },
      },
      {
        element: '#student-id',
        popover: { title: '学号', description: '这里填写你的学号' },
      },
      {
        element: '#student-password',
        popover: { title: '密码', description: '这里填写你的数字京师密码, 请放心, 所有数据都只会保存在你的电脑本地' },
      },
      {
        element: '#remember-password',
        popover: { title: '记住密码', description: '勾选这个选项可以在下次打开软件时自动填写密码' },
      },
      {
        element: '#refresh-select',
        popover: { title: '刷新频率', description: '这里可以设置网页的刷新频率, 并不是越快越好, 一般默认的 1 秒即可, 如果想要减少耗电量, 也可以选择 2 秒或 5 秒' },
      },
      {
        element: '#headless-select',
        popover: { title: '显示浏览器', description: '勾选这个选项后会在抢课时显示浏览器窗口, 以便实时查看抢课情况. 如果勾选的话请不要手动操作打开的浏览器窗口' },
      },
      {
        element: '#add-courses',
        popover: { title: '添加课程', description: '这里可以添加你想要抢的课程, 请依次选择课程类别、输入课程代码、输入上课班号, 然后点击加号按钮即可添加' },
      },
      {
        element: '#course-type',
        popover: { title: '课程类别', description: '如果你是大一的同学, 一个简单的判断方式是: 你必修的课、专业选修课都不在"选公共选修课"里, 且大多数"选公共选修课"里的课程的上课班号只有"01"' },
      },
      {
        element: '#course-type',
        popover: { title: '课程类别', description: '如果实在不确定, 也可即添加"选公共选修课", 也添加"按开课计划选课"; 小鸦抢课会各开启一个页面, 在相应位置尝试抢课' },
      },
      {
        element: '#course-id',
        popover: { title: '课程代码', description: '这里填写你想要抢的课程的代码, 如"GE610088771"' },
      },
      {
        element: '#class-id',
        popover: { title: '上课班号', description: '这里填写你想要抢的课程的上课班号, 如"01"' },
      },
      {
        element: '#add-course',
        popover: { title: '添加按钮', description: '点击这个按钮可以添加你刚刚填写的课程' },
      },
      {
        element: '#added-courses',
        popover: { title: '已添加课程', description: '这里会显示你已经添加的课程, 可以点击叉号删除' },
      },
      {
        element: '#start-button',
        popover: { title: '开始按钮', description: '确认信息无误后, 点击这个按钮即可开始抢课' },
      },
      {
        element: undefined,
        popover: { title: '重要提示', description: '1: 再次提醒不要提前太久开启抢课模式, 以免内存占用过高导致抢课失败. 而蹲课模式没有内存占用问题, 请放心使用' },
      },
      {
        element: undefined,
        popover: { title: '重要提示', description: '2: 请确认各项信息填写正确、无课程时间冲突、剩余学分足够、使用校园网、网络流畅 (建议去人少的地方抢课)' },
      },
      {
        element: undefined,
        popover: { title: '重要提示', description: '3: 抢课和蹲课的成功率都不是百分之百, 请在软件提示结束或成功后手动二次确认选课结果. 同时, 千万不要将本软件作为唯一的选课手段' },
      },
      {
        element: undefined,
        popover: { title: '重要提示', description: '4: 其他年级抢课开始前后, 教务系统会显示账号已锁定 (详见学校公众号发布的抢课说明), 与小鸦抢课无关' },
      },
      {
        element: undefined,
        popover: { title: '重要提示', description: '5: 本项目仅供学习交流使用, 开源免费. 请勿用于非法用途, 请勿滥用, 请勿使用此项目牟利, 请自行承担使用此项目的风险' },
      },
      {
        element: undefined,
        popover: { title: '祝您好运', description: '最后, 祝你选到心仪的课程, 享受美好的大学生活~' },
      }
    ],
  })
  d.drive()
}
