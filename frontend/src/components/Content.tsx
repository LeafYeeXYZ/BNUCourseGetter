import '../styles/Content.css'
import { BrowserStatus } from '../App'
import { Dialog } from '../wailsjs/go/main/App'
import { Form, Radio, Input, Button, Switch } from 'antd'
import type { CheckboxOptionType } from 'antd'
import { useState } from 'react'
import { EventsEmit } from '../wailsjs/runtime/runtime'

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

interface ContentProps {
  browserStatus: BrowserStatus
  systemStatus: string
}

/**
 * localStorage 存储的数据
 * @var {'CatchCourse' | 'WatchCourse'} mode 抢课模式
 * @var {string} studentID 学号
 * @var {string} password 密码
 * @var {string} courseID 课程代码
 * @var {string} classID 班级代码
 * @var {'yes' | 'no'} isRemember 是否记住密码
 */

export function Content({ browserStatus, systemStatus }: ContentProps) {

  // 表单是否禁用
  const [disableForm, setDisableForm] = useState<boolean>(false)
 
  // 表单提交回调
  function handleSubmit(browserStatus: BrowserStatus, systemStatus: string, value: { [key: string]: unknown }) {
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
    if (localStorage.getItem('isRemember') === 'yes') {
      localStorage.setItem('password', value.password as string)
    }
    localStorage.setItem('studentID', value.studentID as string)
    localStorage.setItem('mode', value.mode as string)
    localStorage.setItem('courseID', value.courseID as string)
    localStorage.setItem('classID', value.classID ? value.classID as string : '')

    // 发送开始抢课事件
    if (systemStatus !== '空闲') {
      Dialog('warning', `请等待当前 ${systemStatus} 状态结束`)
      setDisableForm(false)
      return
    } else if (value.mode === 'WatchCourse') {
      EventsEmit('systemStatus', '蹲课中')
      EventsEmit('currentStatus', '开始蹲课 (๑•̀ㅂ•́)و✧')
    } else if (value.mode === 'CatchCourse') {
      EventsEmit('systemStatus', '抢课中')
      EventsEmit('currentStatus', '开始抢课 (๑•̀ㅂ•́)و✧')
    }
    
    // 开始抢课
    Dialog('info', '开始抢课 (并不会开始)')
      .then(res => {
        EventsEmit('currentStatus', res || '抢课成功')
      })
      .catch(err => {
        EventsEmit('currentStatus', err.message || '抢课失败')
      })
      .finally(() => {
        EventsEmit('systemStatus', '空闲')
        setDisableForm(false)
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
          speed: 1000,
          studentID: localStorage.getItem('studentID') || '',
          password: localStorage.getItem('password') || '',
          courseID: localStorage.getItem('courseID') || '',
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