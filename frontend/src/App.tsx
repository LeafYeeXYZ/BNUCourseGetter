import './styles/App.css'
import { ConfigProvider } from 'antd'
import { AntdConfig } from './libs/antd'
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

export type SystemStatus = '加载中' | '空闲' | '抢课中' | '蹲课中'
export type CurrentStatus = React.JSX.Element[]

function App() {

  // 阻止双击, 选中文字, 右键菜单等默认事件
  useEffect(() => {
    document.addEventListener('contextmenu', e => e.preventDefault())
    document.addEventListener('selectstart', e => e.preventDefault())
    document.addEventListener('dblclick', e => e.preventDefault())
  }, [])

  // 是否安装了 chromium, 仅在此处修改状态!!!
  const [browserStatus, setBrowserStatus] = useState<BrowserStatus>({ status: '安装中', icon: <LoadingOutlined /> })
  // 安装浏览器
  useEffect(() => {
    InstallBrowser()
      .then(() => setBrowserStatus({ status: '已安装', icon: <CheckOutlined /> }))
      .catch(() => setBrowserStatus({ status: '安装失败', icon: <CloseOutlined /> }))
  }, [])

  // 用于标识系统状态的 state 和 event, 仅使用事件修改状态!!!
  const [systemStatus, setSystemStatus] = useState<SystemStatus>('加载中')
  useEffect(() => {
    EventsOn('systemStatus', (status: SystemStatus) => setSystemStatus(status))
    EventsEmit('systemStatus', '空闲')
    return () => EventsOff('systemStatus')
  }, [])
  
  // 用于标识当前输出的 state 和 event, 仅使用事件修改状态!!!
  const [currentStatus, setCurrentStatus] = useState<CurrentStatus>([<span>{new Date().toLocaleTimeString()}&nbsp;&nbsp;开始加载</span>])
  useEffect(() => {
    EventsOn('currentStatus', (status: string) => {
      // 最多同时保留 500 条记录
      setCurrentStatus(prev => [...prev.slice(-499), <span>{new Date().toLocaleTimeString()}&nbsp;&nbsp;{status}</span>])
    })
    EventsEmit('currentStatus', '系统已启动 (此处将展示日志)')
    return () => EventsOff('currentStatus')
  }, [])

  // 重要事件的 state 和 event, 仅使用事件修改状态!!!
  const [importantStatus, setImportantStatus] = useState<CurrentStatus>([<span>{new Date().toLocaleTimeString()}&nbsp;&nbsp;开始加载</span>])
  useEffect(() => {
    EventsOn('importantStatus', (status: string) => {
      // 最多同时保留 100 条记录
      setImportantStatus(prev => [...prev.slice(-99), <span>{new Date().toLocaleTimeString()}&nbsp;&nbsp;{status}</span>])
    })
    EventsEmit('importantStatus', '系统已启动 (此处将展示结果)')
    return () => EventsOff('importantStatus')
  }, [])

  return (
    <main id="container">

      <ConfigProvider {...AntdConfig}>

        <Header 
          systemStatus={systemStatus}
        />

        <Content 
          browserStatus={browserStatus}
          systemStatus={systemStatus}
          currentStatus={currentStatus}
          importantStatus={importantStatus}
        />

        <Footer 
          browserStatus={browserStatus}
        />

      </ConfigProvider>

    </main>
  )
}

export default App
