import '../styles/Header.css'
import { 
  WindowMinimise,
  WindowToggleMaximise,
  Quit,
  WindowReload,
  Hide,
  Show,
  WindowSetAlwaysOnTop,
} from '../wailsjs/runtime/runtime'
import { Dialog } from '../wailsjs/go/main/App'
import { useState } from 'react'
import { 
  CloseOutlined,
  ExpandOutlined,
  MinusOutlined,
  RedoOutlined,
  PushpinOutlined,
  PushpinFilled,
} from '@ant-design/icons'
import type { SystemStatus } from '../App'

interface HeaderProps {
  systemStatus: SystemStatus
}

export function Header({ systemStatus }: HeaderProps ) {

  // 窗口置顶按钮
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState<boolean>(localStorage.getItem('isAlwaysOnTop') === 'true')

  return (
    <header 
      id="header"
      style={{
        '--wails-draggable': 'drag',
      } as React.CSSProperties}
      onDoubleClick={() => WindowToggleMaximise()}
    >

      <p
        className='header-title'
      >
        小鸦抢课 v1.5.0 - {systemStatus}
      </p>

      <button
        title={isAlwaysOnTop ? '取消置顶' : '窗口置顶'}
        className='header-pin'
        onClick={() => {
          WindowSetAlwaysOnTop(!isAlwaysOnTop)
          setIsAlwaysOnTop(!isAlwaysOnTop)
          localStorage.setItem('isAlwaysOnTop', (!isAlwaysOnTop).toString())
        }}
      >
        {isAlwaysOnTop ? <PushpinFilled /> : <PushpinOutlined />}
      </button>

      <button
        title='刷新'
        className='header-reload'
        onClick={() => {
          Dialog('question', '确定要刷新窗口吗 (oﾟvﾟ)/')
          .then(res => {
            if (res === 'Yes') {
              Hide()
              WindowReload()
              Show()
            }
          })
        }}
      >
        <RedoOutlined />
      </button>

      <button
        title='最小化窗口'
        className='header-min'
        onClick={() => WindowMinimise()}
      >
        <MinusOutlined />
      </button>

      <button
        title='最大化窗口'
        className='header-max'
        onClick={() => WindowToggleMaximise()}
      >
        <ExpandOutlined />
      </button>

      <button
        title='退出'
        className='header-close'
        onClick={() => Quit()}
      >
        <CloseOutlined />
      </button>    

    </header>
  )
}