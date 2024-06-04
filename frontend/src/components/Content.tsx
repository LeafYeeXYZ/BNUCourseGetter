import '../styles/Content.css'
import { Dialog } from '../wailsjs/go/main/App'
import { Form, Radio, Input, Button, Switch } from 'antd'
import type { CheckboxOptionType } from 'antd'
import type { SystemStatus, BrowserStatus, CurrentStatus } from '../App'
import { useState, useRef, useEffect } from 'react'
import { EventsEmit } from '../wailsjs/runtime/runtime'
import { CatchCoursePub, WatchCoursePub, WatchCourseMaj, CatchCourseMaj } from '../wailsjs/go/main/App'

// 表单选项
const option: {
  [key: string]: CheckboxOptionType[]
} = {
  mode: [ // 抢课模式
    { label: '抢课', value: 'CatchCourse' },
    { label: '蹲课', value: 'WatchCourse' },
  ],
  speed: [ // 刷新频率
    { label: '每半秒', value: 500 },
    { label: '每秒', value: 1000 },
    { label: '每五秒', value: 5000 },
    { label: '每十秒', value: 10000 },
  ],
  courseType: [ // 课程类别
    { label: '选公共选修课', value: 'public' },
    { label: '按开课计划选课', value: 'major', disabled: true },
  ],
}

// 抢课函数
const funcs = {
  major: {
    CatchCourse: CatchCourseMaj,
    WatchCourse: WatchCourseMaj,
  },
  public: {
    CatchCourse: CatchCoursePub,
    WatchCourse: WatchCoursePub,
  },
}

interface ContentProps {
  browserStatus: BrowserStatus
  systemStatus: SystemStatus
  currentStatus: CurrentStatus
}

type FormValues = {
  mode: 'CatchCourse' | 'WatchCourse' // 存在 localStorage
  speed: number // 存在 localStorage
  courseType: 'public' | 'major' // 存在 localStorage
  studentID: string // 存在 localStorage
  password: string // 存在 localStorage (如果记住密码)
  courseID: string // 存在 localStorage
  classID: string // 存在 localStorage
  [key: string]: string | number
}

// 如果版本不一致, 则清除 localStorage
const VERSION: number = 1
if (Number(localStorage.getItem('version')) !== VERSION) {
  localStorage.clear()
  localStorage.setItem('version', String(VERSION))
}

