import type { PaymentMethod, SelectionSection, SelectionItem, FieldMapping, PaymentPanelConfig } from './types'
import { getI18nTexts, type Language, type I18nTexts } from './i18n'

/**
 * Default configuration
 * Default configuration values for the payment panel
 * @author Brid9e
 */
const DEFAULT_CONFIG: Required<Omit<PaymentPanelConfig, 'theme' | 'headerTitle' | 'amountLabel' | 'emptyStateText' | 'i18n'>> = {
  allowSwipeToClose: true,
  closeThreshold: 100,
  closeThresholdPercent: 0.3,
  velocityThreshold: 0.5,
  closeOnOverlayClick: true,
  enablePassword: false,
  passwordLength: 6,
  iconDisplay: 'always',
  autoCloseOnConfirm: false,
  allowConfirmWithoutSelections: true,
  hideSelections: false,
  amountAlign: 'left',
  amountFont: '',
  textFont: '',
  language: 'en',
  themeMode: 'auto',
  keyboardMapping: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
}

/**
 * Payment Panel Component
 * A mobile payment panel component based on Web Components, supporting drag-to-close, password input, theme customization, and more
 * @author Brid9e
 */
class PaymentPanel extends HTMLElement {
  private shadow: ShadowRoot
  private isOpen: boolean = false
  private overlay: HTMLElement | null = null
  private panel: HTMLElement | null = null

  // Drag-related properties
  private isDragging: boolean = false
  private startY: number = 0
  private currentY: number = 0
  private startTime: number = 0
  private lastY: number = 0
  private lastTime: number = 0
  private velocity: number = 0

  // Configuration properties (initialized with default values)
  private allowSwipeToClose: boolean = DEFAULT_CONFIG.allowSwipeToClose
  private closeThreshold: number = DEFAULT_CONFIG.closeThreshold
  private closeThresholdPercent: number = DEFAULT_CONFIG.closeThresholdPercent
  private velocityThreshold: number = DEFAULT_CONFIG.velocityThreshold
  private closeOnOverlayClick: boolean = DEFAULT_CONFIG.closeOnOverlayClick
  private enablePassword: boolean = DEFAULT_CONFIG.enablePassword
  private passwordLength: number = DEFAULT_CONFIG.passwordLength
  private currentPassword: string = '' // Currently entered password
  private headerTitle?: string // Optional, defaults to i18n text
  private amountLabel?: string // Optional, defaults to i18n text
  private iconDisplay: 'always' | 'never' | 'auto' = DEFAULT_CONFIG.iconDisplay
  private emptyStateText?: string // Optional, defaults to i18n text
  private autoCloseOnConfirm: boolean = DEFAULT_CONFIG.autoCloseOnConfirm
  private allowConfirmWithoutMethods: boolean = DEFAULT_CONFIG.allowConfirmWithoutSelections // Legacy, use new config value
  private allowConfirmWithoutSelections: boolean = DEFAULT_CONFIG.allowConfirmWithoutSelections
  private hidePaymentMethods: boolean = DEFAULT_CONFIG.hideSelections // Legacy, use new config value
  private hideSelections: boolean = DEFAULT_CONFIG.hideSelections
  private amountAlign: 'left' | 'center' | 'right' = DEFAULT_CONFIG.amountAlign
  private amountFont: string = DEFAULT_CONFIG.amountFont
  private textFont: string = DEFAULT_CONFIG.textFont
  private language: Language = DEFAULT_CONFIG.language as Language
  private customI18n?: Partial<I18nTexts> // Custom i18n texts to override defaults
  private themeMode: 'light' | 'dark' | 'auto' = DEFAULT_CONFIG.themeMode as 'light' | 'dark' | 'auto'
  private systemThemeListener: ((e: MediaQueryListEvent) => void) | null = null // System theme change listener
  private keyboardMapping: string[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] // Keyboard character mapping for 0-9

  // Theme configuration
  private theme: PaymentPanelConfig['theme'] = {}

  /**
   * Default payment methods list
   * @author Brid9e
   */
  private static readonly DEFAULT_PAYMENT_METHODS: PaymentMethod[] = []

  /**
   * Default field mapping configuration
   * @author Brid9e
   */
  private static readonly DEFAULT_FIELD_MAPPING: FieldMapping = {
    titleField: 'title',
    subtitleField: 'subtitle',
    iconField: 'icon',
    valueField: 'value'
  }

  // Selection sections configuration
  private selectionSections: SelectionSection[] = []
  private fieldMapping: FieldMapping = {}
  private selectedItems: Map<number, SelectionItem[]> = new Map() // Map of section index to selected items
  private hasCustomSelections: boolean = false // Flag indicating whether custom selections have been set

  // Legacy support for paymentMethods
  private paymentMethods: PaymentMethod[] = []
  private selectedMethod: PaymentMethod | null = null
  private hasCustomPaymentMethods: boolean = false // Flag indicating whether custom payment methods have been set
  private expandedGroups: Set<number> = new Set() // Expanded group indices
  private loadedChildren: Map<number, PaymentMethod[]> = new Map() // Cache for lazy-loaded children
  private loadingGroups: Set<number> = new Set() // Groups that are currently loading

  /**
   * Constructor
   * Initializes the payment panel component, creates Shadow DOM and sets default payment methods
   * @author Brid9e
   */
  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
    this.isOpen = false

