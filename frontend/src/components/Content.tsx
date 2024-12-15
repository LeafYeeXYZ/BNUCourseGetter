import { Dialog } from '../wailsjs/go/main/App'
import { Form, Radio, Input, Button, Space, Select, Checkbox } from 'antd'
import { PlusOutlined, CloseOutlined } from '@ant-design/icons'
import { useZustand } from '../libs/useZustand'
import type { SystemStatus, BrowserStatus } from '../libs/types'
import { useState, useRef, useEffect } from 'react'
import { EventsEmit } from '../wailsjs/runtime/runtime'
import { CatchCoursePub, WatchCoursePub, WatchCourseMaj, CatchCourseMaj, WatchCoursePubSync, WatchCourseMajSync } from '../wailsjs/go/main/App'

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

type FormValues = {
  mode: 'CatchCourse' | 'WatchCourse' | 'WatchCourseSync' // 存在 localStorage
  speed: number // 存在 localStorage
  studentID: string // 存在 localStorage
  password: string // 存在 localStorage (如果记住密码)
  courses: { 
    courseID: string, 
    classID: string,
    type: 'public' | 'major'
  }[] // 存在 localStorage
  _courseID: string
  _classID: string
  _type: 'public' | 'major'
  [key: string]: string | number | { courseID: string, classID: string }[]
}

// 如果版本不一致, 则清除 localStorage
const VERSION: number = 3
if (Number(localStorage.getItem('version')) !== VERSION) {
  localStorage.clear()
  localStorage.setItem('version', String(VERSION))
}

