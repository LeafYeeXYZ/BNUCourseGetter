import { GetTimetable } from '../wailsjs/go/main/App'
import { useState } from 'react'
import './styles/App.css'

function App() {

  const [status, setStatus] = useState<string>('空闲')

  function timetable() {
    const studentID = prompt("Enter your student ID")
    const password = prompt("Enter your password")
    const isBusy = confirm("Are system busy?")
    if (!studentID || !password) {
      alert("Please enter your student ID and password")
      return
    }

    setStatus('获取中...(首次运行会下载chromium, 可能需要较长时间, 请耐心等待)')

    GetTimetable(studentID, password, isBusy)
      .then(() => {
        setStatus('空闲')
        alert('课程表截图已保存')
      })
      .catch((e: Error) => {
        alert(`Error: ${e.message}; 请尝试以管理员身份运行程序`)
      })
  }

  return (
    <main id="container">
      <button onClick={timetable}>获取课程表并保存截图</button>
      <p>Status: {status}</p>
    </main>
  )
}

export default App
