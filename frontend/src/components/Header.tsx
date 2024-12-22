import { 
  WindowMinimise,
  WindowToggleMaximise,
  Quit,
  WindowReload,
  WindowSetAlwaysOnTop,
} from '../wailsjs/runtime/runtime'
import { Dialog } from '../wailsjs/go/main/App'
import { useZustand } from '../libs/useZustand'
import { useState, useEffect } from 'react'
import { Tag } from 'antd'
import { tutorial } from '../libs/driver'
import { 
  CloseOutlined,
  ExpandOutlined,
  MinusOutlined,
  RedoOutlined,
  PushpinOutlined,
  PushpinFilled,
  QuestionOutlined,
} from '@ant-design/icons'

export function Header() {

  // 窗口置顶按钮
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState<boolean>(false)
  useEffect(() => setIsAlwaysOnTop(localStorage.getItem('isAlwaysOnTop') === 'true'), [])
  // 系统状态
  const { systemStatus } = useZustand()

  return (
    <header 
      className='grid grid-cols-[1fr,40px,40px,40px,40px,40px,40px] bg-rose-50 w-full h-full'
      style={{
        '--wails-draggable': 'drag',
      } as React.CSSProperties}
      onDoubleClick={() => WindowToggleMaximise()}
    >

      <p
        className='w-full h-full flex items-center justify-start text-sm gap-2 pl-3'
      >
        <span className='font-bold' data-tg-tour='测试'>小鸦抢课</span>
        <Tag id='version' className='m-0 border-rose-950 bg-white leading-none py-[0.15rem] px-[0.3rem]'>2.0.3</Tag>
        <Tag id='status' className='m-0 border-rose-950 bg-white leading-none py-[0.15rem] px-[0.3rem]'>{systemStatus}</Tag>
      </p>
      <button
        id='help-button'
        title='帮助'
        className='header-btn'
        onClick={() => tutorial()}
      >
        <QuestionOutlined />
      </button>
      <button
        id='always-on-top-button'
        title={isAlwaysOnTop ? '取消置顶' : '窗口置顶'}
        className='header-btn'
        onClick={() => {
          WindowSetAlwaysOnTop(!isAlwaysOnTop)
          setIsAlwaysOnTop(!isAlwaysOnTop)
          localStorage.setItem('isAlwaysOnTop', (!isAlwaysOnTop).toString())
        }}
      >
        {isAlwaysOnTop ? <PushpinFilled /> : <PushpinOutlined />}
      </button>
      <button
        id='refresh-button'
        title='刷新'
        className='header-btn'
        onClick={() => {
          Dialog('question', '确定要刷新窗口吗 (oﾟvﾟ)/')
          .then(res => {
            if (res === 'Yes') {
              WindowReload()
            }
          })
        }}
      >
        <RedoOutlined />
      </button>
      <button
        id='minimise-button'
        title='最小化窗口'
        className='header-btn'
        onClick={() => WindowMinimise()}
      >
        <MinusOutlined />
      </button>
      <button
        id='maximise-button'
        title='最大化窗口'
        className='header-btn'
        onClick={() => WindowToggleMaximise()}
      >
        <ExpandOutlined />
      </button>
      <button
        id='quit-button'
        title='退出'
        className='header-btn'
        onClick={() => Quit()}
      >
        <CloseOutlined />
      </button>    
    </header>
  )
}