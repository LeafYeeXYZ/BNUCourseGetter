import '../styles/Footer.css'
import { BrowserStatus } from '../App'
import { Link } from './Link'

interface FooterProps {
  browserStatus: BrowserStatus
}

export function Footer({ browserStatus }: FooterProps) {

  return (
    <footer
      id='footer'
    >

      <p
        className='footer-browser'
      >
        <span>浏览器: {browserStatus.status} {browserStatus.icon}</span>
      </p>

      <p
        className='footer-status'
      >
        <span>本软件开源免费, 使用前请在 <Link href='https://github.com/LeafYeeXYZ/BNUCourseGetter'><span>Github</span></Link> 上阅读使用说明并下载最新版本</span>
      </p>
      
      <p
        className='footer-info'
      >
        <Link href='https://www.leafyee.xyz'
        ><span>作者: 小叶子</span></Link>
      </p>

    </footer>
  )
  
}