import { BrowserOpenURL } from '../wailsjs/runtime/runtime'
import { ExportOutlined } from '@ant-design/icons'

export function Footer() {

  return (
    <footer
      className='w-full h-full bg-rose-50 flex items-center justify-center text-xs font-bold'
    >
      <span>
        本软件开源免费, 使用前请阅读使用说明并在 
      </span>
      <a
        id='github'
        className='px-1'
        style={{ cursor: 'pointer' }}
        onClick={e => {
          e.preventDefault()
          BrowserOpenURL('https://github.com/LeafYeeXYZ/BNUCourseGetter')
        }}
      >
        Github <ExportOutlined />
      </a>
      <span>
        上下载最新版本
      </span>
    </footer>
  )
}