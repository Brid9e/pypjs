import PaymentPanel from './payment-panel'

// 全局注册（可选）
declare global {
  interface HTMLElementTagNameMap {
    'payment-panel': PaymentPanel
  }
}

// 只使用默认导出，避免混合导出警告
export default PaymentPanel
