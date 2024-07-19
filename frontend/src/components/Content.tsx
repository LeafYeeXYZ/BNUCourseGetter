import '../styles/Content.css'
import { Dialog } from '../wailsjs/go/main/App'
import { Form, Radio, Input, Button, Switch, Space } from 'antd'
import { PlusOutlined, CloseOutlined } from '@ant-design/icons'
import type { CheckboxOptionType } from 'antd'
import type { SystemStatus, BrowserStatus, CurrentStatus } from '../App'
import { useState, useRef, useEffect } from 'react'
import { EventsEmit } from '../wailsjs/runtime/runtime'
import { CatchCoursePub, WatchCoursePub, WatchCourseMaj, CatchCourseMaj, WatchCoursePubSync, WatchCourseMajSync } from '../wailsjs/go/main/App'

// 表单选项
const option: {
  [key: string]: CheckboxOptionType[]
} = {
  mode: [ // 抢课模式
    { label: '抢课', value: 'CatchCourse' },
    { label: '多线程蹲课', value: 'WatchCourse' },
    { label: '单线程蹲课', value: 'WatchCourseSync' },
  ],
  speed: [ // 刷新频率
    { label: '每半秒', value: 500 },
    { label: '每秒 (推荐)', value: 1000 },
    { label: '每两秒', value: 2000 },
    { label: '每五秒', value: 5000 },
  ],
  courseType: [ // 课程类别
    { label: '选公共选修课', value: 'public' },
    { label: '按开课计划选课', value: 'major' },
  ],
}

// 抢课函数
const funcs = {
  major: {
    CatchCourse: CatchCourseMaj,
    WatchCourse: WatchCourseMaj,
    WatchCourseSync: WatchCourseMajSync,
  },
  public: {
    CatchCourse: CatchCoursePub,
    WatchCourse: WatchCoursePub,
    WatchCourseSync: WatchCoursePubSync,
  },
}

interface ContentProps {
  browserStatus: BrowserStatus
  systemStatus: SystemStatus
  currentStatus: CurrentStatus
  importantStatus: CurrentStatus
}

type FormValues = {
  mode: 'CatchCourse' | 'WatchCourse' | 'WatchCourseSync' // 存在 localStorage
  speed: number // 存在 localStorage
  courseType: 'public' | 'major' // 存在 localStorage
  studentID: string // 存在 localStorage
  password: string // 存在 localStorage (如果记住密码)
  // courseID: string 
  // classID: string 
  courses: { courseID: string, classID: string }[] // 存在 localStorage
  [key: string]: string | number | { courseID: string, classID: string }[]
}

// 如果版本不一致, 则清除 localStorage
const VERSION: number = 2
if (Number(localStorage.getItem('version')) !== VERSION) {
  localStorage.clear()
  localStorage.setItem('version', String(VERSION))
}

