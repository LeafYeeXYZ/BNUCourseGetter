import '../styles/Content.css'
import { BrowserStatus } from '../App'
import { GetTimetable } from '../../wailsjs/go/main/App'
import { useRef } from 'react'

interface ContentProps {
  browserStatus: BrowserStatus
}

export function Content({ browserStatus }: ContentProps) {

  // 引用
  const usernameRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const buttonRef = useRef<HTMLInputElement>(null)

  // 获取课表
  function handleGetTimetable(browserStatus: BrowserStatus) {
    if (browserStatus.status === '安装中') {
      alert('请等待浏览器安装完成 (首次启动耗时较长)')
      return
    } else if (browserStatus.status === '安装失败') {
      alert('浏览器安装失败, 请检查网络连接并重启应用')
      return
    }
    const username = usernameRef.current?.value
    const password = passwordRef.current?.value
    if (!username || !password) {
      alert('请输入学号和密码')
      return
    }
    buttonRef.current?.setAttribute('disabled', 'disabled')
    buttonRef.current?.setAttribute('value', '正在获取课表...')
    GetTimetable(username, password, false)
      .then(() => {
        alert('获取课表成功, 截图已保存至当前目录')
        buttonRef.current?.removeAttribute('disabled')
        buttonRef.current?.setAttribute('value', '获取课表截图')
      })
      .catch(e => {
        alert(`获取课表失败: ${e}`)
        buttonRef.current?.removeAttribute('disabled')
        buttonRef.current?.setAttribute('value', '获取课表截图')
      })
  }

  return (
    <div
      id='content'
    >

      <h3>以下为测试功能</h3>

      <input type="text" placeholder='学号' ref={usernameRef} />
      <input type="password" placeholder='密码' ref={passwordRef} />
      <input type="button" value='获取课表截图' onClick={e => {
        e.preventDefault()
        handleGetTimetable(browserStatus)
      }} ref={buttonRef} />

    </div>
  )
}