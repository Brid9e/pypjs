import PaymentPanel from './payment-panel'
import type { PaymentMethod, FieldMapping, PaymentPanelConfig } from './types'

// Ensure custom element is registered
if (typeof window !== 'undefined' && !customElements.get('payment-panel')) {
  customElements.define('payment-panel', PaymentPanel)
}

// Global registration (optional)
declare global {
  interface HTMLElementTagNameMap {
    'payment-panel': PaymentPanel
  }
}

// Global singleton instance
let globalInstance: PaymentPanel | null = null

/**
 * Get or create global instance
 * Returns the global singleton instance of payment panel
 * @returns {PaymentPanel} Payment panel instance
 * @author Brid9e
 */
function getInstance(): PaymentPanel {
  if (!globalInstance) {
    // Ensure custom element is registered
    if (typeof window !== 'undefined' && !customElements.get('payment-panel')) {
      customElements.define('payment-panel', PaymentPanel)
    }

    // Ensure DOM is ready
    if (document.body) {
      globalInstance = document.createElement('payment-panel') as PaymentPanel
      document.body.appendChild(globalInstance)
    } else {
      // If body is not ready, wait for DOMContentLoaded
      throw new Error('PaymentPanel: document.body is not ready. Please wait for DOMContentLoaded.')
    }
  }
  return globalInstance
}

/**
 * Global API
 * Provides global access interface for payment panel
 * @author Brid9e
 */
