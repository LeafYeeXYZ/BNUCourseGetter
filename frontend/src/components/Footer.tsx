import { Link } from './Link'
import { useZustand } from '../libs/useZustand'
import { useMemo } from 'react'
import { LoadingOutlined, CloseOutlined, CheckOutlined } from '@ant-design/icons'

export function Footer() {

  const { browserStatus } = useZustand()
  const icon = useMemo(() => {
    switch (browserStatus) {
      case '已安装':
        return <CheckOutlined />
      case '安装中':
        return <LoadingOutlined />
      default:
        return <CloseOutlined />
    }
  }, [browserStatus])

  return (
    <footer
      className='w-full h-full grid grid-cols-[7.5rem,1fr,7.5rem] bg-rose-50'
    >

      <p
        className='w-full h-full pl-4 flex items-center justify-start text-xs font-bold'
      >
        浏览器: {browserStatus} {icon}
      </p>

      <p
        className='w-full h-full flex items-center justify-center text-xs font-bold bg-[#fff9fa]'
      >
        本软件开源免费, 使用前请在 <Link href='https://github.com/LeafYeeXYZ/BNUCourseGetter'><span>Github</span></Link> 上阅读使用说明并下载最新版本
      </p>
      
      <p
        className='w-full h-full pr-4 flex items-center justify-end text-xs font-bold'
      >
        <Link href='https://www.leafyee.xyz'
        ><span>作者: 小叶子</span></Link>
      </p>

    </footer>
  )
  
}