export function Content() {

  const { browserStatus, systemStatus, currentStatus, importantStatus, disabled, setDisabled } = useZustand()
  const [form] = Form.useForm<FormValues>()
  // 表单提交回调
  async function handleSubmit(browserStatus: BrowserStatus, systemStatus: SystemStatus, value: FormValues) {
    // 检查浏览器状态
    if (browserStatus === '安装中') {
      Dialog('warning', '请等待浏览器安装完成')
      return
    } else if (browserStatus === '安装失败') {
      Dialog('error', '浏览器安装失败, 请检查网络并尝试重启应用')
      return
    }
    // 检查课程添加
    if (value.courses.length === 0) {
      Dialog('error', '请添加课程')
      setDisabled(false)
      return
    }
    // 禁用表单
    setDisabled(true)
    // 保存相关数据
    for (const key in value) { 
      if (key === 'courses') {
        localStorage.setItem(key, JSON.stringify(value[key]))
      } else {
        localStorage.setItem(key, String(value[key]))
      }
    }
    localStorage.getItem('isRemember') === 'yes' || localStorage.setItem('password', '') // 清除密码

    try {
      // 发送开始抢课事件
      const res = await Dialog('question', localStorage.getItem('isHeadless') === 'no' ? 
        '即将开始抢课\n过程中请勿手动操作浏览器\n如需强制退出, 可直接关闭小鸦抢课\n是否继续?' :
        '即将开始抢课\n如需强制退出, 可直接关闭小鸦抢课\n是否继续?'
      )
      // 如果不点击 Yes, 则不执行
      if (res !== 'Yes') {
        setDisabled(false)
        return
      }
      // 课程和班级
      const publicCourses = value.courses.filter(course => course.type === 'public')
      const majorCourses = value.courses.filter(course => course.type === 'major')
      // 如果课程数大于 1, 则警告
      if (value.courses.length > 1 && value.mode === 'CatchCourse') {
        const res = await Dialog('question', `即将开启 ${value.courses.length} 个页面同时抢课\n抢课模式下, 每个页面占用内存会逐渐增加\n所以建议不要提前太多时间开始抢课\n请您确认是否继续?`)
        if (res !== 'Yes') {
          setDisabled(false)
          return
        }
      }
      // 检查并设置系统状态
      if (systemStatus !== '空闲') {
        Dialog('error', `请等待当前 ${systemStatus} 状态结束`)
        setDisabled(false)
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
        // 开始蹲课保护
        if (publicCourses.length > 0 && majorCourses.length > 0) {
          const res = await Promise.allSettled([
            autoRetry(funcs.public[value.mode], value.speed, value.studentID, value.password, publicCourses.map(course => course.courseID), publicCourses.map(course => course.classID), localStorage.getItem('isHeadless') !== 'no'),
            autoRetry(funcs.major[value.mode], value.speed, value.studentID, value.password, majorCourses.map(course => course.courseID), majorCourses.map(course => course.classID), localStorage.getItem('isHeadless') !== 'no'),
          ])
          res.forEach((res) => {
            if (res.status === 'rejected') {
              EventsEmit('currentStatus', `选课出错: ${res.reason || '未知错误'}`)
              EventsEmit('importantStatus', `选课出错: ${res.reason || '未知错误'}`)
            }
          })
          return
        } else if (publicCourses.length > 0) {
          await autoRetry(funcs.public[value.mode], value.speed, value.studentID, value.password, publicCourses.map(course => course.courseID), publicCourses.map(course => course.classID), localStorage.getItem('isHeadless') !== 'no')
        } else if (majorCourses.length > 0) {
          await autoRetry(funcs.major[value.mode], value.speed, value.studentID, value.password, majorCourses.map(course => course.courseID), majorCourses.map(course => course.classID), localStorage.getItem('isHeadless') !== 'no')
        }
      } else {
        // 关闭蹲课保护或抢课
        if (publicCourses.length > 0 && majorCourses.length > 0) {
          const res = await Promise.allSettled([
            funcs.public[value.mode](value.speed, value.studentID, value.password, publicCourses.map(course => course.courseID), publicCourses.map(course => course.classID), localStorage.getItem('isHeadless') !== 'no'),
            funcs.major[value.mode](value.speed, value.studentID, value.password, majorCourses.map(course => course.courseID), majorCourses.map(course => course.classID), localStorage.getItem('isHeadless') !== 'no'),
          ])
          res.forEach((res) => {
            if (res.status === 'rejected') {
              EventsEmit('currentStatus', `选课出错: ${res.reason || '未知错误'}`)
              EventsEmit('importantStatus', `选课出错: ${res.reason || '未知错误'}`)
            }
          })
          return
        } else if (publicCourses.length > 0) {
          await funcs.public[value.mode](value.speed, value.studentID, value.password, publicCourses.map(course => course.courseID), publicCourses.map(course => course.classID), localStorage.getItem('isHeadless') !== 'no')
        } else if (majorCourses.length > 0) {
          await funcs.major[value.mode](value.speed, value.studentID, value.password, majorCourses.map(course => course.courseID), majorCourses.map(course => course.classID), localStorage.getItem('isHeadless') !== 'no')
        }
      }
    } catch (err) {
      EventsEmit('currentStatus', `选课出错: ${err || '未知错误'}`)
      EventsEmit('importantStatus', `选课出错: ${err || '未知错误'}`)
    } finally {
      EventsEmit('systemStatus', '空闲')
      setDisabled(false)
    }
  }

  // 日志列表
  const logs = currentStatus.map((status, index) => (
    <p key={index} className='whitespace-nowrap overflow-x-auto opacity-85 text-xs'>{status}</p>
  ))
  const results = importantStatus.map((status, index) => (
    <p key={index} className='whitespace-nowrap overflow-x-auto opacity-85 text-xs'>{status}</p>
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
  const [courses, setCourses] = useState<FormValues['courses']>(JSON.parse(localStorage.getItem('courses') ?? '[]'))

  return (
    <div
      className='w-full h-full relative grid grid-rows-[1fr,10rem] overflow-hidden border-t border-rose-100 border-solid'
    >
      <div className='w-full flex flex-col items-center justify-center overflow-auto py-4'>
        <Form
          form={form}
          className='w-full max-w-lg py-4'
          disabled={disabled}
          autoComplete='off'
          layout='vertical'
          initialValues={{
            mode: localStorage.getItem('mode') || 'CatchCourse',
            speed: Number(localStorage.getItem('speed')) || 1000,
            courseType: localStorage.getItem('courseType') || 'public',
            studentID: localStorage.getItem('studentID') || '',
            password: localStorage.getItem('password') || '',
          }}
          onFinish={async value => {
            await handleSubmit(browserStatus, systemStatus, { ...value, courses })
          }}
        >
          <Form.Item label='抢课模式' required style={{ marginBottom: '1rem' }}>
            <Space.Compact block>
              <Form.Item
                name='mode'
                noStyle
                rules={[{ required: true, message: '请选择抢课模式' }]}
              >
                <Radio.Group
                  className='w-full'
                  block
                  options={[
                    { label: '抢课', value: 'CatchCourse' },
                    { label: '多线程蹲课', value: 'WatchCourse' },
                    { label: '单线程蹲课', value: 'WatchCourseSync', style: { borderStartEndRadius: '0px', borderEndEndRadius: '0px', borderRight: 'none' } },
                  ]}
                  optionType='button'
                  buttonStyle='solid'
                />
              </Form.Item>
              <div className='flex items-center justify-center border rounded-e-md border-[#d9d9d9] pl-3 pr-1'>
                <Checkbox
                  className='text-nowrap'
                  defaultChecked={localStorage.getItem('isProtect') === 'yes'}
                  onChange={e => {
                    if (e.target.checked) {
                      localStorage.setItem('isProtect', 'yes')
                    } else {
                      localStorage.setItem('isProtect', 'no')
                    }
                  }}
                >
                  蹲课保护
                </Checkbox>
              </div>
            </Space.Compact>
          </Form.Item>
          <Form.Item label='学号密码' required style={{ marginBottom: '1rem' }}>
            <Space.Compact block>
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
              <div className='flex items-center justify-center border rounded-e-md border-[#d9d9d9] pl-3 pr-1'>
                <Checkbox
                  className='text-nowrap'
                  defaultChecked={localStorage.getItem('isRemember') === 'yes'}
                  onChange={e => {
                    if (e.target.checked) {
                      localStorage.setItem('isRemember', 'yes')
                    } else {
                      localStorage.setItem('isRemember', 'no')
                      localStorage.setItem('password', '')
                    }
                  }}
                >
                  记住密码
                </Checkbox>
              </div>
            </Space.Compact>
          </Form.Item>
          <Form.Item label='其他设置' style={{ marginBottom: '1rem' }}>
            <Space.Compact block>
              <div className='text-nowrap bg-gray-100 border border-[#d9d9d9] border-e-0 rounded-s-md px-3 flex items-center justify-center'>
                刷新频率
              </div>
              <Form.Item
                noStyle
                name='speed'
                rules={[{ required: true, message: '请选择刷新频率' }]}
              >
                <Select
                  options={[ // 刷新频率
                    { label: '每半秒', value: 500 },
                    { label: '每秒(推荐)', value: 1000 },
                    { label: '每两秒', value: 2000 },
                    { label: '每五秒', value: 5000 },
                  ]}
                />
              </Form.Item>
              <div className='flex items-center justify-center border rounded-e-md border-[#d9d9d9] pl-3 pr-1'>
                <Checkbox
                  className='text-nowrap'
                  defaultChecked={localStorage.getItem('isHeadless') === 'no'}
                  onChange={e => {
                    if (e.target.checked) {
                      localStorage.setItem('isHeadless', 'no')
                    } else {
                      localStorage.setItem('isHeadless', 'yes')
                    }
                  }}
                >
                  显示浏览器
                </Checkbox>
              </div>
            </Space.Compact>
          </Form.Item>
          <Form.Item label='添加课程' style={{ marginBottom: '1rem' }}>
            <Space.Compact block>
              <Form.Item noStyle name='_type'>
                <Select
                  placeholder='课程类型'
                  options={[
                    { label: '选公共选修课', value: 'public' },
                    { label: '按开课计划选课', value: 'major' },
                  ]}
                />
              </Form.Item>
              <Form.Item noStyle name='_courseID'>
                <Input
                  placeholder='课程代码, 例如 GE610088771' 
                  autoComplete='off' autoCorrect='off' autoCapitalize='off' spellCheck='false' 
                />
              </Form.Item>
              <Form.Item noStyle name='_classID'>
                <Input 
                  placeholder='上课班号, 例如 01' 
                  autoComplete='off' autoCorrect='off' autoCapitalize='off' spellCheck='false' 
                />
              </Form.Item>
              <Button 
                type='primary' 
                className='border-gray-300 border-l-gray-200'
                icon={<PlusOutlined />} 
                onClick={() => {
                  const courseID = form.getFieldValue('_courseID')
                  const classID = form.getFieldValue('_classID')
                  const type = form.getFieldValue('_type')
                  if (courseID && classID && type) {
                    setCourses(prev => [...prev, { courseID: courseID, classID: classID, type: type }])
                    form.resetFields(['_courseID', '_classID', '_type'])
                  } else {
                    Dialog('error', '请输入课程类别、课程代码、上课班号')
                  }
                }} 
              />
            </Space.Compact>
          </Form.Item>

          <div className='mb-4 flex flex-wrap items-center justify-center text-nowrap gap-2'>
          {
            courses.length > 0 ? courses.map((course, index) => (
              <div key={index} className='flex items-center justify-center gap-2 border flex-nowrap text-xs py-1 px-2 rounded-full'>
                <p>{course.type === 'public' ? '选公共选修课' : '按开课计划选课'} | {course.courseID} | {course.classID}</p>
                <CloseOutlined onClick={() => {
                  setCourses(prev => prev.filter((_, i) => i !== index))
                }} className='cursor-pointer' />
              </div>
            )) : <p className='text-sm'>请添加课程</p>
          }
          </div>

          <Button
            type='default'
            htmlType='submit'
            block
          >
            开始
          </Button>
        </Form>
      </div>

      <div className='w-full h-full grid grid-cols-2'>
        <section
          ref={logsRef}
          style={{ borderRight: '1px dashed #fda4af' }}
          className='p-2 border-y bg-[#fffaf9] border-rose-300 border-b-rose-100 border-solid overflow-auto'
        >
          {logs.length > 0 ? logs : <p className='w-full h-full flex items-center justify-center text-sm'>此处将显示日志</p>}
        </section>
        <section
          ref={resultsRef}
          className='p-2 border-y bg-[#fffaf9] border-rose-300 border-b-rose-100 border-solid overflow-auto'
        >
          {results.length > 0 ? results : <p className='w-full h-full flex items-center justify-center text-sm'>此处将显示结果</p>}
        </section>
      </div>

    </div>
  )
}