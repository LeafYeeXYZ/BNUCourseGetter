import './tailwind.css'
import { ConfigProvider, type ConfigProviderProps } from 'antd'
import { InstallBrowser } from './wailsjs/go/main/App'
import { EventsEmit, EventsOn, EventsOff } from './wailsjs/runtime/runtime'
import { useEffect } from 'react'
import { useZustand } from './libs/useZustand'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { Content } from './components/Content'
import type { SystemStatus } from './libs/types'

const AntdConfig: ConfigProviderProps = {
  theme: {
    token: {
      colorPrimary: '#ffd0d0',
      colorText: '#300000',
    },
  },
}

export default function App() {

  const { setBrowserStatus, setSystemStatus, setCurrentStatus, setImportantStatus } = useZustand()
  // 阻止双击, 选中文字, 右键菜单等默认事件
  useEffect(() => {
    document.addEventListener('contextmenu', e => e.preventDefault())
    document.addEventListener('selectstart', e => e.preventDefault())
    document.addEventListener('dblclick', e => e.preventDefault())
  }, [])
  // 仅在此处修改浏览器状态
  useEffect(() => {
    InstallBrowser()
      .then(() => setBrowserStatus('已安装'))
      .catch(() => setBrowserStatus('安装失败'))
  }, [setBrowserStatus])
  // 仅在此处 (使用事件) 修改系统状态
  useEffect(() => {
    EventsOn('systemStatus', (status: SystemStatus) => setSystemStatus(status))
    EventsEmit('systemStatus', '空闲')
    return () => EventsOff('systemStatus')
  }, [setSystemStatus])
  // 仅在此处 (使用事件) 修改当前状态
  useEffect(() => {
    EventsOn('currentStatus', (status: string) => {
      // 最多同时保留 500 条记录
      setCurrentStatus(prev => [...prev.slice(-499), `${new Date().toLocaleTimeString()}  ${status}`])
    })
    EventsEmit('currentStatus', '系统已启动 (此处将展示日志)')
    return () => EventsOff('currentStatus')
  }, [setCurrentStatus])
  // 仅在此处 (使用事件) 修改重要状态
  useEffect(() => {
    EventsOn('importantStatus', (status: string) => {
      // 最多同时保留 100 条记录
      setImportantStatus(prev => [...prev.slice(-99), `${new Date().toLocaleTimeString()}  ${status}`])
    })
    EventsEmit('importantStatus', '系统已启动 (此处将展示结果)')
    return () => EventsOff('importantStatus')
  }, [setImportantStatus])

  return (
    <ConfigProvider {...AntdConfig}>
    <main 
      className='grid grid-rows-[40px,1fr,30px] w-dvvw h-dvh overflow-hidden rounded-xl bg-white'
    >
        <Header />
        <Content />
        <Footer />
    </main>
    </ConfigProvider>
  )
}
