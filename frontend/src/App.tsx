import './styles/App.css'
import {
  LoadingOutlined,
  CloseOutlined,
  CheckOutlined,
} from '@ant-design/icons'

import { InstallBrowser } from '../wailsjs/go/main/App'
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

  return (
    <main id="container">

      <Header />

      <Content 
        browserStatus={browserStatus}
      />

      <Footer 
        browserStatus={browserStatus}
      />

    </main>
  )
}

export default App
