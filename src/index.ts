import PaymentPanel from './payment-panel'
import type { PaymentMethod, SelectionSection, SelectionItem, FieldMapping, PaymentPanelConfig } from './types'

// Build-time variable to control global mount (replaced by rollup plugin)
declare const __ENABLE_GLOBAL_MOUNT__: boolean | undefined

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
const pypjs = {
  /**
   * Open payment panel
   * @param {number | string} [amount] - Payment amount, optional
   * @throws {Error} If string cannot be converted to number
   * @author Brid9e
   */
  open(amount?: number | string) {
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
   * @param {number | string} amount - Payment amount
   * @throws {Error} If string cannot be converted to number
   * @author Brid9e
   */
  setAmount(amount: number | string) {
    getInstance().setAmount(amount)
  },

  /**
   * Set selection sections
   * @param {SelectionSection[]} [sections] - Selection sections array
   * @param {FieldMapping} [fieldMapping] - Field mapping configuration for custom field names
   * @author Brid9e
   */
  setSelectionSections(sections?: SelectionSection[], fieldMapping?: FieldMapping) {
    getInstance().setSelectionSections(sections, fieldMapping)
  },

  /**
   * Set payment methods list (legacy)
   * @deprecated Use setSelectionSections instead
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
   * Set whether to allow confirm without selections
   * Sets whether to allow password input and confirm buttons when no selections are available
   * @param {boolean} allow - Whether to allow confirm without selections
   * @author Brid9e
   */
  setAllowConfirmWithoutSelections(allow: boolean) {
    getInstance().setAllowConfirmWithoutSelections(allow)
  },

  /**
   * Set whether to allow confirm without payment methods (legacy)
   * @deprecated Use setAllowConfirmWithoutSelections instead
   * @param {boolean} allow - Whether to allow confirm without payment methods
   * @author Brid9e
   */
  setAllowConfirmWithoutMethods(allow: boolean) {
    getInstance().setAllowConfirmWithoutMethods(allow)
  },

  /**
   * Set whether to hide selection sections
   * Sets whether to hide selection sections, only show amount and confirm button/password input
   * @param {boolean} hide - Whether to hide selection sections
   * @author Brid9e
   */
  setHideSelections(hide: boolean) {
    getInstance().setHideSelections(hide)
  },

  /**
   * Set whether to hide payment methods section (legacy)
   * @deprecated Use setHideSelections instead
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
   * Set keyboard character mapping
   * Sets custom character mapping for password keyboard (0-9)
   * @param {string[]} mapping - Array of 10 strings corresponding to digits 0-9
   * @throws {Error} If mapping array length is not 10
   * @author Brid9e
   */
  setKeyboardMapping(mapping: string[]) {
    getInstance().setKeyboardMapping(mapping)
  },

  /**
   * Listen to events (auto-deduplication, same handler will only be added once)
   * @param {'confirm' | 'close'} event - Event name
   * @param {(e: CustomEvent) => void} handler - Event handler function
   * @author Brid9e
   */
  on(event: 'confirm' | 'close', handler: (e: CustomEvent) => void) {
    const instance = getInstance()
    // Remove first to avoid duplicate addition
    instance.removeEventListener(event, handler as EventListener)
    // Then add
    instance.addEventListener(event, handler as EventListener)
  },

  /**
   * Remove event listener
   * @param {'confirm' | 'close'} event - Event name
   * @param {(e: CustomEvent) => void} handler - Event handler function
   * @author Brid9e
   */
  off(event: 'confirm' | 'close', handler: (e: CustomEvent) => void) {
    getInstance().removeEventListener(event, handler as EventListener)
  },

  /**
   * Remove all event listeners
   * @param {'confirm' | 'close'} [event] - Event name, if not specified removes all event listeners
   * @author Brid9e
   */
  removeAllListeners(event?: 'confirm' | 'close') {
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

// Mount to global (only for UMD build, not for ESM)
// ESM builds should use import/export, not global variables
if (typeof window !== 'undefined' && (typeof __ENABLE_GLOBAL_MOUNT__ === 'undefined' || __ENABLE_GLOBAL_MOUNT__ !== false)) {
  (window as any).pypjs = pypjs
}

// Export
export type { PaymentMethod, SelectionSection, SelectionItem, FieldMapping, PaymentPanelConfig } from './types'
export default pypjs