    // Initialize with empty selections
    this.selectionSections = []
    this.paymentMethods = [...PaymentPanel.DEFAULT_PAYMENT_METHODS]
    this.fieldMapping = { ...PaymentPanel.DEFAULT_FIELD_MAPPING }
    this.selectedItems = new Map()
    this.selectedMethod = null
  }

  /**
   * Static attribute observer for listening to attribute changes
   * Returns an array of attribute names to observe
   * @returns {string[]} Array of attribute names to observe
   * @author Brid9e
   */
  static get observedAttributes() {
    return ['close-threshold', 'close-threshold-percent', 'velocity-threshold', 'close-on-overlay-click', 'enable-password', 'password-length']
  }

  /**
   * Attribute change callback
   * Triggered when attributes defined in observedAttributes change
   * @param {string} name - Attribute name
   * @param {string} oldValue - Old value
   * @param {string} newValue - New value
   * @author Brid9e
   */
  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return

    switch (name) {
      case 'close-threshold':
        this.closeThreshold = parseFloat(newValue) || 100
        break
      case 'close-threshold-percent':
        this.closeThresholdPercent = parseFloat(newValue) || 0.3
        break
      case 'velocity-threshold':
        this.velocityThreshold = parseFloat(newValue) || 0.5
        break
      case 'close-on-overlay-click':
        this.closeOnOverlayClick = newValue !== 'false'
        break
      case 'enable-password':
        this.enablePassword = newValue !== 'false'
        break
      case 'password-length':
        this.passwordLength = parseInt(newValue) || 6
        break
    }
  }

  /**
   * Called when element is connected to DOM
   * Initializes component, reads attribute values, renders UI, sets up event listeners
   * @author Brid9e
   */
  connectedCallback() {
    // Read attribute values
    const closeThreshold = this.getAttribute('close-threshold')
    if (closeThreshold) {
      this.closeThreshold = parseFloat(closeThreshold) || 100
    }

    const closeThresholdPercent = this.getAttribute('close-threshold-percent')
    if (closeThresholdPercent) {
      this.closeThresholdPercent = parseFloat(closeThresholdPercent) || 0.3
    }

    const velocityThreshold = this.getAttribute('velocity-threshold')
    if (velocityThreshold) {
      this.velocityThreshold = parseFloat(velocityThreshold) || 0.5
    }

    this.render()
    this.setupEventListeners()
    this.updateThemeMode()

    // Initialize password input (after render)
    this.initPasswordInput()
    this.updatePasswordUI()
    this.updateSelectionSectionsVisibility()
    this.updateAmountStyles()
    this.updateI18nTexts()
    this.updateDragHandleVisibility()
  }

  /**
   * Called when element is disconnected from DOM
   * Cleans up event listeners
   * @author Brid9e
   */
  disconnectedCallback() {
    this.removeEventListeners()
    // Clean up system theme listener
    if (this.systemThemeListener) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.removeEventListener('change', this.systemThemeListener)
      this.systemThemeListener = null
    }
  }

  /**
   * Update theme mode
   * Updates the component's theme based on themeMode configuration
   * @author Brid9e
   */
  private updateThemeMode() {
    // Remove existing listener if any
    if (this.systemThemeListener) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.removeEventListener('change', this.systemThemeListener)
      this.systemThemeListener = null
    }

    const root = this.shadow.host

    if (this.themeMode === 'auto') {
      // Follow system theme
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      this.applyTheme(mediaQuery.matches)

      // Listen to system theme changes
      this.systemThemeListener = (e: MediaQueryListEvent) => {
        this.applyTheme(e.matches)
      }
      mediaQuery.addEventListener('change', this.systemThemeListener)
    } else if (this.themeMode === 'dark') {
      // Force dark mode
      this.applyTheme(true)
    } else {
      // Force light mode (default)
      this.applyTheme(false)
    }
  }

  /**
   * Apply theme
   * Sets the component's data-theme attribute
   * @param {boolean} isDark - Whether it's dark mode
   * @author Brid9e
   */
  private applyTheme(isDark: boolean) {
    const root = this.shadow.host
    if (isDark) {
      root.setAttribute('data-theme', 'dark')
    } else {
      root.setAttribute('data-theme', 'light')
    }
  }

  /**
   * Render component
   * Generates component HTML structure and styles, applies theme configuration
   * @author Brid9e
   */
  private render() {
    // Get theme color values, use defaults if not set
    const primaryColor = this.theme?.primaryColor || '#238636'
    const primaryHoverColor = this.theme?.primaryHoverColor || '#2ea043'
    const overlayColor = this.theme?.overlayColor || 'rgba(0, 0, 0, 0.5)'
    const panelBgLight = this.theme?.panelBgLight || '#ffffff'
    const panelBgDark = this.theme?.panelBgDark || '#2d2d2d'
    const textPrimaryLight = this.theme?.textPrimaryLight || '#24292f'
    const textPrimaryDark = this.theme?.textPrimaryDark || '#e0e0e0'
    const textSecondaryLight = this.theme?.textSecondaryLight || '#57606a'
    const textSecondaryDark = this.theme?.textSecondaryDark || '#999999'

    this.shadow.innerHTML = `
      <style>
        :host {
          --bg-overlay: ${overlayColor};
          --bg-panel-light: ${panelBgLight};
          --bg-panel-dark: ${panelBgDark};
          --bg-header-light: #f6f8fa;
          --bg-header-dark: #333333;
          --bg-button-primary-light: ${primaryColor};
          --bg-button-primary-dark: ${primaryColor};
          --bg-button-primary-hover-light: ${primaryHoverColor};
          --bg-button-primary-hover-dark: ${primaryHoverColor};
          --bg-button-secondary-light: #f6f8fa;
          --bg-button-secondary-dark: #333333;
          --bg-button-secondary-hover-light: #f3f4f6;
          --bg-button-secondary-hover-dark: #404040;
          --text-primary-light: ${textPrimaryLight};
          --text-primary-dark: ${textPrimaryDark};
          --text-secondary-light: ${textSecondaryLight};
          --text-secondary-dark: ${textSecondaryDark};
          --border-light: #d0d7de;
          --border-dark: #4d4d4d;
          --shadow-light: rgba(0, 0, 0, 0.1);
          --shadow-dark: rgba(0, 0, 0, 0.3);
        }

        :host([data-theme="dark"]) {
          --bg-overlay: ${overlayColor.includes('rgba')
            ? overlayColor.replace(/[\d.]+(?=\))/, (match) => {
                const opacity = parseFloat(match)
                return String(Math.min(1, opacity + 0.2))
              })
            : 'rgba(0, 0, 0, 0.7)'};
        }

        .overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: var(--bg-overlay);
          z-index: 9998;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s ease, visibility 0.3s ease;
        }

        .overlay.show {
          opacity: 1;
          visibility: visible;
        }

        .panel {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: var(--bg-panel-light);
          border-top-left-radius: 16px;
          border-top-right-radius: 16px;
          box-shadow: 0 -4px 20px var(--shadow-light);
          z-index: 9999;
          transform: translateY(100%);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          touch-action: none;
          overflow: hidden;
        }

        .panel-close-btn {
          position: absolute;
          top: 12px;
          left: 12px;
          width: 24px;
          height: 24px;
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          touch-action: manipulation;
          opacity: 0.7;
          transition: opacity 0.2s ease;
        }

        .panel-close-btn:hover {
          opacity: 1;
        }

        .panel-close-btn svg {
          width: 100%;
          height: 100%;
        }

        .panel-close-btn svg path {
          stroke: var(--text-secondary-light);
        }

        :host([data-theme="dark"]) .panel-close-btn svg path {
          stroke: #ffffff;
        }

        .panel-close-btn:hover svg path {
          stroke: var(--text-primary-light);
        }

        :host([data-theme="dark"]) .panel-close-btn:hover svg path {
          stroke: #ffffff;
        }

        :host([data-theme="dark"]) .panel {
          background: var(--bg-panel-dark);
          box-shadow: 0 -4px 20px var(--shadow-dark);
        }

        .panel.show {
          transform: translateY(0);
        }

        .panel.dragging {
          transition: none;
        }

        .drag-handle {
          width: 40px;
          height: 4px;
          background-color: var(--border-light);
          border-radius: 2px;
          margin: 12px auto;
          cursor: grab;
          touch-action: none;
          user-select: none;
          transition: opacity 0.2s ease;
        }

        .drag-handle:active {
          cursor: grabbing;
        }

        .drag-handle.hidden {
          display: none;
        }

        :host([data-theme="dark"]) .drag-handle {
          background-color: var(--border-dark);
        }

        .header {
          padding: 16px 20px;
          background-color: transparent;
          border-top-left-radius: 16px;
          border-top-right-radius: 16px;
          touch-action: none;
          user-select: none;
        }

        :host([data-theme="dark"]) .header {
          background-color: transparent;
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .header-title {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary-light);
          margin: 0;
          text-align: center;
        }

        :host([data-theme="dark"]) .header-title {
          color: var(--text-primary-dark);
        }

        .content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          padding: 20px;
          min-height: 0;
        }

        .amount-section {
          margin-bottom: 24px;
          flex-shrink: 0;
        }

        .amount-label {
          font-size: 14px;
          color: var(--text-secondary-light);
          margin-bottom: 8px;
        }

        :host([data-theme="dark"]) .amount-label {
          color: var(--text-secondary-dark);
        }

        .amount-value {
          font-size: 48px;
          font-weight: 700;
          color: var(--text-primary-light);
        }

        .amount-section[data-align="left"] {
          text-align: left;
        }

        .amount-section[data-align="center"] {
          text-align: center;
        }

        .amount-section[data-align="right"] {
          text-align: right;
        }

        .amount-value .currency-symbol {
          font-size: 32px;
          vertical-align: baseline;
          margin-right: 4px;
        }

        :host([data-theme="dark"]) .amount-value {
          color: var(--text-primary-dark);
        }

        .selection-sections {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow: hidden;
        }

        .selection-sections-container {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          touch-action: pan-y;
          -webkit-overflow-scrolling: touch;
          min-height: 0;
          /* Hide scrollbar */
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }

        .selection-sections-container::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }

        .selection-section {
          margin-bottom: 20px;
        }

        .selection-section:last-child {
          margin-bottom: 0;
        }

        .selection-section-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary-light);
          margin-bottom: 12px;
          flex-shrink: 0;
        }

        :host([data-theme="dark"]) .selection-section-title {
          color: var(--text-primary-dark);
        }

        .selection-sections-empty {
          text-align: center;
          padding: 40px 20px;
          color: var(--text-secondary-light);
          font-size: 14px;
        }

        :host([data-theme="dark"]) .selection-sections-empty {
          color: var(--text-secondary-dark);
        }

        .selection-item {
          display: flex;
          align-items: center;
          padding: 10px 12px;
          border: 1px solid var(--border-light);
          border-radius: 8px;
          margin-bottom: 6px;
          cursor: pointer;
          transition: background-color 0.2s ease, border-color 0.2s ease;
          outline: none;
          -webkit-tap-highlight-color: transparent;
        }

        .selection-item:active {
          background-color: var(--bg-button-secondary-hover-light);
        }

        :host([data-theme="dark"]) .selection-item:active {
          background-color: var(--bg-button-secondary-hover-dark);
        }

        :host([data-theme="dark"]) .selection-item {
          border-color: var(--border-dark);
        }

        .selection-item:hover {
          background-color: var(--bg-button-secondary-hover-light);
        }

        :host([data-theme="dark"]) .selection-item:hover {
          background-color: var(--bg-button-secondary-hover-dark);
        }

        .selection-item.selected {
          border-color: var(--bg-button-primary-light);
          background-color: var(--bg-button-secondary-hover-light);
        }

        :host([data-theme="dark"]) .selection-item.selected {
          border-color: var(--bg-button-primary-dark);
          background-color: var(--bg-button-secondary-hover-dark);
        }

        .selection-icon {
          width: 28px;
          height: 28px;
          margin-right: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
          border-radius: 4px;
          overflow: hidden;
          background-color: var(--bg-button-secondary-light);
        }

        :host([data-theme="dark"]) .selection-icon {
          background-color: var(--bg-button-secondary-dark);
        }

        .selection-icon.hidden {
          display: none;
        }

        .selection-icon img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .selection-icon .icon-text {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary-light);
        }

        :host([data-theme="dark"]) .selection-icon .icon-text {
          color: var(--text-primary-dark);
        }

        .selection-icon .icon-default {
          width: 16px;
          height: 16px;
          opacity: 0.6;
        }

        .selection-icon .icon-default path {
          fill: var(--text-secondary-light);
        }

        :host([data-theme="dark"]) .selection-icon .icon-default path {
          fill: var(--text-secondary-dark);
        }

        .selection-info {
          flex: 1;
        }

        .selection-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary-light);
          margin-bottom: 2px;
        }

        :host([data-theme="dark"]) .selection-name {
          color: var(--text-primary-dark);
        }

        .selection-desc {
          font-size: 11px;
          color: var(--text-secondary-light);
        }

        :host([data-theme="dark"]) .selection-desc {
          color: var(--text-secondary-dark);
        }

        .selection-radio {
          width: 20px;
          height: 20px;
          position: relative;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .selection-item.selected .selection-radio {
          opacity: 1;
        }

        .selection-radio svg {
          width: 20px;
          height: 20px;
        }

        .selection-radio svg path {
          stroke: ${primaryColor};
          stroke-width: 2.5;
          stroke-linecap: round;
          stroke-linejoin: round;
          fill: none;
        }

        .selection-checkbox {
          width: 18px;
          height: 18px;
          border: 2px solid var(--border-light);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        :host([data-theme="dark"]) .selection-checkbox {
          border-color: var(--border-dark);
        }

        .selection-item.selected .selection-checkbox {
          background-color: ${primaryColor};
          border-color: ${primaryColor};
        }

        .selection-checkbox svg {
          width: 12px;
          height: 12px;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .selection-item.selected .selection-checkbox svg {
          opacity: 1;
        }

        .selection-checkbox svg path {
          stroke: #ffffff;
          stroke-width: 2.5;
          stroke-linecap: round;
          stroke-linejoin: round;
          fill: none;
        }

        /* Legacy support for payment-method classes */
        .payment-method-group {
          margin-bottom: 8px;
        }

        .payment-method-group-header {
          display: flex;
          align-items: center;
          padding: 10px 12px;
          border: 1px solid var(--border-light);
          border-radius: 8px;
          margin-bottom: 6px;
          cursor: pointer;
          transition: background-color 0.2s ease, border-color 0.2s ease;
          outline: none;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
        }

        :host([data-theme="dark"]) .payment-method-group-header {
          border-color: var(--border-dark);
        }

        .payment-method-group-header:hover {
          background-color: var(--bg-button-secondary-hover-light);
        }

        :host([data-theme="dark"]) .payment-method-group-header:hover {
          background-color: var(--bg-button-secondary-hover-dark);
        }

        .payment-method-group-header .payment-name {
          font-weight: 600;
        }

        .payment-method-group-children {
          padding-left: 12px;
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease;
        }

        .payment-method-group.expanded .payment-method-group-children {
          max-height: 2000px;
        }

        .payment-method-group-arrow {
          width: 20px;
          height: 20px;
          margin-left: auto;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s ease;
        }

        .payment-method-group.expanded .payment-method-group-arrow {
          transform: rotate(90deg);
        }

        .payment-method-group-arrow svg {
          width: 16px;
          height: 16px;
        }

        .payment-method-group-arrow svg path {
          stroke: var(--text-secondary-light);
          stroke-width: 2;
        }

        :host([data-theme="dark"]) .payment-method-group-arrow svg path {
          stroke: var(--text-secondary-dark);
        }

        .arrow-loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid var(--border-light);
          border-top-color: var(--primary-color);
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        :host([data-theme="dark"]) .arrow-loading-spinner {
          border-color: var(--border-dark);
          border-top-color: var(--primary-color);
        }

        .payment-method-group.loading .payment-method-group-header {
          cursor: wait;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .payment-method {
          display: flex;
          align-items: center;
          padding: 10px 12px;
          border: 1px solid var(--border-light);
          border-radius: 8px;
          margin-bottom: 6px;
          cursor: pointer;
          transition: background-color 0.2s ease, border-color 0.2s ease;
          outline: none;
          -webkit-tap-highlight-color: transparent;
        }

        .payment-method:active {
          background-color: var(--bg-button-secondary-hover-light);
        }

        :host([data-theme="dark"]) .payment-method:active {
          background-color: var(--bg-button-secondary-hover-dark);
        }

        :host([data-theme="dark"]) .payment-method {
          border-color: var(--border-dark);
        }

        .payment-method:hover {
          background-color: var(--bg-button-secondary-hover-light);
        }

        :host([data-theme="dark"]) .payment-method:hover {
          background-color: var(--bg-button-secondary-hover-dark);
        }

        .payment-method.selected {
          border-color: var(--bg-button-primary-light);
          background-color: var(--bg-button-secondary-hover-light);
        }

        :host([data-theme="dark"]) .payment-method.selected {
          border-color: var(--bg-button-primary-dark);
          background-color: var(--bg-button-secondary-hover-dark);
        }

        .payment-icon {
          width: 28px;
          height: 28px;
          margin-right: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
          border-radius: 4px;
          overflow: hidden;
          background-color: var(--bg-button-secondary-light);
        }

        :host([data-theme="dark"]) .payment-icon {
          background-color: var(--bg-button-secondary-dark);
        }

        .payment-icon.hidden {
          display: none;
        }

        .payment-icon img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .payment-icon .icon-text {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary-light);
        }

        :host([data-theme="dark"]) .payment-icon .icon-text {
          color: var(--text-primary-dark);
        }

        .payment-icon .icon-default {
          width: 16px;
          height: 16px;
          opacity: 0.6;
        }

        .payment-icon .icon-default path {
          fill: var(--text-secondary-light);
        }

        :host([data-theme="dark"]) .payment-icon .icon-default path {
          fill: var(--text-secondary-dark);
        }

        .payment-info {
          flex: 1;
        }

        .payment-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary-light);
          margin-bottom: 2px;
        }

        :host([data-theme="dark"]) .payment-name {
          color: var(--text-primary-dark);
        }

        .payment-desc {
          font-size: 11px;
          color: var(--text-secondary-light);
        }

        :host([data-theme="dark"]) .payment-desc {
          color: var(--text-secondary-dark);
        }

        .payment-radio {
          width: 20px;
          height: 20px;
          position: relative;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .payment-method.selected .payment-radio {
          opacity: 1;
        }

        .payment-radio svg {
          width: 20px;
          height: 20px;
        }

        .payment-radio svg path {
          stroke: ${primaryColor};
          stroke-width: 2.5;
          stroke-linecap: round;
          stroke-linejoin: round;
          fill: none;
        }

        .actions {
          padding: 16px 20px;
          background: transparent;
          display: flex;
          gap: 12px;
        }

        .btn {
          flex: 1;
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s ease;
          outline: none;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
        }

        .btn-secondary {
          background-color: var(--bg-button-secondary-light);
          color: var(--text-primary-light);
        }

        :host([data-theme="dark"]) .btn-secondary {
          background-color: var(--bg-button-secondary-dark);
          color: var(--text-primary-dark);
        }

        .btn-secondary:hover {
          background-color: var(--bg-button-secondary-hover-light);
        }

        :host([data-theme="dark"]) .btn-secondary:hover {
          background-color: var(--bg-button-secondary-hover-dark);
        }

        .btn-primary {
          background-color: var(--bg-button-primary-light);
          color: #ffffff;
        }

        .btn-primary:hover {
          background-color: var(--bg-button-primary-hover-light);
        }

        :host([data-theme="dark"]) .btn-primary {
          background-color: var(--bg-button-primary-dark);
          color: #ffffff;
        }

        :host([data-theme="dark"]) .btn-primary:hover {
          background-color: var(--bg-button-primary-hover-dark);
        }

        .password-section {
          margin-top: 24px;
        }

        .password-label {
          font-size: 14px;
          color: var(--text-secondary-light);
          margin-bottom: 16px;
          text-align: center;
        }

        :host([data-theme="dark"]) .password-label {
          color: var(--text-secondary-dark);
        }

        .password-input-container {
          display: flex;
          justify-content: center;
          margin-bottom: 24px;
        }

        .password-dots {
          display: flex;
          gap: 12px;
        }

        .password-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid var(--border-light);
          background-color: transparent;
          transition: all 0.2s ease;
        }

        :host([data-theme="dark"]) .password-dot {
          border-color: var(--border-dark);
        }

        .password-dot.filled {
          background-color: var(--text-primary-light);
          border-color: var(--text-primary-light);
        }

        :host([data-theme="dark"]) .password-dot.filled {
          background-color: var(--text-primary-dark);
          border-color: var(--text-primary-dark);
        }

        .keyboard {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 0 20px 20px;
          width: 100%;
          box-sizing: border-box;
        }

        .keyboard-row {
          display: flex;
          gap: 12px;
          width: 100%;
        }

        .keyboard-key {
          flex: 1;
          height: 50px;
          border: none;
          border-radius: 8px;
          background-color: var(--bg-button-secondary-light);
          color: var(--text-primary-light);
          font-size: 20px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          touch-action: manipulation;
          user-select: none;
          min-width: 0;
          box-sizing: border-box;
          padding: 0;
          outline: none;
          -webkit-tap-highlight-color: transparent;
        }

        :host([data-theme="dark"]) .keyboard-key {
          background-color: var(--bg-button-secondary-dark);
          color: var(--text-primary-dark);
        }

        .keyboard-key:active {
          background-color: var(--bg-button-secondary-hover-light);
          transform: scale(0.95);
        }

        :host([data-theme="dark"]) .keyboard-key:active {
          background-color: var(--bg-button-secondary-hover-dark);
        }

        .keyboard-key-empty {
          border: 1px solid transparent;
          background-color: transparent;
          cursor: default;
        }

        .keyboard-key-empty:active {
          transform: none;
        }

        .keyboard-key-delete {
          padding: 0;
        }

        .keyboard-key-delete svg {
          width: 20px;
          height: 20px;
        }

        .keyboard-key-delete svg path {
          stroke: var(--text-primary-light);
        }

        :host([data-theme="dark"]) .keyboard-key-delete svg path {
          stroke: var(--text-primary-dark);
        }

        @media (max-width: 480px) {
          .panel {
            max-height: 92vh;
          }
        }
      </style>
      <div class="overlay"></div>
      <div class="panel">
        <button class="panel-close-btn" id="closeBtn" aria-label="${getI18nTexts(this.language, this.customI18n).closeAriaLabel}">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div class="drag-handle"></div>
        <div class="header">
          <div class="header-content">
            <h3 class="header-title" id="headerTitle">${getI18nTexts(this.language, this.customI18n).headerTitle}</h3>
          </div>
        </div>
        <div class="content">
          <div class="amount-section">
            <div class="amount-label">${this.amountLabel || getI18nTexts(this.language, this.customI18n).amountLabel}</div>
            <div class="amount-value"><span class="currency-symbol">¥</span><span id="amount">0.00</span></div>
          </div>
          <div class="selection-sections">
            <div class="selection-sections-container">
              <div id="selection-sections-list"></div>
            </div>
          </div>
          <div class="password-section" id="passwordSection" style="display: none;">
            <div class="password-label">${getI18nTexts(this.language, this.customI18n).passwordLabel}</div>
            <div class="password-input-container">
              <div class="password-dots" id="passwordDots"></div>
            </div>
            <div class="keyboard" id="keyboard">
              <div class="keyboard-row">
                <button class="keyboard-key" data-key="1">1</button>
                <button class="keyboard-key" data-key="2">2</button>
                <button class="keyboard-key" data-key="3">3</button>
              </div>
              <div class="keyboard-row">
                <button class="keyboard-key" data-key="4">4</button>
                <button class="keyboard-key" data-key="5">5</button>
                <button class="keyboard-key" data-key="6">6</button>
              </div>
              <div class="keyboard-row">
                <button class="keyboard-key" data-key="7">7</button>
                <button class="keyboard-key" data-key="8">8</button>
                <button class="keyboard-key" data-key="9">9</button>
              </div>
              <div class="keyboard-row">
                <button class="keyboard-key keyboard-key-empty"></button>
                <button class="keyboard-key" data-key="0">0</button>
                <button class="keyboard-key keyboard-key-delete" id="deleteKey">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M18 9l-6 6M12 9l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="actions" id="actions">
          <button class="btn btn-secondary" id="cancelBtn">${getI18nTexts(this.language, this.customI18n).cancelButton}</button>
          <button class="btn btn-primary" id="confirmBtn">${getI18nTexts(this.language, this.customI18n).confirmButton}</button>
        </div>
      </div>
    `

    this.overlay = this.shadow.querySelector('.overlay')
    this.panel = this.shadow.querySelector('.panel')

    // Render selection sections
    this.renderSelectionSections()
  }

  /**
   * Initialize password input
   * Renders password dots and sets up keyboard event listeners
   * @author Brid9e
   */
  private initPasswordInput() {
    this.renderPasswordDots()
    this.setupKeyboardListeners()
  }

  /**
   * Render password dots
   * Renders password dots based on current password length
   * @author Brid9e
   */
  private renderPasswordDots() {
    const container = this.shadow.querySelector('#passwordDots')
    if (!container) return

    container.innerHTML = ''
    for (let i = 0; i < this.passwordLength; i++) {
      const dot = document.createElement('div')
      dot.className = 'password-dot'
      if (i < this.currentPassword.length) {
        dot.classList.add('filled')
      }
      container.appendChild(dot)
    }
  }

  /**
   * Setup keyboard event listeners
   * Adds click event handlers for number keys and delete key
   * @author Brid9e
   */
  private setupKeyboardListeners() {
    const keyboard = this.shadow.querySelector('#keyboard')
    if (!keyboard) return

    // Number keys
    const numberKeys = keyboard.querySelectorAll('.keyboard-key[data-key]')
    numberKeys.forEach(key => {
      key.addEventListener('click', () => {
        const digit = key.getAttribute('data-key')
        if (digit && this.currentPassword.length < this.passwordLength) {
          // Use mapped value from keyboardMapping, fallback to original digit if mapping not available
          const digitIndex = parseInt(digit, 10)
          const mappedValue = this.keyboardMapping[digitIndex] || digit
          this.currentPassword += mappedValue
          this.renderPasswordDots()
          this.checkPasswordComplete()
        }
      })
    })

    // Delete key
    const deleteKey = this.shadow.querySelector('#deleteKey')
    if (deleteKey) {
      deleteKey.addEventListener('click', () => {
        if (this.currentPassword.length > 0) {
          this.currentPassword = this.currentPassword.slice(0, -1)
          this.renderPasswordDots()
        }
      })
    }
  }

  /**
   * Confirm payment
   * Gets selected item and amount, triggers confirmation event
   * @param {string} [password] - Payment password, optional
   * @author Brid9e
   */
  private confirmPayment(password?: string) {
    // Check if selections exist
    const hasSelections = (this.selectionSections && this.selectionSections.length > 0) ||
                          (this.paymentMethods && this.paymentMethods.length > 0)

    // If no selections and allowConfirmWithoutSelections is false, prevent execution
    const allowConfirm = this.allowConfirmWithoutSelections

    if (!hasSelections && !allowConfirm) {
      return
    }

    const amount = this.shadow.querySelector('#amount')?.textContent || '0.00'
    const valueField = this.fieldMapping.valueField || 'value'

    // Build selections result for new API
    const selections: any = {}
    const selectionsData: any = {}

    if (this.selectionSections && this.selectionSections.length > 0) {
      this.selectionSections.forEach((section, index) => {
        // Use custom key if provided, otherwise use numeric index
        const sectionKey = section.key !== undefined ? section.key : index
        const selectedInSection = this.selectedItems.get(index) || []

        if (selectedInSection.length > 0) {
          const values = selectedInSection.map(item => {
            let value = item[valueField]
            if (value === undefined) {
              value = item.value || item.id || item
            }
            return value
          })

          // For single selection, return single value; for multiple, return array
          selections[sectionKey] = section.multiple ? values : values[0]
          selectionsData[sectionKey] = section.multiple ? selectedInSection : selectedInSection[0]
        }
      })
    }

    // Legacy support: get first selected item for backward compatibility
    let legacySelection: any = null
    let legacySelectionData: any = null

    if (this.selectedItems.size > 0) {
      const firstSectionItems = this.selectedItems.get(0)
      if (firstSectionItems && firstSectionItems.length > 0) {
        legacySelectionData = firstSectionItems[0]
        legacySelection = legacySelectionData[valueField]
        if (legacySelection === undefined) {
          legacySelection = legacySelectionData.value || legacySelectionData.id || legacySelectionData
        }
      }
    } else if (this.selectedMethod) {
      // Fallback to legacy payment method
      legacySelectionData = this.selectedMethod
      legacySelection = legacySelectionData[valueField]
      if (legacySelection === undefined) {
        legacySelection = legacySelectionData.value || legacySelectionData.id || legacySelectionData
      }
    }

    // Build event detail
    const detail: any = {
      selections,           // New: all selections grouped by section title
      selectionsData,       // New: all selection data grouped by section title
      amount,
      // Legacy support
      selection: legacySelection,
      selectionData: legacySelectionData,
      method: legacySelection,
      methodData: legacySelectionData
    }

    // Add password to detail if provided
    if (password !== undefined) {
      detail.password = password
    }

    // Dispatch confirmation event
    this.dispatchEvent(
      new CustomEvent('confirm', {
        detail,
        bubbles: true,
        composed: true
      })
    )

    // Auto-close based on configuration
    if (this.autoCloseOnConfirm) {
      this.close()
    }
  }

  /**
   * Check if password input is complete
   * When password length reaches the set value, triggers payment confirmation event and closes panel based on configuration
   * @author Brid9e
   */
  private checkPasswordComplete() {
    if (this.currentPassword.length === this.passwordLength) {
      // Password input complete, trigger payment confirmation
      this.confirmPayment(this.currentPassword)

      // Reset password
      this.currentPassword = ''
      this.renderPasswordDots()
    }
  }

  /**
   * Update password input UI
   * Shows/hides password input area and action buttons based on whether password input is enabled
   * Also considers whether selections exist and allowConfirmWithoutSelections configuration
   * @author Brid9e
   */
  private updatePasswordUI() {
    const passwordSection = this.shadow.querySelector('#passwordSection') as HTMLElement
    const actions = this.shadow.querySelector('#actions') as HTMLElement

    // Check if selections exist
    const hasSelections = (this.selectionSections && this.selectionSections.length > 0) ||
                          (this.paymentMethods && this.paymentMethods.length > 0)

    // Use allowConfirmWithoutSelections (which may have been set via legacy method)
    const allowConfirm = this.allowConfirmWithoutSelections

    // If no selections and allowConfirm is false, hide both
    if (!hasSelections && !allowConfirm) {
      if (passwordSection) {
        passwordSection.style.display = 'none'
      }
      if (actions) {
        actions.style.display = 'none'
      }
      return
    }

    if (this.enablePassword) {
      if (passwordSection) {
        passwordSection.style.display = 'block'
      }
      if (actions) {
        actions.style.display = 'none'
      }
    } else {
      if (passwordSection) {
        passwordSection.style.display = 'none'
      }
      if (actions) {
        actions.style.display = 'flex'
      }
    }
  }

  /**
   * Render icon HTML
   * Renders different icons based on iconDisplay configuration and icon type
   * @param {string} icon - Icon value (could be image URL or string)
   * @returns {string} Icon HTML string
   * @author Brid9e
   */
  private renderIcon(icon: string): string {
    // Determine whether to show icon
    const shouldShowIcon = () => {
      if (this.iconDisplay === 'never') return false
      if (this.iconDisplay === 'always') return true
      // auto mode: show if icon value exists
      return !!icon
    }

    if (!shouldShowIcon()) {
      return '<div class="payment-icon hidden"></div>'
    }

    // If no icon value, don't show in auto mode
    if (!icon && this.iconDisplay === 'auto') {
      return '<div class="payment-icon hidden"></div>'
    }

    // Determine if it's an image URL (simple check: starts with http:// or https://, or contains .jpg/.png/.svg etc.)
    const isImageUrl = (str: string): boolean => {
      return /^(https?:\/\/|data:image|\.(jpg|jpeg|png|gif|svg|webp|bmp))/i.test(str.trim())
    }

    const defaultIconSvg = `
      <svg class="icon-default" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
      </svg>
    `

    if (isImageUrl(icon)) {
      // Image URL: use img tag with error handling
      const uniqueId = `icon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      return `
        <div class="payment-icon" data-icon-id="${uniqueId}" data-icon-type="image">
          <img src="${icon.replace(/"/g, '&quot;')}" alt="" data-icon-fallback="${uniqueId}" />
        </div>
      `
    } else if (icon) {
      // String: determine if it's emoji or short string
      const trimmedIcon = icon.trim()
      // If length <= 2, likely emoji, display full string
      // If length > 2, take first character (use Array.from to properly handle multi-byte characters)
      const displayText = trimmedIcon.length <= 2
        ? trimmedIcon
        : Array.from(trimmedIcon)[0] || trimmedIcon.charAt(0) || ''
      return `
        <div class="payment-icon">
          <span class="icon-text">${displayText}</span>
        </div>
      `
    } else {
      // No icon value: show default SVG
      return `
        <div class="payment-icon">
          ${defaultIconSvg}
        </div>
      `
    }
  }

  /**
   * Update selection sections visibility
   * Shows/hides selection sections based on hideSelections configuration
   * @author Brid9e
   */
  private updateSelectionSectionsVisibility() {
    const selectionsSection = this.shadow.querySelector('.selection-sections') as HTMLElement
    if (selectionsSection) {
      selectionsSection.style.display = this.hideSelections ? 'none' : ''
    }
  }

  /**
   * Update payment methods section visibility (legacy)
   * @deprecated Use updateSelectionSectionsVisibility instead
   * @author Brid9e
   */
  private updatePaymentMethodsVisibility() {
    this.updateSelectionSectionsVisibility()
  }

  /**
   * Render selection sections
   * Renders multiple custom selection sections with their titles and items
   * @author Brid9e
   */
  private renderSelectionSections() {
    // If using legacy paymentMethods, render that instead
    if (this.paymentMethods && this.paymentMethods.length > 0) {
      this.renderPaymentMethods()
      return
    }

    const container = this.shadow.querySelector('#selection-sections-list')
    if (!container) return

    // Update visibility first
    this.updateSelectionSectionsVisibility()

    // If selection sections are hidden, don't render content
    if (this.hideSelections) {
      return
    }

    // If selection sections are empty, show empty state
    if (!this.selectionSections || this.selectionSections.length === 0) {
      const emptyText = this.emptyStateText || getI18nTexts(this.language, this.customI18n).emptyStateText
      container.innerHTML = `<div class="selection-sections-empty">${emptyText}</div>`
      return
    }

    const titleField = this.fieldMapping.titleField || 'title'
    const subtitleField = this.fieldMapping.subtitleField || 'subtitle'
    const iconField = this.fieldMapping.iconField || 'icon'
    const valueField = this.fieldMapping.valueField || 'value'

    // Helper function to get field value with fallbacks
    const getField = (item: SelectionItem, field: string, fallbacks: string[]) => {
      if (item[field] !== undefined) return item[field]
      for (const fallback of fallbacks) {
        if (item[fallback] !== undefined) return item[fallback]
      }
      return ''
    }

    let globalItemIndex = 0

    container.innerHTML = this.selectionSections
      .map((section, sectionIndex) => {
        const sectionTitle = section.title || ''
        const items = section.items || []

        if (items.length === 0) {
          return '' // Skip empty sections
        }

        const selectedInSection = this.selectedItems.get(sectionIndex) || []

        const isMultiple = section.multiple || false

        const itemsHtml = items
          .map((item, itemIndex) => {
            const value = String(getField(item, valueField, ['value', 'id', 'code']) || globalItemIndex)
            const title = String(getField(item, titleField, ['title', 'name', 'label']) || '')
            const subtitle = String(getField(item, subtitleField, ['subtitle', 'desc', 'description']) || '')
            const icon = String(getField(item, iconField, ['icon', 'emoji']) || '')
            const isSelected = selectedInSection.includes(item)
            const currentIndex = globalItemIndex++

            const selectionIndicator = isMultiple ? `
              <div class="selection-checkbox">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              </div>
            ` : `
              <div class="selection-radio">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              </div>
            `

            return `
              <div class="selection-item ${isSelected ? 'selected' : ''}"
                   data-value="${value}"
                   data-index="${currentIndex}"
                   data-item-index="${itemIndex}"
                   data-section-index="${sectionIndex}">
                ${this.renderIcon(icon).replace('payment-icon', 'selection-icon')}
                <div class="selection-info">
                  <div class="selection-name">${title}</div>
                  ${subtitle ? `<div class="selection-desc">${subtitle}</div>` : ''}
                </div>
                ${selectionIndicator}
              </div>
            `
          })
          .join('')

        const multipleHintText = section.multiple ? (this.language === 'zh' ? '(多选)' : this.language === 'ja' ? '(複数選択)' : this.language === 'ru' ? '(Множественный)' : '(Multiple)') : ''
        const multipleHint = section.multiple ? ` <span style="font-size: 12px; color: var(--text-secondary-light); font-weight: normal;">${multipleHintText}</span>` : ''

        return `
          <div class="selection-section" data-section-index="${sectionIndex}">
            <div class="selection-section-title">${sectionTitle}${multipleHint}</div>
            ${itemsHtml}
          </div>
        `
      })
      .join('')

    // Setup image load error handling
    const defaultIconSvg = `
      <svg class="icon-default" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
      </svg>
    `
    container.querySelectorAll('img[data-icon-fallback]').forEach(img => {
      img.addEventListener('error', () => {
        const iconContainer = img.closest('.selection-icon[data-icon-type="image"]') as HTMLElement
        if (iconContainer) {
          iconContainer.innerHTML = defaultIconSvg
          iconContainer.removeAttribute('data-icon-type')
        }
      })
    })
  }

  /**
   * Render payment methods list (legacy)
   * Supports regular list and two-level grouped list, handles expand/collapse functionality
   * @deprecated Use renderSelectionSections instead
   * @author Brid9e
   */
  private renderPaymentMethods() {
    // Use the same container as selection sections for backward compatibility
    const container = this.shadow.querySelector('#selection-sections-list')
    if (!container) return

    // Update visibility first
    this.updatePaymentMethodsVisibility()

    // If payment methods section is hidden, don't render content
    if (this.hidePaymentMethods) {
      return
    }

    // If payment methods are empty, show empty state
    if (!this.paymentMethods || this.paymentMethods.length === 0) {
      const emptyText = this.emptyStateText || getI18nTexts(this.language, this.customI18n).emptyStateText
      container.innerHTML = `<div class="selection-sections-empty">${emptyText}</div>`
      return
    }

    const titleField = this.fieldMapping.titleField || 'title'
    const subtitleField = this.fieldMapping.subtitleField || 'subtitle'
    const iconField = this.fieldMapping.iconField || 'icon'
    const valueField = this.fieldMapping.valueField || 'value'

    // If specified field not found, try common field names
    const getField = (item: PaymentMethod, field: string, fallbacks: string[]) => {
      if (item[field] !== undefined) return item[field]
      for (const fallback of fallbacks) {
        if (item[fallback] !== undefined) return item[fallback]
      }
      return ''
    }

    // Flatten all payment methods (including children) for finding selected item
    const flattenMethods = (methods: PaymentMethod[], isTopLevel: boolean = false): PaymentMethod[] => {
      const result: PaymentMethod[] = []
      methods.forEach((method, index) => {
        // Only check loadedChildren for top-level items
        let childrenToFlatten: PaymentMethod[] | null = null

        if (isTopLevel && method.children) {
          // Top level: check cache or direct array
          const loadedChildren = this.loadedChildren.get(index)
          childrenToFlatten = loadedChildren || (Array.isArray(method.children) ? method.children : null)
        } else if (!isTopLevel && method.children && Array.isArray(method.children)) {
          // Nested level: only use direct array
          childrenToFlatten = method.children
        }

        if (childrenToFlatten && childrenToFlatten.length > 0) {
          // Recursively flatten children (pass false for nested levels)
          result.push(...flattenMethods(childrenToFlatten, false))
        } else if (!method.children) {
          // Only include if it's a leaf node (no children property)
          result.push(method)
        }
        // If children is Promise and not loaded, skip it
      })
      return result
    }

    const allMethods = flattenMethods(this.paymentMethods, true)
    let itemIndex = 0

    container.innerHTML = this.paymentMethods
      .map((method, groupIndex) => {
        // Check if has children (array or Promise)
        if (method.children) {
          // Group mode
          const title = String(getField(method, titleField, ['title', 'name', 'label']) || '')
          const isExpanded = this.expandedGroups.has(groupIndex)

          // Check if children is already loaded (from cache or direct array)
          const loadedChildren = this.loadedChildren.get(groupIndex)
          const isChildrenArray = Array.isArray(method.children)
          const childrenToRender: PaymentMethod[] | null = loadedChildren || (isChildrenArray ? method.children as PaymentMethod[] : null)

          let childrenHtml = ''
          if (childrenToRender && childrenToRender.length > 0) {
            childrenHtml = childrenToRender
              .map((child: PaymentMethod) => {
                const value = String(getField(child, valueField, ['value', 'id', 'code']) || itemIndex)
                const childTitle = String(getField(child, titleField, ['title', 'name', 'label']) || '')
                const childSubtitle = String(getField(child, subtitleField, ['subtitle', 'desc', 'description']) || '')
                const icon = String(getField(child, iconField, ['icon', 'emoji']) || '')
                const isSelected = this.selectedMethod === child
                const currentIndex = itemIndex++

                return `
                  <div class="payment-method ${isSelected ? 'selected' : ''}" data-method="${value}" data-index="${currentIndex}" data-group-index="${groupIndex}">
                    ${this.renderIcon(icon)}
                    <div class="payment-info">
                      <div class="payment-name">${childTitle}</div>
                      ${childSubtitle ? `<div class="payment-desc">${childSubtitle}</div>` : ''}
                    </div>
                    <div class="payment-radio">
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                    </div>
                  </div>
                `
              })
              .join('')
          }

          // Check if this group is currently loading
          const isLoading = this.loadingGroups.has(groupIndex)
          const loadingClass = isLoading ? 'loading' : ''

          return `
            <div class="payment-method-group ${isExpanded ? 'expanded' : ''} ${loadingClass}" data-group-index="${groupIndex}">
              <div class="payment-method-group-header" data-group-header="${groupIndex}">
                <div class="payment-info">
                  <div class="payment-name">${title}</div>
                </div>
                <div class="payment-method-group-arrow">
                  ${isLoading ? '<div class="arrow-loading-spinner"></div>' : `
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  `}
                </div>
              </div>
              <div class="payment-method-group-children">
                ${childrenHtml}
              </div>
            </div>
          `
        } else {
          // Normal mode
          const value = String(getField(method, valueField, ['value', 'id', 'code']) || itemIndex)
          const title = String(getField(method, titleField, ['title', 'name', 'label']) || '')
          const subtitle = String(getField(method, subtitleField, ['subtitle', 'desc', 'description']) || '')
          const icon = String(getField(method, iconField, ['icon', 'emoji']) || '')
          const isSelected = this.selectedMethod === method || (itemIndex === 0 && !this.selectedMethod)
          const currentIndex = itemIndex++

          return `
            <div class="payment-method ${isSelected ? 'selected' : ''}" data-method="${value}" data-index="${currentIndex}">
              ${this.renderIcon(icon)}
              <div class="payment-info">
                <div class="payment-name">${title}</div>
                ${subtitle ? `<div class="payment-desc">${subtitle}</div>` : ''}
              </div>
              <div class="payment-radio">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              </div>
            </div>
          `
        }
      })
      .join('')

    // Note: Group expand/collapse events are handled by event delegation in setupPaymentMethodGroupEvents()

    // Setup image load error handling
    const defaultIconSvg = `
      <svg class="icon-default" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
      </svg>
    `
    container.querySelectorAll('img[data-icon-fallback]').forEach(img => {
      img.addEventListener('error', () => {
        const iconContainer = img.closest('.payment-icon[data-icon-type="image"]') as HTMLElement
        if (iconContainer) {
          iconContainer.innerHTML = defaultIconSvg
          iconContainer.removeAttribute('data-icon-type')
        }
      })
    })
  }

  /**
   * Setup event listeners
   * Adds event handlers for overlay, close button, confirm/cancel buttons, payment method selection, etc.
   * @author Brid9e
   */
  private setupEventListeners() {
    // Overlay click to close (add based on configuration)
    if (this.overlay && this.closeOnOverlayClick) {
      this.overlay.addEventListener('click', () => {
        this.close()
      })
    }

    // Top-left close button
    const closeBtn = this.shadow.querySelector('#closeBtn')
    if (closeBtn) {
      // Use mousedown and touchstart to ensure it triggers before drag events
      closeBtn.addEventListener('mousedown', (e) => {
        e.stopPropagation()
        e.preventDefault()
        this.close()
      })
      closeBtn.addEventListener('touchstart', (e) => {
        e.stopPropagation()
        e.preventDefault()
        this.close()
      })
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        e.preventDefault()
        this.close()
      })
    }

    // Cancel button
    const cancelBtn = this.shadow.querySelector('#cancelBtn')
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.close()
      })
    }

    // Confirm payment button
    const confirmBtn = this.shadow.querySelector('#confirmBtn')
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        this.confirmPayment()
      })
    }

    // Selection item click handler (use event delegation since list is dynamically generated)
    if (this.panel) {
      this.panel.addEventListener('click', (e) => {
        // Handle new selection-item clicks
        const selectionTarget = (e.target as HTMLElement).closest('.selection-item')
        if (selectionTarget) {
          e.stopPropagation()
          const sectionIndex = parseInt(selectionTarget.getAttribute('data-section-index') || '0')
          const itemIndexInSection = parseInt(selectionTarget.getAttribute('data-item-index') || '0')

          if (this.selectionSections && this.selectionSections[sectionIndex]) {
            const section = this.selectionSections[sectionIndex]
            const item = section.items[itemIndexInSection]

            if (item) {
              const currentSelections = this.selectedItems.get(sectionIndex) || []
              const itemAlreadySelected = currentSelections.includes(item)

              if (section.multiple) {
                // Multiple selection mode
                if (itemAlreadySelected) {
                  // Deselect
                  const newSelections = currentSelections.filter(i => i !== item)
                  this.selectedItems.set(sectionIndex, newSelections)
                } else {
                  // Select
                  this.selectedItems.set(sectionIndex, [...currentSelections, item])
                }
              } else {
                // Single selection mode
                if (itemAlreadySelected) {
                  // Deselect (optional behavior)
                  this.selectedItems.set(sectionIndex, [])
                } else {
                  // Select and clear others in same section
                  this.selectedItems.set(sectionIndex, [item])
                }
              }

              // If selection changed, clear entered password
              if (this.currentPassword.length > 0) {
                this.currentPassword = ''
                this.renderPasswordDots()
              }

              // Re-render to update UI
              this.renderSelectionSections()
            }
          }
          return
        }

        // Handle payment-method-group-header clicks (for lazy loading)
        const groupHeaderTarget = (e.target as HTMLElement).closest('.payment-method-group-header')
        if (groupHeaderTarget) {
          e.stopPropagation()
          const groupIndex = parseInt(groupHeaderTarget.getAttribute('data-group-header') || '0')

          // Ignore clicks when loading
          if (this.loadingGroups.has(groupIndex)) {
            return
          }

          if (this.expandedGroups.has(groupIndex)) {
            // Collapse
            this.expandedGroups.delete(groupIndex)
            this.renderPaymentMethods()
          } else {
            const method = this.paymentMethods[groupIndex]

            if (!method) {
              console.warn('Method not found at index:', groupIndex)
              return
            }

            const isChildrenFunction = typeof method.children === 'function'
            const isChildrenArray = Array.isArray(method.children)
            const needsLoading = method.children && !isChildrenArray && !this.loadedChildren.has(groupIndex)

            console.log('Group click:', groupIndex, 'type:', isChildrenFunction ? 'function' : isChildrenArray ? 'array' : 'promise', 'isLoaded:', this.loadedChildren.has(groupIndex))

            // Check if children needs to be loaded (Promise or Function) and not yet loaded
            if (needsLoading) {
              console.log('Starting async load for group:', groupIndex)
              // Show loading state (don't expand yet)
              this.loadingGroups.add(groupIndex)
              this.renderPaymentMethods()

              // Load children asynchronously
              ;(async () => {
                try {
                  // Get the Promise (either directly or by calling the function)
                  let childrenPromise: Promise<PaymentMethod[]>
                  if (isChildrenFunction) {
                    console.log('Calling function to get promise for group:', groupIndex)
                    childrenPromise = (method.children as (() => Promise<PaymentMethod[]>))()
                  } else {
                    childrenPromise = method.children as Promise<PaymentMethod[]>
                  }

                  console.log('Awaiting promise for group:', groupIndex)
                  const children = await childrenPromise
                  console.log('Loaded children for group:', groupIndex, 'count:', children.length)
                  // Cache the loaded children
                  this.loadedChildren.set(groupIndex, children)
                  // Remove loading state
                  this.loadingGroups.delete(groupIndex)
                  // Now expand the group
                  this.expandedGroups.add(groupIndex)
                  // Re-render with loaded children
                  this.renderPaymentMethods()
                } catch (error) {
                  console.error('Failed to load children for group:', groupIndex, error)
                  // On error, remove loading state
                  this.loadingGroups.delete(groupIndex)
                  this.renderPaymentMethods()
                }
              })()
            } else {
              // Children already loaded or is a direct array, expand immediately
              console.log('Expanding immediately (already loaded or array):', groupIndex)
              this.expandedGroups.add(groupIndex)
              this.renderPaymentMethods()
            }
          }
          return
        }

        // Handle legacy payment-method clicks
        const paymentTarget = (e.target as HTMLElement).closest('.payment-method')
        if (paymentTarget && !paymentTarget.closest('.payment-method-group-header')) {
          e.stopPropagation()
          const index = parseInt(paymentTarget.getAttribute('data-index') || '0')
          const allMethods = this.getAllMethods()
          if (allMethods[index]) {
            // If payment method changed, clear entered password
            if (this.selectedMethod !== allMethods[index] && this.currentPassword.length > 0) {
              this.currentPassword = ''
              this.renderPasswordDots()
            }
            this.selectedMethod = allMethods[index]
            const paymentMethods = this.shadow.querySelectorAll('.payment-method')
            paymentMethods.forEach((m) => m.classList.remove('selected'))
            paymentTarget.classList.add('selected')
          }
        }
      })
    }

    // Prevent panel content click from closing
    if (this.panel) {
      this.panel.addEventListener('click', (e) => {
        e.stopPropagation()
      })
    }

    // Setup drag event listeners
    this.setupDragListeners()
  }

  /**
   * Setup drag event listeners
   * Adds touch and mouse drag events for panel, drag handle, header, etc.
   * @author Brid9e
   */
  private setupDragListeners() {
    if (!this.panel || !this.allowSwipeToClose) return

    const dragHandle = this.shadow.querySelector('.drag-handle')
    const header = this.shadow.querySelector('.header')
    const dragTargets = [dragHandle, header].filter(Boolean) as HTMLElement[]

    // Add event listeners for drag targets and panel
    ;[...dragTargets, this.panel].forEach((element) => {
      // Touch events (mobile)
      element.addEventListener('touchstart', this.handleDragStart.bind(this), {
        passive: false
      })
      element.addEventListener('touchmove', this.handleDragMove.bind(this), {
        passive: false
      })
      element.addEventListener('touchend', this.handleDragEnd.bind(this), {
        passive: false
      })

      // Mouse events (desktop, for testing)
      element.addEventListener('mousedown', this.handleDragStart.bind(this))
    })

    // Global events to ensure tracking continues during drag
    document.addEventListener('touchmove', this.handleDragMove.bind(this), {
      passive: false
    })
    document.addEventListener('touchend', this.handleDragEnd.bind(this))
    document.addEventListener('mousemove', this.handleDragMove.bind(this))
    document.addEventListener('mouseup', this.handleDragEnd.bind(this))
  }

  /**
   * Handle drag start
   * Records drag start position and time, initializes drag state
   * @param {TouchEvent | MouseEvent} e - Touch or mouse event
   * @author Brid9e
   */
  private handleDragStart(e: TouchEvent | MouseEvent) {
    if (!this.isOpen || !this.panel || !this.allowSwipeToClose) return

    // Check if starting from draggable area
    const target = e.target as HTMLElement
    const dragHandle = this.shadow.querySelector('.drag-handle')
    const header = this.shadow.querySelector('.header')
    const content = this.shadow.querySelector('.content')
    const actions = this.shadow.querySelector('.actions')
    const closeBtn = this.shadow.querySelector('#closeBtn')
    const keyboard = this.shadow.querySelector('#keyboard')

    // If clicking close button, don't handle drag
    if (closeBtn?.contains(target) || target.closest('#closeBtn')) {
      return
    }

    // If clicking content area, action buttons area, or keyboard area, allow normal interaction (scroll, click)
    if (content?.contains(target) || actions?.contains(target) || keyboard?.contains(target)) {
      return
    }

    // Can drag from drag handle, header, or other panel areas
    e.preventDefault()
    e.stopPropagation()

    this.isDragging = true
    this.startY = this.getY(e)
    this.currentY = this.startY
    this.startTime = Date.now()
    this.lastY = this.startY
    this.lastTime = this.startTime
    this.velocity = 0

    if (this.panel) {
      this.panel.classList.add('dragging')
    }
  }

  /**
   * Handle drag move
   * Updates panel position, calculates drag velocity, updates overlay opacity
   * @param {TouchEvent | MouseEvent} e - Touch or mouse event
   * @author Brid9e
   */
  private handleDragMove(e: TouchEvent | MouseEvent) {
    if (!this.isDragging || !this.panel) return

    e.preventDefault()
    e.stopPropagation()

    const currentY = this.getY(e)
    const currentTime = Date.now()
    const deltaY = currentY - this.startY

    // Only allow dragging downward
    if (deltaY < 0) return

    // Calculate velocity
    const timeDelta = currentTime - this.lastTime
    if (timeDelta > 0) {
      const distanceDelta = currentY - this.lastY
      this.velocity = Math.abs(distanceDelta) / timeDelta
    }

    this.currentY = currentY
    this.lastY = currentY
    this.lastTime = currentTime

    // Update panel position
    this.panel.style.transform = `translateY(${deltaY}px)`

    // Update overlay opacity
    if (this.overlay) {
      const panelHeight = this.panel.offsetHeight
      const opacity = Math.max(0, 1 - deltaY / panelHeight)
      this.overlay.style.opacity = String(opacity)
    }
  }

  /**
   * Handle drag end
   * Determines whether to close panel or bounce back to original position based on drag distance and velocity
   * @param {TouchEvent | MouseEvent} e - Touch or mouse event
   * @author Brid9e
   */
  private handleDragEnd(e: TouchEvent | MouseEvent) {
    if (!this.isDragging || !this.panel) return

    e.preventDefault()
    e.stopPropagation()

    this.isDragging = false
    this.panel.classList.remove('dragging')

    // Use currentY to get final displacement (touches may be empty in touchend)
    const deltaY = this.currentY - this.startY
    const panelHeight = this.panel.offsetHeight
    const threshold = Math.max(
      this.closeThreshold,
      panelHeight * this.closeThresholdPercent
    )

    // Calculate final velocity direction (direction of last movement)
    const finalVelocity =
      this.lastY !== this.startY
        ? (this.currentY - this.lastY) /
          Math.max(1, this.lastTime - this.startTime)
        : 0

    // Determine whether to close
    // 1. Final displacement exceeds threshold
    // 2. Velocity exceeds threshold AND final velocity is downward (prevent closing after dragging up)
    const shouldClose =
      deltaY > threshold ||
      (this.velocity > this.velocityThreshold &&
        finalVelocity > 0 &&
        deltaY > 0)

    if (shouldClose) {
      this.close()
    } else {
      // Bounce back to original position
      this.panel.style.transform = ''
      if (this.overlay) {
        this.overlay.style.opacity = ''
      }
    }

    // Reset state
    this.startY = 0
    this.currentY = 0
    this.velocity = 0
  }

  /**
   * Get event Y coordinate
   * Compatible with touch events and mouse events
   * @param {TouchEvent | MouseEvent} e - Touch or mouse event
   * @returns {number} Y coordinate value
   * @author Brid9e
   */
  private getY(e: TouchEvent | MouseEvent): number {
    if ('touches' in e && e.touches.length > 0) {
      return e.touches[0].clientY
    } else if ('clientY' in e) {
      return e.clientY
    }
    return 0
  }

  /**
   * Remove event listeners
   * Cleans up all event listeners (currently empty implementation, interface reserved)
   * @author Brid9e
   */
  private removeEventListeners() {
    // Clean up event listeners
  }

  /**
   * Convert amount to number
   * Converts number or string to number, throws error if conversion fails
   * @param {number | string} amount - Amount value
   * @returns {number} Converted number
   * @throws {Error} If string cannot be converted to number
   * @author Brid9e
   */
  private convertAmountToNumber(amount: number | string): number {
    if (typeof amount === 'number') {
      if (isNaN(amount) || !isFinite(amount)) {
        throw new Error(`Invalid amount: ${amount} is not a valid number`)
      }
      return amount
    }

    if (typeof amount === 'string') {
      const trimmed = amount.trim()
      if (trimmed === '') {
        throw new Error('Invalid amount: empty string cannot be converted to number')
      }
      const num = parseFloat(trimmed)
      if (isNaN(num) || !isFinite(num)) {
        throw new Error(`Invalid amount: "${amount}" cannot be converted to number`)
      }
      return num
    }

    throw new Error(`Invalid amount: expected number or string, got ${typeof amount}`)
  }

  /**
   * Open payment panel
   * Shows payment panel, optionally sets payment amount
   * @param {number | string} [amount] - Payment amount, optional
   * @throws {Error} If string cannot be converted to number
   * @author Brid9e
   */
  public open(amount?: number | string) {
    if (this.isOpen) return

    // Each time it opens, if custom selections haven't been set, restore to default (empty array)
    // This prevents previously set selections from affecting subsequent opens
    if (!this.hasCustomSelections && !this.hasCustomPaymentMethods) {
      this.selectionSections = []
      this.paymentMethods = [...PaymentPanel.DEFAULT_PAYMENT_METHODS]
      this.fieldMapping = { ...PaymentPanel.DEFAULT_FIELD_MAPPING }
      this.selectedItems.clear()
      this.selectedMethod = null
      this.renderSelectionSections()
    }
    // After each open, reset flags so next open will use defaults if not set
    this.hasCustomSelections = false
    this.hasCustomPaymentMethods = false

    this.isOpen = true
    document.body.style.overflow = 'hidden'

    if (amount !== undefined) {
      const numAmount = this.convertAmountToNumber(amount)
      const amountElement = this.shadow.querySelector('#amount')
      if (amountElement) {
        amountElement.textContent = numAmount.toFixed(2)
      }
    }

    // Trigger animation
    requestAnimationFrame(() => {
      if (this.overlay) {
        this.overlay.classList.add('show')
      }
      if (this.panel) {
        this.panel.classList.add('show')
      }
    })
  }

  /**
   * Close payment panel
   * Hides payment panel, restores page scrolling, triggers close event
   * @author Brid9e
   */
  public close() {
    if (!this.isOpen) return

    this.isOpen = false
    this.isDragging = false
    document.body.style.overflow = ''

    if (this.overlay) {
      this.overlay.classList.remove('show')
      this.overlay.style.opacity = ''
    }
    if (this.panel) {
      this.panel.classList.remove('show')
      this.panel.classList.remove('dragging')
      this.panel.style.transform = ''
    }

    // Trigger close event
    this.dispatchEvent(
      new CustomEvent('close', {
        bubbles: true,
        composed: true
      })
    )
  }

  /**
   * Set payment amount
   * Updates payment amount displayed in panel
   * @param {number | string} amount - Payment amount
   * @throws {Error} If string cannot be converted to number
   * @author Brid9e
   */
  public setAmount(amount: number | string) {
    const numAmount = this.convertAmountToNumber(amount)
    const amountElement = this.shadow.querySelector('#amount')
    if (amountElement) {
      amountElement.textContent = numAmount.toFixed(2)
    }
  }

  /**
   * Set close threshold (pixels)
   * Sets minimum pixel distance required to close panel by dragging
   * @param {number} threshold - Close threshold (pixels)
   * @author Brid9e
   */
  public setCloseThreshold(threshold: number) {
    this.closeThreshold = threshold
    this.setAttribute('close-threshold', String(threshold))
  }

  /**
   * Set close threshold (percentage)
   * Sets minimum percentage distance required to close panel by dragging (relative to panel height)
   * @param {number} percent - Close threshold (0-1)
   * @author Brid9e
   */
  public setCloseThresholdPercent(percent: number) {
    this.closeThresholdPercent = Math.max(0, Math.min(1, percent))
    this.setAttribute(
      'close-threshold-percent',
      String(this.closeThresholdPercent)
    )
  }

  /**
   * Set velocity threshold (pixels/ms)
   * Sets minimum velocity required to close panel by dragging
   * @param {number} threshold - Velocity threshold (pixels/ms)
   * @author Brid9e
   */
  public setVelocityThreshold(threshold: number) {
    this.velocityThreshold = threshold
    this.setAttribute('velocity-threshold', String(threshold))
  }

  /**
   * Set selection sections
   * Sets custom selection sections with titles and items
   * @param {SelectionSection[]} [sections] - Selection sections array
   * @param {FieldMapping} [fieldMapping] - Field mapping configuration for custom field names
   * @author Brid9e
   */
  public setSelectionSections(sections?: SelectionSection[], fieldMapping?: FieldMapping) {
    // If not provided, use empty array
    if (sections === undefined) {
      this.selectionSections = []
      this.fieldMapping = { ...PaymentPanel.DEFAULT_FIELD_MAPPING }
      this.hasCustomSelections = false
    } else {
      this.selectionSections = sections
      this.fieldMapping = fieldMapping || { ...PaymentPanel.DEFAULT_FIELD_MAPPING }
      this.hasCustomSelections = true
    }

    // Clear legacy payment methods when using new API
    this.paymentMethods = []
    this.hasCustomPaymentMethods = false

    // Reset selected state and set defaults BEFORE rendering
    this.selectedItems.clear()
    if (this.selectionSections.length > 0) {
      const valueField = this.fieldMapping.valueField || 'value'

      // Auto-select for single selection sections
      this.selectionSections.forEach((section, index) => {
        if (!section.multiple && section.items.length > 0) {
          let defaultItem: SelectionItem | null = null

          // If defaultValue is specified, find the matching item
          if (section.defaultValue !== undefined) {
            defaultItem = section.items.find(item => {
              const itemValue = item[valueField] !== undefined
                ? item[valueField]
                : (item.value !== undefined ? item.value : item.id)
              return itemValue === section.defaultValue
            }) || null
          }

          // If no defaultValue or not found, use first item
          if (!defaultItem) {
            defaultItem = section.items[0]
          }

          if (defaultItem) {
            this.selectedItems.set(index, [defaultItem])
          }
        }
      })
    }

    // Re-render selection sections AFTER setting defaults
    this.renderSelectionSections()

    // Update UI when selections change
    this.updatePasswordUI()
  }

  /**
   * Set payment methods list (legacy)
   * @deprecated Use setSelectionSections instead
   * Sets custom payment methods list and field mapping configuration, supports two-level grouping structure
   * @param {PaymentMethod[]} [methods] - Payment methods list, uses default list if empty
   * @param {FieldMapping} [fieldMapping] - Field mapping configuration for custom field names
   * @author Brid9e
   */
  public setPaymentMethods(methods?: PaymentMethod[], fieldMapping?: FieldMapping) {
    // If not provided, use empty array; if empty array provided, keep it empty
    if (methods === undefined) {
      this.paymentMethods = []
      this.fieldMapping = { ...PaymentPanel.DEFAULT_FIELD_MAPPING }
      this.hasCustomPaymentMethods = false // Mark as custom payment methods not set
    } else {
      this.paymentMethods = methods
      this.fieldMapping = fieldMapping || { ...PaymentPanel.DEFAULT_FIELD_MAPPING }
      this.hasCustomPaymentMethods = true // Mark as custom payment methods set
    }

    // Clear new selection sections when using legacy API
    this.selectionSections = []
    this.hasCustomSelections = false

    // Clear lazy-loaded children cache
    this.loadedChildren.clear()
    this.expandedGroups.clear()
    this.loadingGroups.clear()

    // Re-render payment methods list
    this.renderSelectionSections()
    // Reset selected state
    if (this.paymentMethods.length > 0) {
      // Flatten to find first selectable option
      const flattenMethods = (methods: PaymentMethod[]): PaymentMethod[] => {
        const result: PaymentMethod[] = []
        methods.forEach(method => {
          // Only flatten if children is an array (not a Promise)
          if (method.children && Array.isArray(method.children) && method.children.length > 0) {
            result.push(...flattenMethods(method.children))
          } else if (!method.children) {
            // Only include leaf nodes (no children property)
            result.push(method)
          }
          // Skip Promise children as they're not loaded yet
        })
        return result
      }
      const allMethods = flattenMethods(this.paymentMethods)
      this.selectedMethod = allMethods[0] || null
    } else {
      this.selectedMethod = null
    }
    // Update UI when payment methods change (may affect password/button visibility)
    this.updatePasswordUI()
  }

  /**
   * Get currently selected payment method
   * Returns the payment method object currently selected by user
   * @returns {PaymentMethod | null} Currently selected payment method, returns null if none selected
   * @author Brid9e
   */
  public getSelectedMethod(): PaymentMethod | null {
    return this.selectedMethod
  }

  /**
   * Get all payment methods (flattened, including children)
   * Flattens grouped structure, returns all selectable payment methods
   * @returns {PaymentMethod[]} Flattened payment methods list
   * @author Brid9e
   */
  private getAllMethods(): PaymentMethod[] {
    const result: PaymentMethod[] = []
    this.paymentMethods.forEach((method, index) => {
      // Check if children is loaded (from cache or direct array)
      const loadedChildren = this.loadedChildren.get(index)
      const childrenArray = loadedChildren || (Array.isArray(method.children) ? method.children : null)

      if (childrenArray && childrenArray.length > 0) {
        result.push(...childrenArray)
      } else if (!method.children) {
        // Only include if it's a leaf node (no children property)
        result.push(method)
      }
      // Skip Promise children that are not loaded yet
    })
    return result
  }

  /**
   * Set whether clicking overlay closes panel
   * Controls whether clicking overlay closes payment panel
   * @param {boolean} close - Whether to allow closing by clicking overlay
   * @author Brid9e
   */
  public setCloseOnOverlayClick(close: boolean) {
    this.closeOnOverlayClick = close
    this.setAttribute('close-on-overlay-click', String(close))

    // Re-setup event listeners
    if (this.overlay) {
      // Remove old event listeners (need to rebind)
      const newOverlay = this.overlay.cloneNode(true) as HTMLElement
      if (this.overlay.parentNode) {
        this.overlay.parentNode.replaceChild(newOverlay, this.overlay)
        this.overlay = newOverlay
      }

      if (this.closeOnOverlayClick) {
        this.overlay.addEventListener('click', () => {
          this.close()
        })
      }
    }
  }

  /**
   * Set whether to enable password input
   * Controls whether to show password input interface
   * @param {boolean} enable - Whether to enable password input
   * @author Brid9e
   */
  public setEnablePassword(enable: boolean) {
    this.enablePassword = enable
    this.setAttribute('enable-password', String(enable))
    this.updatePasswordUI()
    if (!enable) {
      this.currentPassword = ''
      this.renderPasswordDots()
    }
  }

  /**
   * Set password length
   * Sets payment password length, limited to 4-12 digits
   * @param {number} length - Password length (4-12)
   * @author Brid9e
   */
  public setPasswordLength(length: number) {
    this.passwordLength = Math.max(4, Math.min(12, length)) // Limit to 4-12 digits
    this.setAttribute('password-length', String(this.passwordLength))
    this.currentPassword = ''
    this.renderPasswordDots()
  }

  /**
   * Unified configuration method
   * Sets all configuration options at once, including drag, behavior, password, UI, theme, etc.
   * @param {PaymentPanelConfig} config - Configuration object
   * @author Brid9e
   */
  public setConfig(config: PaymentPanelConfig) {
    // If config option exists, use provided value; otherwise restore to default
    this.allowSwipeToClose = config.allowSwipeToClose !== undefined
      ? config.allowSwipeToClose
      : DEFAULT_CONFIG.allowSwipeToClose
    this.updateDragHandleVisibility()
    this.setupDragListeners()

    this.closeThreshold = config.closeThreshold !== undefined
      ? config.closeThreshold
      : DEFAULT_CONFIG.closeThreshold
    this.setAttribute('close-threshold', String(this.closeThreshold))

    this.closeThresholdPercent = config.closeThresholdPercent !== undefined
      ? Math.max(0, Math.min(1, config.closeThresholdPercent))
      : DEFAULT_CONFIG.closeThresholdPercent
    this.setAttribute('close-threshold-percent', String(this.closeThresholdPercent))

    this.velocityThreshold = config.velocityThreshold !== undefined
      ? config.velocityThreshold
      : DEFAULT_CONFIG.velocityThreshold
    this.setAttribute('velocity-threshold', String(this.velocityThreshold))

    this.closeOnOverlayClick = config.closeOnOverlayClick !== undefined
      ? config.closeOnOverlayClick
      : DEFAULT_CONFIG.closeOnOverlayClick
    this.setAttribute('close-on-overlay-click', String(this.closeOnOverlayClick))
    // Re-setup overlay click listener (remove all listeners by cloning node)
    if (this.overlay) {
      const newOverlay = this.overlay.cloneNode(true) as HTMLElement
      if (this.overlay.parentNode) {
        this.overlay.parentNode.replaceChild(newOverlay, this.overlay)
        this.overlay = newOverlay
      }

      if (this.closeOnOverlayClick) {
        this.overlay.addEventListener('click', () => {
          this.close()
        })
      }
    }

    this.enablePassword = config.enablePassword !== undefined
      ? config.enablePassword
      : DEFAULT_CONFIG.enablePassword
    this.setAttribute('enable-password', String(this.enablePassword))
    this.updatePasswordUI()
    if (!this.enablePassword) {
      this.currentPassword = ''
      this.renderPasswordDots()
    }

    this.passwordLength = config.passwordLength !== undefined
      ? Math.max(4, Math.min(12, config.passwordLength))
      : DEFAULT_CONFIG.passwordLength
    this.setAttribute('password-length', String(this.passwordLength))
    if (config.passwordLength !== undefined) {
      this.currentPassword = ''
      this.renderPasswordDots()
    }

    // Header title, amount label, and empty state text are now optional
    // If not provided, will use i18n texts based on language
    this.headerTitle = config.headerTitle !== undefined ? config.headerTitle : undefined
    if (config.headerTitle !== undefined) {
      this.updateHeaderTitle()
    }

    this.amountLabel = config.amountLabel !== undefined ? config.amountLabel : undefined
    if (config.amountLabel !== undefined) {
      this.updateAmountLabel()
    }

    this.iconDisplay = config.iconDisplay !== undefined
      ? config.iconDisplay
      : DEFAULT_CONFIG.iconDisplay
    // If icon display mode changed, need to re-render
    if (config.iconDisplay !== undefined) {
      this.renderSelectionSections()
    }

    this.emptyStateText = config.emptyStateText !== undefined ? config.emptyStateText : undefined
    // If empty state text changed, need to re-render
    if (config.emptyStateText !== undefined) {
      this.renderSelectionSections()
    }

    this.autoCloseOnConfirm = config.autoCloseOnConfirm !== undefined
      ? config.autoCloseOnConfirm
      : DEFAULT_CONFIG.autoCloseOnConfirm

    // Handle allowConfirm config (new and legacy)
    if (config.allowConfirmWithoutSelections !== undefined) {
      this.allowConfirmWithoutSelections = config.allowConfirmWithoutSelections
      this.allowConfirmWithoutMethods = config.allowConfirmWithoutSelections // Keep legacy in sync
    } else {
      this.allowConfirmWithoutSelections = DEFAULT_CONFIG.allowConfirmWithoutSelections
      this.allowConfirmWithoutMethods = DEFAULT_CONFIG.allowConfirmWithoutSelections
    }
    // If allowConfirm settings changed, need to update UI
    if (config.allowConfirmWithoutSelections !== undefined) {
      this.updatePasswordUI()
    }

    // Handle hideSelections config (new and legacy)
    if (config.hideSelections !== undefined) {
      this.hideSelections = config.hideSelections
      this.hidePaymentMethods = config.hideSelections // Keep legacy in sync
    } else {
      this.hideSelections = DEFAULT_CONFIG.hideSelections
      this.hidePaymentMethods = DEFAULT_CONFIG.hideSelections
    }
    // If hide settings changed, need to update visibility
    if (config.hideSelections !== undefined) {
      this.updateSelectionSectionsVisibility()
    }

    this.amountAlign = config.amountAlign !== undefined
      ? config.amountAlign
      : DEFAULT_CONFIG.amountAlign
    this.amountFont = config.amountFont !== undefined
      ? (config.amountFont || DEFAULT_CONFIG.amountFont)
      : DEFAULT_CONFIG.amountFont
    this.textFont = config.textFont !== undefined
      ? (config.textFont || DEFAULT_CONFIG.textFont)
      : DEFAULT_CONFIG.textFont
    // If amount styles changed, need to update
    if (config.amountAlign !== undefined || config.amountFont !== undefined || config.textFont !== undefined) {
      this.updateAmountStyles()
    }

    this.language = config.language !== undefined
      ? config.language
      : DEFAULT_CONFIG.language as Language

    this.customI18n = config.i18n !== undefined ? config.i18n : undefined
    // If language or i18n changed, need to update all texts (only if custom texts are not set)
    if (config.language !== undefined || config.i18n !== undefined) {
      this.updateI18nTexts()
      // Also update header title and amount label if not custom
      if (!this.headerTitle) {
        this.updateHeaderTitle()
      }
      if (!this.amountLabel) {
        this.updateAmountLabel()
      }
    }

    const oldThemeMode = this.themeMode
    this.themeMode = config.themeMode !== undefined
      ? config.themeMode
      : DEFAULT_CONFIG.themeMode as 'light' | 'dark' | 'auto'
    // If themeMode changed, need to update theme
    if (config.themeMode !== undefined || oldThemeMode !== this.themeMode) {
      this.updateThemeMode()
    }

    // Set keyboard mapping
    if (config.keyboardMapping !== undefined) {
      this.setKeyboardMapping(config.keyboardMapping)
    }

    // Set theme
    if (config.theme !== undefined) {
      // setTheme method automatically handles empty object, resets to default
      this.setTheme(config.theme)
    } else {
      // If theme not provided, reset to default theme to avoid previous theme affecting
      this.setTheme({})
    }
  }

  /**
   * Reset to default configuration
   * Resets all configuration options to default values
   * @author Brid9e
   */
  private resetConfig() {
    this.setConfig({})
    // Reset payment methods to default (setPaymentMethods will automatically set hasCustomPaymentMethods = false)
    this.setPaymentMethods()
  }

  /**
   * Update drag handle visibility
   * Controls drag handle show/hide based on whether swipe-to-close is allowed
   * @author Brid9e
   */
  private updateDragHandleVisibility() {
    const dragHandle = this.shadow.querySelector('.drag-handle') as HTMLElement
    if (dragHandle) {
      if (this.allowSwipeToClose) {
        dragHandle.classList.remove('hidden')
      } else {
        dragHandle.classList.add('hidden')
      }
    }
  }

  /**
   * Set header title
   * Sets the text of header title (optional, defaults to i18n text based on language)
   * @param {string} [title] - Title text, if not provided will use i18n text
   * @author Brid9e
   */
  public setHeaderTitle(title?: string) {
    this.headerTitle = title
    this.updateHeaderTitle()
  }

  /**
   * Update header title display
   * Updates text content of title element in DOM
   * @author Brid9e
   */
  private updateHeaderTitle() {
    const titleElement = this.shadow.querySelector('#headerTitle') as HTMLElement
    if (titleElement) {
      titleElement.textContent = this.headerTitle || getI18nTexts(this.language, this.customI18n).headerTitle
    }
  }

  /**
   * Set amount label
   * Sets the text of payment amount label (optional, defaults to i18n text based on language)
   * @param {string} [label] - Amount label text, if not provided will use i18n text
   * @author Brid9e
   */
  public setAmountLabel(label?: string) {
    this.amountLabel = label
    this.updateAmountLabel()
  }

  /**
   * Set empty state text
   * Sets text displayed when payment methods are empty (optional, defaults to i18n text based on language)
   * @param {string} [text] - Empty state text, if not provided will use i18n text
   * @author Brid9e
   */
  public setEmptyStateText(text?: string) {
    this.emptyStateText = text
    this.renderPaymentMethods()
  }

  /**
   * Set whether to auto-close
   * Sets whether to automatically close panel after password input completes or submit button is clicked
   * @param {boolean} autoClose - Whether to auto-close
   * @author Brid9e
   */
  public setAutoCloseOnConfirm(autoClose: boolean) {
    this.autoCloseOnConfirm = autoClose
  }

  /**
   * Set whether to allow confirm without selections
   * Sets whether to allow password input and confirm buttons when no selections are available
   * @param {boolean} allow - Whether to allow confirm without selections
   * @author Brid9e
   */
  public setAllowConfirmWithoutSelections(allow: boolean) {
    this.allowConfirmWithoutSelections = allow
    this.allowConfirmWithoutMethods = allow // Keep legacy in sync
    this.updatePasswordUI()
  }

  /**
   * Set whether to allow confirm without payment methods (legacy)
   * @deprecated Use setAllowConfirmWithoutSelections instead
   * Sets whether to allow password input and confirm buttons when no payment methods are available
   * @param {boolean} allow - Whether to allow confirm without payment methods
   * @author Brid9e
   */
  public setAllowConfirmWithoutMethods(allow: boolean) {
    this.setAllowConfirmWithoutSelections(allow)
  }

  /**
   * Set whether to hide selection sections
   * Sets whether to hide selection sections, only show amount and confirm button/password input
   * @param {boolean} hide - Whether to hide selection sections
   * @author Brid9e
   */
  public setHideSelections(hide: boolean) {
    this.hideSelections = hide
    this.hidePaymentMethods = hide // Keep legacy in sync
    this.updateSelectionSectionsVisibility()
  }

  /**
   * Set whether to hide payment methods section (legacy)
   * @deprecated Use setHideSelections instead
   * Sets whether to hide payment methods section, only show amount and confirm button/password input
   * @param {boolean} hide - Whether to hide payment methods section
   * @author Brid9e
   */
  public setHidePaymentMethods(hide: boolean) {
    this.setHideSelections(hide)
  }

  /**
   * Set amount alignment
   * Sets the text alignment for amount section
   * @param {'left' | 'center' | 'right'} align - Alignment direction
   * @author Brid9e
   */
  public setAmountAlign(align: 'left' | 'center' | 'right') {
    this.amountAlign = align
    this.updateAmountStyles()
  }

  /**
   * Set amount font
   * Sets the font family for amount value
   * @param {string} font - Font family string, e.g. "Arial, sans-serif"
   * @author Brid9e
   */
  public setAmountFont(font: string) {
    this.amountFont = font || ''
    this.updateAmountStyles()
  }

  /**
   * Set text font
   * Sets the font family for other text elements
   * @param {string} font - Font family string, e.g. "Arial, sans-serif"
   * @author Brid9e
   */
  public setTextFont(font: string) {
    this.textFont = font || ''
    this.updateAmountStyles()
  }

  /**
   * Set language
   * Sets the language for i18n texts
   * @param {Language} lang - Language code ('zh' | 'en' | 'ja' | 'ru')
   * @author Brid9e
   */
  public setLanguage(lang: Language) {
    this.language = lang
    this.updateI18nTexts()
    // Also update header title and amount label if not custom
    if (!this.headerTitle) {
      this.updateHeaderTitle()
    }
    if (!this.amountLabel) {
      this.updateAmountLabel()
    }
  }

  /**
   * Set custom i18n texts
   * Sets custom i18n texts to override default translations, partial override supported
   * @param {Partial<I18nTexts>} i18n - Custom i18n texts object
   * @author Brid9e
   */
  public setI18n(i18n: Partial<I18nTexts>) {
    this.customI18n = i18n
    this.updateI18nTexts()
    // Also update header title and amount label if not custom
    if (!this.headerTitle) {
      this.updateHeaderTitle()
    }
    if (!this.amountLabel) {
      this.updateAmountLabel()
    }
  }

  /**
   * Set theme mode
   * Sets the theme mode: 'light', 'dark', or 'auto' (follow system)
   * @param {('light' | 'dark' | 'auto')} mode - Theme mode
   * @author Brid9e
   */
  public setThemeMode(mode: 'light' | 'dark' | 'auto') {
    this.themeMode = mode
    this.updateThemeMode()
  }

  /**
   * Set keyboard character mapping
   * Sets custom character mapping for password keyboard (0-9)
   * @param {string[]} mapping - Array of 10 strings corresponding to digits 0-9
   * @throws {Error} If mapping array length is not 10
   * @author Brid9e
   */
  public setKeyboardMapping(mapping: string[]) {
    if (!Array.isArray(mapping) || mapping.length !== 10) {
      throw new Error('Keyboard mapping must be an array of 10 strings (for digits 0-9)')
    }
    this.keyboardMapping = [...mapping] // Create a copy to avoid external modification
    // If password section is visible, re-render keyboard
    const passwordSection = this.shadow.querySelector('#passwordSection') as HTMLElement
    if (passwordSection && passwordSection.style.display !== 'none') {
      // Re-render the entire component to update keyboard
      this.render()
      this.setupEventListeners()
      this.initPasswordInput()
      this.updatePasswordUI()
      this.updatePaymentMethodsVisibility()
      this.updateAmountStyles()
      this.updateDragHandleVisibility()
      this.updateI18nTexts()
      this.renderPaymentMethods()
      this.updateHeaderTitle()
    }
  }

  /**
   * Update amount label display
   * Updates text content of amount label element in DOM
   * @author Brid9e
   */
  private updateAmountLabel() {
    const labelElement = this.shadow.querySelector('.amount-label') as HTMLElement
    if (labelElement) {
      labelElement.textContent = this.amountLabel || getI18nTexts(this.language, this.customI18n).amountLabel
    }
  }

  /**
   * Update i18n texts
   * Updates all text elements based on current language
   * @author Brid9e
   */
  private updateI18nTexts() {
    const texts = getI18nTexts(this.language, this.customI18n)

    // Update header title
    const titleElement = this.shadow.querySelector('#headerTitle') as HTMLElement
    if (titleElement && !this.headerTitle) {
      titleElement.textContent = texts.headerTitle
    }

    // Update amount label
    const amountLabel = this.shadow.querySelector('.amount-label') as HTMLElement
    if (amountLabel && !this.amountLabel) {
      amountLabel.textContent = texts.amountLabel
    }

    // Update password label
    const passwordLabel = this.shadow.querySelector('.password-label') as HTMLElement
    if (passwordLabel) {
      passwordLabel.textContent = texts.passwordLabel
    }

    // Update buttons
    const cancelBtn = this.shadow.querySelector('#cancelBtn') as HTMLElement
    if (cancelBtn) {
      cancelBtn.textContent = texts.cancelButton
    }

    const confirmBtn = this.shadow.querySelector('#confirmBtn') as HTMLElement
    if (confirmBtn) {
      confirmBtn.textContent = texts.confirmButton
    }

    // Update close button aria-label
    const closeBtn = this.shadow.querySelector('#closeBtn') as HTMLElement
    if (closeBtn) {
      closeBtn.setAttribute('aria-label', texts.closeAriaLabel)
    }

    // Update empty state text if not custom
    if (!this.emptyStateText) {
      this.renderPaymentMethods()
    }
  }

  /**
   * Update amount section styles
   * Updates alignment and font styles for amount section
   * @author Brid9e
   */
  private updateAmountStyles() {
    const amountSection = this.shadow.querySelector('.amount-section') as HTMLElement
    if (amountSection) {
      // Set alignment
      amountSection.setAttribute('data-align', this.amountAlign)

      // Set amount font
      const amountValue = this.shadow.querySelector('.amount-value') as HTMLElement
      if (amountValue && this.amountFont) {
        amountValue.style.fontFamily = this.amountFont
      } else if (amountValue && !this.amountFont) {
        amountValue.style.fontFamily = ''
      }

      // Set text font for label
      const amountLabel = this.shadow.querySelector('.amount-label') as HTMLElement
      if (amountLabel && this.textFont) {
        amountLabel.style.fontFamily = this.textFont
      } else if (amountLabel && !this.textFont) {
        amountLabel.style.fontFamily = ''
      }
    }

    // Apply text font to other text elements if specified
    if (this.textFont) {
      const style = document.createElement('style')
      style.id = 'text-font-style'
      style.textContent = `
        :host {
          font-family: ${this.textFont} !important;
        }
        .header-title,
        .payment-methods-title,
        .payment-name,
        .payment-desc,
        .password-label,
        .btn {
          font-family: ${this.textFont} !important;
        }
      `
      // Remove existing style if any
      const existingStyle = this.shadow.querySelector('#text-font-style')
      if (existingStyle) {
        existingStyle.remove()
      }
      this.shadow.appendChild(style)
    } else {
      // Remove text font style if not specified
      const existingStyle = this.shadow.querySelector('#text-font-style')
      if (existingStyle) {
        existingStyle.remove()
      }
    }
  }

  /**
   * Set theme
   * Sets payment panel theme colors, including primary color, background color, text color, etc.
   * @param {PaymentPanelConfig['theme']} theme - Theme configuration object, passing empty object resets to default theme
   * @author Brid9e
   */
  public setTheme(theme: PaymentPanelConfig['theme']) {
    // If empty object or null/undefined passed, reset to theme default (empty object)
    // This will use default values in render
    if (!theme || Object.keys(theme).length === 0) {
      this.theme = {}
    } else {
      this.theme = theme
    }
    // Re-render to apply new theme
    this.render()
    // Re-setup event listeners
    this.setupEventListeners()
    // Re-initialize password input
    this.initPasswordInput()
    this.updatePasswordUI()
    this.updatePaymentMethodsVisibility()
    this.updateAmountStyles()
    this.updateDragHandleVisibility()
    this.updateI18nTexts()
    // Re-render payment methods list
    this.renderPaymentMethods()
    // Update title
    this.updateHeaderTitle()
  }

  /**
   * Get current theme
   * Returns currently set theme configuration object
   * @returns {PaymentPanelConfig['theme']} Current theme configuration object
   * @author Brid9e
   */
  public getTheme(): PaymentPanelConfig['theme'] {
    return { ...this.theme }
  }
}

// Register custom element
if (!customElements.get('payment-panel')) {
  customElements.define('payment-panel', PaymentPanel)
}

// Export types (re-export from types folder)
export type { PaymentMethod, SelectionSection, SelectionItem, FieldMapping, PaymentPanelConfig } from './types'

export default PaymentPanel
