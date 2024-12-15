import './tailwind.css'
import { ConfigProvider, type ConfigProviderProps, Button } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import { InstallBrowser } from './wailsjs/go/main/App'
import { EventsEmit, EventsOn, EventsOff, WindowReload } from './wailsjs/runtime/runtime'
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

  const { setBrowserStatus, setSystemStatus, setCurrentStatus, setImportantStatus, browserStatus } = useZustand()
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
      className='grid grid-rows-[40px,1fr,25px] w-dvvw h-dvh overflow-hidden rounded-xl bg-white'
    >
      <Header />
      {browserStatus === '已安装' ? (
        <Content />
      ) : browserStatus === '安装失败' ? (
        <div className='flex flex-col items-center justify-center'>
          <p className='font-bold mb-6'>
            浏览器安装失败, 请确保网络连接正常并点击下方按钮重试
          </p>
          <Button
            className='border-rose-950'
            onClick={() => {
              WindowReload()
            }}
          >
            重启应用
          </Button>
        </div>
      ) : (
        <div className='flex flex-col items-center justify-center'>
          <p className='text-xl font-bold'>
            <LoadingOutlined className='mr-1 mb-6' /> 加载中
          </p>
          <p className='text-xs opacity-75 mb-1'>
            首次启动时需要在线下载浏览器, 请耐心等待
          </p>
          <p className='text-xs opacity-75'>
            如果长时间无响应, 请检查网络连接并重启应用
          </p>
        </div>
      )}
      <Footer />
    </main>
    </ConfigProvider>
  )
}
