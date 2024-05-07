import { BrowserOpenURL } from '../wailsjs/runtime/runtime'
import { ExportOutlined } from '@ant-design/icons'

interface LinkProps {
  href: string
  children: React.ReactNode
  className?: string
}

export function Link({ href, children, className }: LinkProps) {
  return (
    <a
      style={{ cursor: 'pointer' }}
      className={className}
      onClick={e => {
        e.preventDefault()
        BrowserOpenURL(href)
      }}
    >{children} <ExportOutlined /></a>
  )
}