import '../styles/Content.css'
import { BrowserStatus } from '../App'
import { Dialog } from '../wailsjs/go/main/App'
import { Form, Radio, Input, Button } from 'antd'
import type { CheckboxOptionType } from 'antd'
import { useState } from 'react'

// 表单选项
const option: {
  [key: string]: CheckboxOptionType[]
} = {
  mode: [ // 抢课模式
    { label: '抢课', value: '抢课' },
    { label: '蹲课', value: '蹲课' },
  ],
  speed: [ // 刷新频率
    { label: '每半秒', value: 500 },
    { label: '每秒', value: 1000 },
    { label: '每五秒', value: 5000 },
    { label: '每十秒', value: 10000 },
  ],
}
// 表单选项
const input: {
  [key: string]: { placeholder: string, defaultValue?: string }
} = {
  studentID: {
    placeholder: '请输入学号',
    defaultValue: localStorage.getItem('studentID') || '',
  },
  password: {
    placeholder: '请输入密码',
    defaultValue: localStorage.getItem('password') || '',
  },
  courseID: {
    placeholder: '请输入课程代码',
  },
  classID: {
    placeholder: '请输入班级代码',
  },
}

interface ContentProps {
  browserStatus: BrowserStatus
}

export function Content({ browserStatus }: ContentProps) {

  // 表单是否禁用
  const [disableForm, setDisableForm] = useState<boolean>(false)
 
  // 表单提交回调
  function handleSubmit(browserStatus: BrowserStatus) {
    if (browserStatus.status === '安装中') {
      Dialog('warning', '请等待浏览器安装完成')
      return
    } else if (browserStatus.status === '安装失败') {
      Dialog('error', '浏览器安装失败, 请检查网络并尝试重启应用')
      return
    }
    setDisableForm(true)
    Dialog('info', '开始抢课 (๑•̀ㅂ•́)و✧')
      .then(() => setDisableForm(false))
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
        initialValues={{
          mode: '抢课',
          speed: 1000,
          studentID: input.studentID.defaultValue,
          password: input.password.defaultValue,
          courseID: input.courseID.defaultValue,
        }}
        style={{ 
          width: '90%',
          maxWidth: 600 
        }}
        onFinish={() => handleSubmit(browserStatus)}
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
              placeholder={input.studentID.placeholder}
            />
          </Form.Item>
  
          <Form.Item
            label='密码'
            name='password'
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              placeholder={input.password.placeholder}
            />
          </Form.Item>
  
          <Form.Item
            label='课程代码'
            name='courseID'
            rules={[{ required: true, message: '请输入课程代码' }]}
          >
            <Input
              placeholder={input.courseID.placeholder}
            />
          </Form.Item>
  
          <Form.Item
            label='班级代码'
            name='classID'
          >
            <Input
              placeholder={input.classID.placeholder}
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
          </Form.Item>

      </Form>

    </div>
  )
}