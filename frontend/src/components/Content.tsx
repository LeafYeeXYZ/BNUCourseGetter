import '../styles/Content.css'
import { BrowserStatus } from '../App'
import { Dialog } from '../wailsjs/go/main/App'
import { Form, Radio, Input, Button, Switch } from 'antd'
import type { CheckboxOptionType } from 'antd'
import { useState } from 'react'
import { EventsEmit } from '../wailsjs/runtime/runtime'
import { CatchCourse, WatchCourse } from '../wailsjs/go/main/App'

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
}

// 抢课函数
const funcs = {
  CatchCourse,
  WatchCourse,
}

interface ContentProps {
  browserStatus: BrowserStatus
  systemStatus: string
}

type FormValues = { // 如果修改, 记得同步修改 Go 端
  mode: 'CatchCourse' | 'WatchCourse' // 存在 localStorage
  speed: number // 存在 localStorage
  studentID: string // 存在 localStorage
  password: string // 存在 localStorage (如果记住密码)
  courseID: string // 存在 localStorage
  classID: string // 存在 localStorage
  [key: string]: string | number
}

export function Content({ browserStatus, systemStatus }: ContentProps) {

  // 表单是否禁用
  const [disableForm, setDisableForm] = useState<boolean>(false)
 
  // 表单提交回调
  function handleSubmit(browserStatus: BrowserStatus, systemStatus: string, value: FormValues) {
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
    Dialog('info', '即将开始抢课\n过程中请勿手动操作浏览器\n如需强制退出, 可直接关闭浏览器')
    .then(() => {
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
      funcs[value.mode](value.speed, value.studentID, value.password, value.courseID, value.classID)
      .catch(err => {
        EventsEmit('currentStatus', err || '选课失败')
      })
      .finally(() => {
        EventsEmit('systemStatus', '空闲')
        setDisableForm(false)
      })
    })
  }

  return (
    <div
      id='content'
    >

      <Form
        name='form'
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 16 }}
        disabled={disableForm}
        autoComplete='off'
        initialValues={{
          mode: localStorage.getItem('mode') || 'CatchCourse',
          speed: Number(localStorage.getItem('speed')) || 1000,
          studentID: localStorage.getItem('studentID') || '',
          password: localStorage.getItem('password') || '',
          courseID: localStorage.getItem('courseID') || '',
          classID: localStorage.getItem('classID') || '',
        }}
        style={{ 
          width: '90%',
          maxWidth: 600 
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
              style={{ marginLeft: 235 }}
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
          </Form.Item>

      </Form>

    </div>
  )
}