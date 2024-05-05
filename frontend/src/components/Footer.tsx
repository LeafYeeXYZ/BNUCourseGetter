import '../styles/Footer.css'
import { BrowserStatus } from '../App'
import { BrowserOpenURL } from '../../wailsjs/runtime/runtime'
import { ExportOutlined } from '@ant-design/icons'

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
        <span>浏览器状态: </span>
        <span>{browserStatus.status} {browserStatus.icon}</span>
      </p>

      <p></p>
      
      <p
        className='footer-info'
      >
        <a
          className='footer-github'
          onClick={e => {
            e.preventDefault()
            BrowserOpenURL('https://github.com/LeafYeeXYZ/BNUCourseGetter')
          }}
        >作者: 小叶子 <ExportOutlined /></a>
      </p>

    </footer>
  )
  
}