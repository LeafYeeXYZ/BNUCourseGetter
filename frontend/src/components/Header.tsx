import '../styles/Header.css'
import { 
  WindowMinimise,
  WindowToggleMaximise,
  Quit,
  WindowReload,
  Hide,
  Show,
} from '../wailsjs/runtime/runtime'
import { Dialog } from '../wailsjs/go/main/App'
import { 
  CloseOutlined,
  ExpandOutlined,
  MinusOutlined,
  RedoOutlined,
} from '@ant-design/icons'

interface HeaderProps {
  systemStatus: string
}

export function Header({ systemStatus }: HeaderProps ) {

  return (
    <header 
      id="header"
      style={{
        '--wails-draggable': 'drag',
      } as React.CSSProperties}
      onDoubleClick={() => WindowToggleMaximise()}
    >

      <p
        className='header-title'
      >
        小鸦抢课 - {systemStatus}
      </p>

      <button
        className='header-reload'
        onClick={() => {
          Dialog('question', '确定要刷新窗口吗 (oﾟvﾟ)/')
          .then(res => {
            if (res === 'Yes') {
              Hide()
              WindowReload()
              Show()
            }
          })
        }}
      >
        <RedoOutlined />
      </button>

      <button
        className='header-min'
        onClick={() => WindowMinimise()}
      >
        <MinusOutlined />
      </button>

      <button
        className='header-max'
        onClick={() => WindowToggleMaximise()}
      >
        <ExpandOutlined />
      </button>

      <button
        className='header-close'
        onClick={() => Quit()}
      >
        <CloseOutlined />
      </button>    

    </header>
  )
}