export function Content({ browserStatus, systemStatus, currentStatus }: ContentProps) {

  // 表单是否禁用
  const [disableForm, setDisableForm] = useState<boolean>(false)
 
  // 表单提交回调
  function handleSubmit(browserStatus: BrowserStatus, systemStatus: SystemStatus, value: FormValues) {
    // 检查浏览器状态
    if (browserStatus.status === '安装中') {
      Dialog('warning', '请等待浏览器安装完成')
      return
    } else if (browserStatus.status === '安装失败') {
      Dialog('error', '浏览器安装失败, 请检查网络并尝试重启应用')
      return
    }

    // 禁用表单
    setDisableForm(true)

    // 保存相关数据
    for (const key in value) { localStorage.setItem(key, String(value[key])) }
    localStorage.getItem('isRemember') === 'no' && localStorage.setItem('password', '') // 清除密码

    // 发送开始抢课事件
    Dialog('question', localStorage.getItem('isHeadless') === 'no' ? 
      '即将开始抢课\n过程中请勿手动操作浏览器\n如需强制退出, 可直接关闭小鸦抢课\n是否继续?' :
      '即将开始抢课\n如需强制退出, 可直接关闭小鸦抢课\n是否继续?'
    )
    .then(res => {
      // 如果不点击 Yes, 则不执行
      if (res !== 'Yes') {
        setDisableForm(false)
        return
      }
      // 检查并设置系统状态
      if (systemStatus !== '空闲') {
        Dialog('error', `请等待当前 ${systemStatus} 状态结束`)
        setDisableForm(false)
        return
      } else if (value.mode === 'WatchCourse') {
        EventsEmit('systemStatus', '蹲课中')
      } else if (value.mode === 'CatchCourse') {
        EventsEmit('systemStatus', '抢课中')
      }
      // 抢课函数
      funcs[value.courseType][value.mode](value.speed, value.studentID, value.password, value.courseID, value.classID, localStorage.getItem('isHeadless') !== 'no')
      .catch(err => {
        EventsEmit('currentStatus', err || '选课失败')
      })
      .finally(() => {
        EventsEmit('systemStatus', '空闲')
        setDisableForm(false)
      })
    })
  }

  // 日志列表
  const logs = currentStatus.map((status, index) => (
    <p key={index} className='content-logs-item'>{status}</p>
  ))
  // 自动滚动到底部
  const logsRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    logsRef.current?.scrollTo(0, logsRef.current.scrollHeight)
  }, [logs])

  return (
    <div
      id='content'
    >

      <Form
        name='form'
        className='content-form'
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 16 }}
        disabled={disableForm}
        autoComplete='off'
        initialValues={{
          mode: localStorage.getItem('mode') || 'CatchCourse',
          speed: Number(localStorage.getItem('speed')) || 1000,
          courseType: localStorage.getItem('courseType') || 'public',
          studentID: localStorage.getItem('studentID') || '',
          password: localStorage.getItem('password') || '',
          courseID: localStorage.getItem('courseID') || '',
          classID: localStorage.getItem('classID') || '',
        }}
        style={{ 
          width: '90%',
          maxWidth: 600,
          paddingRight: 13,
        }}
        onFinish={value => handleSubmit(browserStatus, systemStatus, value)}
      >
          
          <Form.Item
            label='抢课模式'
            name='mode'
            rules={[{ required: true, message: '请选择抢课模式' }]}
          >
            <Radio.Group
              options={option.mode}
              optionType='button'
              buttonStyle='solid'
            />
          </Form.Item>
  
          <Form.Item
            label='刷新频率'
            name='speed'
            rules={[{ required: true, message: '请选择刷新频率' }]}
          >
            <Radio.Group
              options={option.speed}
              optionType='button'
              buttonStyle='solid'
            />
          </Form.Item>

          <Form.Item
            label='课程类别'
            name='courseType'
            rules={[{ required: true, message: '请选择课程类别' }]}
          >
            <Radio.Group
              options={option.courseType}
              optionType='button'
              buttonStyle='solid'
            />
          </Form.Item>
  
          <Form.Item
            label='学号'
            name='studentID'
            rules={[{ required: true, message: '请输入学号' }]}
          >
            <Input
              placeholder='请输入学号'
            />
          </Form.Item>
  
          <Form.Item
            label='密码'
            name='password'
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              placeholder='请输入密码'
            />
          </Form.Item>
  
          <Form.Item
            label='课程代码'
            name='courseID'
            rules={[{ required: true, message: '请输入课程代码' }]}
          >
            <Input
              placeholder='请输入课程代码'
            />
          </Form.Item>
  
          <Form.Item
            label='班级代码'
            name='classID'
            rules={[{ required: true, message: '请输入班级代码' }]}
          >
            <Input
              placeholder='请输入班级代码'
            />
          </Form.Item>

          <Form.Item
            wrapperCol={{ offset: 6, span: 16 }}
          >
            <Button
              type='primary'
              htmlType='submit'
            >
              开始
            </Button>
            <Switch
              style={{ 
                float: 'right',
                opacity: 0.8,
              }}
              checkedChildren='记住密码'
              unCheckedChildren='记住密码'
              defaultChecked={localStorage.getItem('isRemember') === 'yes'}
              onChange={checked => {
                if (checked) {
                  localStorage.setItem('isRemember', 'yes')
                } else {
                  localStorage.setItem('isRemember', 'no')
                  localStorage.setItem('password', '')
                }
              }}
            />
            <Switch
              style={{ 
                float: 'right',
                opacity: 0.8,
                marginRight: 10,
              }}
              checkedChildren='显示浏览器'
              unCheckedChildren='显示浏览器'
              defaultChecked={localStorage.getItem('isHeadless') === 'no'}
              onChange={checked => {
                if (checked) {
                  localStorage.setItem('isHeadless', 'no')
                } else {
                  localStorage.setItem('isHeadless', 'yes')
                }
              }}
            />
          </Form.Item>

      </Form>

      <section
        ref={logsRef}
        className='content-logs'
      >
        {logs}
      </section>

    </div>
  )
}