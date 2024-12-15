import { create } from 'zustand'
import type { SystemStatus, BrowserStatus } from './types'

export const useZustand = create<GlobalState>()((set) => ({
  disabled: false,
  setDisabled: (disabled) => set({ disabled }),
  currentStatus: [],
  setCurrentStatus: (updater) => {
    set((state) => {
      return { currentStatus: updater(state.currentStatus) }
    })
  },
  importantStatus: [],
  setImportantStatus: (updater) => {
    set((state) => {
      return { importantStatus: updater(state.importantStatus) }
    })
  },
  systemStatus: '加载中',
  setSystemStatus: (systemStatus) => set({ systemStatus }),
  browserStatus: '安装中',
  setBrowserStatus: (browserStatus) => set({ browserStatus }),
}))

type GlobalState = {
  /**
   * 当前事件日志
   */
  currentStatus: string[]
  /**
   * 设置当前事件日志
   * @param updater 更新器
   */
  setCurrentStatus: (updater: (prev: string[]) => string[]) => void
  /**
   * 重要事件日志
   */
  importantStatus: string[]
  /**
   * 设置重要事件日志
   * @param updater 更新器
   */
  setImportantStatus: (updater: (prev: string[]) => string[]) => void
  /**
   * 系统状态
   */
  systemStatus: SystemStatus
  /**
   * 设置系统状态
   * @param systemStatus 系统状态
   */
  setSystemStatus: (systemStatus: SystemStatus) => void
  /**
   * 浏览器状态
   */
  browserStatus: BrowserStatus
  /**
   * 设置浏览器状态
   * @param browserStatus 浏览器状态
   */
  setBrowserStatus: (browserStatus: BrowserStatus) => void
  /**
   * 是否禁用各种按钮等
   */
  disabled: boolean
  /**
   * 设置是否禁用各种按钮等
   * @param disabled 是否禁用
   */
  setDisabled: (disabled: boolean) => void
}