const PaymentPanelAPI = {
  /**
   * Open payment panel
   * @param {number} [amount] - Payment amount, optional
   * @author Brid9e
   */
  open(amount?: number) {
    getInstance().open(amount)
  },

  /**
   * Close payment panel
   * @author Brid9e
   */
  close() {
    getInstance().close()
  },

  /**
   * Set amount
   * @param {number} amount - Payment amount
   * @author Brid9e
   */
  setAmount(amount: number) {
    getInstance().setAmount(amount)
  },

  /**
   * Set payment methods list
   * @param {PaymentMethod[]} [methods] - Payment methods list, uses default list if empty
   * @param {FieldMapping} [fieldMapping] - Field mapping configuration for custom field names
   * @author Brid9e
   */
  setPaymentMethods(methods?: PaymentMethod[], fieldMapping?: FieldMapping) {
    getInstance().setPaymentMethods(methods, fieldMapping)
  },

  /**
   * Get selected payment method
   * @returns {PaymentMethod | null} Currently selected payment method, returns null if none selected
   * @author Brid9e
   */
  getSelectedMethod(): PaymentMethod | null {
    return getInstance().getSelectedMethod()
  },

  /**
   * Set close threshold (pixels)
   * @param {number} threshold - Close threshold (pixels)
   * @author Brid9e
   */
  setCloseThreshold(threshold: number) {
    getInstance().setCloseThreshold(threshold)
  },

  /**
   * Set close threshold (percentage)
   * @param {number} percent - Close threshold (0-1)
   * @author Brid9e
   */
  setCloseThresholdPercent(percent: number) {
    getInstance().setCloseThresholdPercent(percent)
  },

  /**
   * Set velocity threshold (pixels/ms)
   * @param {number} threshold - Velocity threshold (pixels/ms)
   * @author Brid9e
   */
  setVelocityThreshold(threshold: number) {
    getInstance().setVelocityThreshold(threshold)
  },

  /**
   * Set whether clicking overlay closes panel
   * @param {boolean} close - Whether to allow closing by clicking overlay
   * @author Brid9e
   */
  setCloseOnOverlayClick(close: boolean) {
    getInstance().setCloseOnOverlayClick(close)
  },

  /**
   * Set whether to enable password input
   * @param {boolean} enable - Whether to enable password input
   * @author Brid9e
   */
  setEnablePassword(enable: boolean) {
    getInstance().setEnablePassword(enable)
  },

  /**
   * Set password length
   * @param {number} length - Password length (4-12)
   * @author Brid9e
   */
  setPasswordLength(length: number) {
    getInstance().setPasswordLength(length)
  },

  /**
   * Unified configuration method
   * @param {PaymentPanelConfig} config - Configuration object
   * @author Brid9e
   */
  setConfig(config: PaymentPanelConfig) {
    getInstance().setConfig(config)
  },

  /**
   * Set header title (optional, defaults to i18n text based on language)
   * @param {string} [title] - Title text, if not provided will use i18n text
   * @author Brid9e
   */
  setHeaderTitle(title?: string) {
    getInstance().setHeaderTitle(title)
  },

  /**
   * Set amount label (optional, defaults to i18n text based on language)
   * @param {string} [label] - Amount label text, if not provided will use i18n text
   * @author Brid9e
   */
  setAmountLabel(label?: string) {
    getInstance().setAmountLabel(label)
  },

  /**
   * Set theme
   * @param {PaymentPanelConfig['theme']} theme - Theme configuration object
   * @author Brid9e
   */
  setTheme(theme: PaymentPanelConfig['theme']) {
    getInstance().setTheme(theme)
  },

  /**
   * Get current theme
   * @returns {PaymentPanelConfig['theme']} Current theme configuration object
   * @author Brid9e
   */
  getTheme(): PaymentPanelConfig['theme'] {
    return getInstance().getTheme()
  },

  /**
   * Reset to default configuration
   * @author Brid9e
   */
  resetConfig() {
    getInstance().resetConfig()
  },

  /**
   * Set whether to allow confirm without payment methods
   * Sets whether to allow password input and confirm buttons when no payment methods are available
   * @param {boolean} allow - Whether to allow confirm without payment methods
   * @author Brid9e
   */
  setAllowConfirmWithoutMethods(allow: boolean) {
    getInstance().setAllowConfirmWithoutMethods(allow)
  },

  /**
   * Set whether to hide payment methods section
   * Sets whether to hide payment methods section, only show amount and confirm button/password input
   * @param {boolean} hide - Whether to hide payment methods section
   * @author Brid9e
   */
  setHidePaymentMethods(hide: boolean) {
    getInstance().setHidePaymentMethods(hide)
  },

  /**
   * Set amount alignment
   * Sets the text alignment for amount section
   * @param {'left' | 'center' | 'right'} align - Alignment direction
   * @author Brid9e
   */
  setAmountAlign(align: 'left' | 'center' | 'right') {
    getInstance().setAmountAlign(align)
  },

  /**
   * Set amount font
   * Sets the font family for amount value
   * @param {string} font - Font family string, e.g. "Arial, sans-serif"
   * @author Brid9e
   */
  setAmountFont(font: string) {
    getInstance().setAmountFont(font)
  },

  /**
   * Set text font
   * Sets the font family for other text elements
   * @param {string} font - Font family string, e.g. "Arial, sans-serif"
   * @author Brid9e
   */
  setTextFont(font: string) {
    getInstance().setTextFont(font)
  },

  /**
   * Set language
   * Sets the language for i18n texts
   * @param {'zh' | 'en' | 'ja' | 'ru'} lang - Language code
   * @author Brid9e
   */
  setLanguage(lang: 'zh' | 'en' | 'ja' | 'ru') {
    getInstance().setLanguage(lang)
  },

  /**
   * Set custom i18n texts
   * Sets custom i18n texts to override default translations, partial override supported
   * @param {Partial<{headerTitle: string, amountLabel: string, paymentMethodsTitle: string, passwordLabel: string, cancelButton: string, confirmButton: string, emptyStateText: string, closeAriaLabel: string}>} i18n - Custom i18n texts object
   * @author Brid9e
   */
  setI18n(i18n: Partial<{
    headerTitle: string
    amountLabel: string
    paymentMethodsTitle: string
    passwordLabel: string
    cancelButton: string
    confirmButton: string
    emptyStateText: string
    closeAriaLabel: string
  }>) {
    getInstance().setI18n(i18n)
  },

  /**
   * Set theme mode
   * Sets the theme mode: 'light', 'dark', or 'auto' (follow system)
   * @param {('light' | 'dark' | 'auto')} mode - Theme mode
   * @author Brid9e
   */
  setThemeMode(mode: 'light' | 'dark' | 'auto') {
    getInstance().setThemeMode(mode)
  },

  /**
   * Listen to events (auto-deduplication, same handler will only be added once)
   * @param {'payment-confirm' | 'payment-close'} event - Event name
   * @param {(e: CustomEvent) => void} handler - Event handler function
   * @author Brid9e
   */
  on(event: 'payment-confirm' | 'payment-close', handler: (e: CustomEvent) => void) {
    const instance = getInstance()
    // Remove first to avoid duplicate addition
    instance.removeEventListener(event, handler as EventListener)
    // Then add
    instance.addEventListener(event, handler as EventListener)
  },

  /**
   * Remove event listener
   * @param {'payment-confirm' | 'payment-close'} event - Event name
   * @param {(e: CustomEvent) => void} handler - Event handler function
   * @author Brid9e
   */
  off(event: 'payment-confirm' | 'payment-close', handler: (e: CustomEvent) => void) {
    getInstance().removeEventListener(event, handler as EventListener)
  },

  /**
   * Remove all event listeners
   * @param {'payment-confirm' | 'payment-close'} [event] - Event name, if not specified removes all event listeners
   * @author Brid9e
   */
  removeAllListeners(event?: 'payment-confirm' | 'payment-close') {
    const instance = getInstance()
    if (event) {
      // Clone element to remove all listeners (simple method)
      const newElement = instance.cloneNode(true) as PaymentPanel
      if (instance.parentNode) {
        instance.parentNode.replaceChild(newElement, instance)
        // Re-initialize
        if (globalInstance === instance) {
          globalInstance = newElement
        }
      }
    } else {
      // Remove all event listeners
      const newElement = instance.cloneNode(true) as PaymentPanel
      if (instance.parentNode) {
        instance.parentNode.replaceChild(newElement, instance)
        if (globalInstance === instance) {
          globalInstance = newElement
        }
      }
    }
  }
}

// Mount to global
if (typeof window !== 'undefined') {
  (window as any).pypjs = PaymentPanelAPI
}

// Export
export { PaymentPanelAPI }
export type { PaymentMethod, FieldMapping, PaymentPanelConfig } from './types'
export default PaymentPanelAPI
