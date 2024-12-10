import { 
  WindowMinimise,
  WindowToggleMaximise,
  Quit,
  WindowReload,
  WindowSetAlwaysOnTop,
} from '../wailsjs/runtime/runtime'
import { Dialog } from '../wailsjs/go/main/App'
import { useZustand } from '../libs/useZustand'
import { useState, useEffect, useMemo } from 'react'
import { Tag } from 'antd'
import { 
  CloseOutlined,
  ExpandOutlined,
  MinusOutlined,
  RedoOutlined,
  PushpinOutlined,
  PushpinFilled,
  LoadingOutlined,
  CheckOutlined,
} from '@ant-design/icons'

export function Header() {

  // 窗口置顶按钮
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState<boolean>(false)
  useEffect(() => setIsAlwaysOnTop(localStorage.getItem('isAlwaysOnTop') === 'true'), [])
  // 系统状态
  const { systemStatus, browserStatus } = useZustand()
  const icon = useMemo(() => {
    switch (browserStatus) {
      case '已安装':
        return <CheckOutlined />
      case '安装中':
        return <LoadingOutlined />
      default:
        return <CloseOutlined />
    }
  }, [browserStatus])

  return (
    <header 
      className='grid grid-cols-[1fr,40px,40px,40px,40px,40px] bg-rose-50 w-full h-full'
      style={{
        '--wails-draggable': 'drag',
      } as React.CSSProperties}
      onDoubleClick={() => WindowToggleMaximise()}
    >

      <p
        className='w-full h-full flex items-center justify-start text-sm gap-2 pl-3'
      >
        <span className='font-bold'>小鸦抢课</span>
        <Tag className='m-0 border-rose-950 bg-white leading-none py-[0.15rem] px-[0.3rem]'>2.0.0</Tag>
        <Tag className='m-0 border-rose-950 bg-white leading-none py-[0.15rem] px-[0.3rem]'>浏览器: {browserStatus} {icon}</Tag>
        <Tag className='m-0 border-rose-950 bg-white leading-none py-[0.15rem] px-[0.3rem]'>{systemStatus}</Tag>
      </p>
      <button
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
        title='最小化窗口'
        className='header-btn'
        onClick={() => WindowMinimise()}
      >
        <MinusOutlined />
      </button>
      <button
        title='最大化窗口'
        className='header-btn'
        onClick={() => WindowToggleMaximise()}
      >
        <ExpandOutlined />
      </button>
      <button
        title='退出'
        className='header-btn'
        onClick={() => Quit()}
      >
        <CloseOutlined />
      </button>    
    </header>
  )
}