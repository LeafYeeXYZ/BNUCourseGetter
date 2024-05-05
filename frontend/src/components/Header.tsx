import '../styles/Header.css'
import { 
  WindowMinimise,
  WindowToggleMaximise,
  Quit,
} from '../../wailsjs/runtime/runtime'
import { 
  CloseOutlined,
  ExpandOutlined,
  MinusOutlined,
} from '@ant-design/icons'

export function Header() {

  return (
    <header 
      id="header"
      style={{
        '--wails-draggable': 'drag',
      } as React.CSSProperties}
    >

      <p
        className='header-title'
      >
        小鸦抢课
      </p>

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