export function Content({ browserStatus, systemStatus, currentStatus, importantStatus }: ContentProps) {

  // 表单是否禁用
  const [disableForm, setDisableForm] = useState<boolean>(false)
 
  // 表单提交回调
  async function handleSubmit(browserStatus: BrowserStatus, systemStatus: SystemStatus, value: FormValues) {
    // 检查浏览器状态
    if (browserStatus.status === '安装中') {
      Dialog('warning', '请等待浏览器安装完成')
      return
    } else if (browserStatus.status === '安装失败') {
      Dialog('error', '浏览器安装失败, 请检查网络并尝试重启应用')
      return
    }
    // 检查课程添加
    if (value.courses.length === 0) {
      Dialog('error', '请添加课程')
      setDisableForm(false)
      return
    }
    // 禁用表单
    setDisableForm(true)
    // 保存相关数据
    for (const key in value) { 
      if (key === 'courses') {
        localStorage.setItem(key, JSON.stringify(value[key]))
      } else {
        localStorage.setItem(key, String(value[key]))
      }
    }
    localStorage.getItem('isRemember') === 'no' && localStorage.setItem('password', '') // 清除密码

    try {
      // 发送开始抢课事件
      const res = await Dialog('question', localStorage.getItem('isHeadless') === 'no' ? 
        '即将开始抢课\n过程中请勿手动操作浏览器\n如需强制退出, 可直接关闭小鸦抢课\n是否继续?' :
        '即将开始抢课\n如需强制退出, 可直接关闭小鸦抢课\n是否继续?'
      )
      // 如果不点击 Yes, 则不执行
      if (res !== 'Yes') {
        setDisableForm(false)
        return
      }
      // 课程和班级
      const courseID: string[] = value.courses.map(course => course.courseID)
      const classID: string[] = value.courses.map(course => course.classID)
      // 如果课程数大于 1, 则警告
      if (courseID.length > 1 && value.mode !== 'WatchCourseSync' && value.mode !== 'WatchCourse') {
        const res = await Dialog('question', `即将开启 ${courseID.length} 个页面同时抢课\n抢课模式下, 每个页面占用内存会逐渐增加\n所以建议不要提前太多时间开始抢课\n请您确认是否继续?`)
        if (res !== 'Yes') {
          setDisableForm(false)
          return
        }
      }
      // 检查并设置系统状态
      if (systemStatus !== '空闲') {
        Dialog('error', `请等待当前 ${systemStatus} 状态结束`)
        setDisableForm(false)
        return
      } else if (value.mode === 'WatchCourse') {
        EventsEmit('systemStatus', '多线程蹲课中')
      } else if (value.mode === 'CatchCourse') {
        EventsEmit('systemStatus', '抢课中')
      } else if (value.mode === 'WatchCourseSync') {
        EventsEmit('systemStatus', '单线程蹲课中')
      }
      // 抢课函数
      if ((value.mode === 'WatchCourseSync' || value.mode === 'WatchCourse') && localStorage.getItem('isProtect') === 'yes') {
        // 蹲课保护: Promise 被拒绝时, 会自动重试
        const autoRetry = async (func: typeof WatchCoursePub | typeof WatchCoursePubSync | typeof WatchCourseMaj | typeof WatchCourseMajSync, speed: number, studentID: string, password: string, courseID: string[], classID: string[], isHeadless: boolean) => {
          // eslint-disable-next-line no-constant-condition
          while (true) {
            try {
              await func(speed, studentID, password, courseID, classID, isHeadless)
              break
            } catch (err) {
              EventsEmit('currentStatus', `检测到发生错误: ${err}`)
              EventsEmit('currentStatus', '蹲课保护已启动, 重试 (如需退出, 直接关闭小鸦抢课即可)')
            }
          }
        }
        await autoRetry(funcs[value.courseType][value.mode], value.speed, value.studentID, value.password, courseID, classID, localStorage.getItem('isHeadless') !== 'no')
      } else {
        // 关闭蹲课保护或抢课
        await funcs[value.courseType][value.mode](value.speed, value.studentID, value.password, courseID, classID, localStorage.getItem('isHeadless') !== 'no')
      }
    } catch (err) {
      EventsEmit('currentStatus', `选课出错: ${err || '未知错误'}`)
      EventsEmit('importantStatus', `选课出错: ${err || '未知错误'}`)
    } finally {
      EventsEmit('systemStatus', '空闲')
      setDisableForm(false)
    }
  }

  // 日志列表
  const logs = currentStatus.map((status, index) => (
    <p key={index} className='content-logs-item'>{status}</p>
  ))
  const results = importantStatus.map((status, index) => (
    <p key={index} className='content-logs-item'>{status}</p>
  ))
  // 自动滚动到底部
  const logsRef = useRef<HTMLDivElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    logsRef.current?.scrollTo(0, logsRef.current.scrollHeight)
  }, [logs])
  useEffect(() => {
    resultsRef.current?.scrollTo(0, resultsRef.current.scrollHeight)
  }, [results])

  // 课程列表
  const courseIDInput = useRef<HTMLInputElement>(null)
  const classIDInput = useRef<HTMLInputElement>(null)
  const [courses, setCourses] = useState<{ courseID: string, classID: string }[]>(JSON.parse(localStorage.getItem('courses') ?? '[]'))

  return (
    <div
      id='content'
    >
      <div className='content-main'>
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
          }}
          style={{ 
            width: '90%',
            maxWidth: 600,
            paddingRight: 13,
          }}
          onFinish={async value => {
            await handleSubmit(browserStatus, systemStatus, { ...value, courses })
          }}
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
    
            <Form.Item label='学号密码' required style={{ marginBottom: '1rem' }}>
              <Space.Compact>
                <Form.Item
                  name='studentID'
                  noStyle
                  rules={[{ required: true, message: '请输入学号' }]}
                >
                  <Input style={{ width: '50%' }} placeholder='请输入学号' />
                </Form.Item>
                <Form.Item
                  name='password'
                  noStyle
                  rules={[{ required: true, message: '请输入密码' }]}
                >
                  <Input.Password style={{ width: '50%' }} placeholder='请输入密码' />
                </Form.Item>
              </Space.Compact>
            </Form.Item>

            <Form.Item label='抢课设置' style={{ marginBottom: '1rem' }}>
              <Switch
                style={{ 
                  opacity: 0.8,
                  marginRight: 10,
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
              <Switch
                style={{ 
                  opacity: 0.8,
                }}
                checkedChildren='蹲课保护'
                unCheckedChildren='蹲课保护'
                defaultChecked={localStorage.getItem('isProtect') === 'yes'}
                onChange={checked => {
                  if (checked) {
                    localStorage.setItem('isProtect', 'yes')
                  } else {
                    localStorage.setItem('isProtect', 'no')
                  }
                }}
              />
            </Form.Item>
    
            <Form.Item label='添加课程'>
              <Space.Compact style={{ width: '100%' }}>
                <input className='antd-like-input' placeholder='课程代码, 例如 GE610088771' style={{ width: '60%' }} ref={courseIDInput} autoComplete='off' autoCorrect='off' autoCapitalize='off' spellCheck='false' />
                <input className='antd-like-input' placeholder='上课班号, 例如 01' style={{ width: '40%' }} ref={classIDInput} autoComplete='off' autoCorrect='off' autoCapitalize='off' spellCheck='false' />
                <Button type='default' style={{ width: '9%' }} icon={<PlusOutlined />} onClick={() => {
                  if (courseIDInput.current!.value && classIDInput.current!.value) {
                    const courseID = courseIDInput.current!.value
                    const classID = classIDInput.current!.value
                    setCourses(prev => [...prev, { courseID: courseID, classID: classID }])
                    courseIDInput.current!.value = ''
                    classIDInput.current!.value = ''
                  } else {
                    Dialog('error', '请输入课程代码和上课班号')
                  }
                }} />
              </Space.Compact>
            </Form.Item>

            <div className='content-courses'>
            {
              courses.length > 0 ? courses.map((course, index) => (
                <div key={index} className='content-courses-item'>
                  <p>{course.courseID} | {course.classID}</p>
                  <CloseOutlined onClick={() => {
                    setCourses(prev => prev.filter((_, i) => i !== index))
                  }} className='content-courses-close' />
                </div>
              )) : <p className='content-courses-empty'>请添加课程</p>
            }
            </div>

            <Button
              type='default'
              htmlType='submit'
              style={{ 
                width: '75%',
                transform: 'translateX(19.5%)',
              }}
            >
              开始
            </Button>
        </Form>
      </div>

      <div className='content-logs-container'>
        <section
          ref={logsRef}
          className='content-logs'
        >
          {logs}
        </section>
        <section
          ref={resultsRef}
          className='content-logs'
        >
          {results}
        </section>
      </div>

    </div>
  )
}