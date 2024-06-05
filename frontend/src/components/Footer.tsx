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
        <span>小鸦抢课开源免费, 欢迎在 <Link href='https://github.com/LeafYeeXYZ/BNUCourseGetter'><span>Github</span></Link> 上关注和参与本项目!</span>
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