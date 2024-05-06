import './styles/App.css'
import {
  LoadingOutlined,
  CloseOutlined,
  CheckOutlined,
} from '@ant-design/icons'

import { InstallBrowser } from './wailsjs/go/main/App'
import { EventsEmit, EventsOn, EventsOff } from './wailsjs/runtime/runtime'
import { useState, useEffect } from 'react'

import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { Content } from './components/Content'

export type BrowserStatus = {
  status: '安装中' | '已安装' | '安装失败'
  icon: React.JSX.Element
}

function App() {

  // 阻止双击, 选中文字, 右键菜单等默认事件
  useEffect(() => {
    document.addEventListener('contextmenu', e => e.preventDefault())
    document.addEventListener('selectstart', e => e.preventDefault())
    document.addEventListener('dblclick', e => e.preventDefault())
  }, [])

  // 是否安装了 chromium
  const [browserStatus, setBrowserStatus] = useState<BrowserStatus>({ status: '安装中', icon: <LoadingOutlined /> })
  // 安装浏览器
  useEffect(() => {
    InstallBrowser()
      .then(() => setBrowserStatus({ status: '已安装', icon: <CheckOutlined /> }))
      .catch(() => setBrowserStatus({ status: '安装失败', icon: <CloseOutlined /> }))
  }, [])

  // 用于标识系统状态的 state 和 event
  const [systemStatus, setSystemStatus] = useState<string>('加载中')
  useEffect(() => {
    EventsOn('systemStatus', (status: string) => setSystemStatus(status))
    EventsEmit('systemStatus', '空闲')
    return () => EventsOff('systemStatus')
  }, [])
  
  // 用于标识当前输出的 state 和 event
  const [currentStatus, setCurrentStatus] = useState<string>(`${new Date().toLocaleTimeString()} 加载中`)
  useEffect(() => {
    EventsOn('currentStatus', (status: string) => setCurrentStatus(`${new Date().toLocaleTimeString()} ${status}`))
    EventsEmit('currentStatus', '系统已启动')
    return () => EventsOff('currentStatus')
  }, [])

  return (
    <main id="container">

      <Header 
        systemStatus={systemStatus}
      />

      <Content 
        browserStatus={browserStatus}
      />

      <Footer 
        browserStatus={browserStatus}
        currentStatus={currentStatus}
      />

    </main>
  )
}

export default App
