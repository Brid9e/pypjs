/**
 * Payment method interface
 * Defines the data structure for payment methods, supports two-level grouping
 * @author Brid9e
 */
export interface PaymentMethod {
  /** Allows any field */
  [key: string]: any
  /** Must have a unique identifier */
  value: string | number
  /** Child payment methods list, used for two-level grouping */
  children?: PaymentMethod[]
}

/**
 * Field mapping configuration
 * Used for custom field name mapping of payment method data
 * @author Brid9e
 */
export interface FieldMapping {
  /** Title field name, default 'title' or 'name' */
  titleField?: string
  /** Subtitle field name, default 'subtitle' or 'desc' or 'description' */
  subtitleField?: string
  /** Icon field name, default 'icon' */
  iconField?: string
  /** Value field name, default 'value' or 'id' */
  valueField?: string
}

/**
 * Theme configuration
 * Defines the theme color scheme for payment panel
 * @author Brid9e
 */
export interface ThemeConfig {
  /** Primary color (for buttons, selected state, etc.), default "#238636" */
  primaryColor?: string
  /** Primary hover color, default "#2ea043" */
  primaryHoverColor?: string
  /** Overlay color, default "rgba(0, 0, 0, 0.5)" */
  overlayColor?: string
  /** Panel background color in light mode, default "#ffffff", supports gradients */
  panelBgLight?: string
  /** Panel background color in dark mode, default "#2d2d2d", supports gradients */
  panelBgDark?: string
  /** Primary text color in light mode, default "#24292f" */
  textPrimaryLight?: string
  /** Primary text color in dark mode, default "#e0e0e0" */
  textPrimaryDark?: string
  /** Secondary text color in light mode, default "#57606a" */
  textSecondaryLight?: string
  /** Secondary text color in dark mode, default "#999999" */
  textSecondaryDark?: string
}

/**
 * I18n texts interface
 * Defines the structure for internationalization texts
 * @author Brid9e
 */
export interface I18nTexts {
  headerTitle: string
  amountLabel: string
  paymentMethodsTitle: string
  passwordLabel: string
  cancelButton: string
  confirmButton: string
  emptyStateText: string
  closeAriaLabel: string
}

/**
 * Payment panel configuration
 * Defines all configurable options for payment panel
 * @author Brid9e
 */
export interface PaymentPanelConfig {
  /** Whether to allow swipe to close, default true */
  allowSwipeToClose?: boolean
  /** Close distance threshold (pixels), default 100px */
  closeThreshold?: number
  /** Close distance threshold (percentage 0-1), default 0.3 */
  closeThresholdPercent?: number
  /** Velocity threshold (pixels/ms), default 0.5 */
  velocityThreshold?: number

  /** Whether clicking overlay closes panel, default true */
  closeOnOverlayClick?: boolean

  /** Whether to enable password input, default false */
  enablePassword?: boolean
  /** Password length, default 6 */
  passwordLength?: number

  /** Header title text, default "Payment" */
  headerTitle?: string
  /** Amount label text, default "Payment Amount" */
  amountLabel?: string

  /** Icon display mode, default "always" */
  iconDisplay?: 'always' | 'never' | 'auto'

  /** Empty state text displayed when payment methods are empty, default "No payment methods available" */
  emptyStateText?: string

  /** Whether to automatically close panel after password input completes or submit button is clicked, default false */
  autoCloseOnConfirm?: boolean

  /** Whether to allow password input and confirm buttons when no payment methods are available, default true */
  allowConfirmWithoutMethods?: boolean

  /** Whether to hide payment methods section, only show amount and confirm button/password input, default false */
  hidePaymentMethods?: boolean

  /** Amount alignment, default "left" */
  amountAlign?: 'left' | 'center' | 'right'

  /** Amount font family, e.g. "Arial, sans-serif" */
  amountFont?: string

  /** Text font family for other text elements, e.g. "Arial, sans-serif" */
  textFont?: string

  /** Language code for i18n, default "en" */
  language?: 'zh' | 'en' | 'ja' | 'ru'

  /** Custom i18n texts to override default translations, partial override supported */
  i18n?: Partial<I18nTexts>

  /** Theme mode: 'light' | 'dark' | 'auto' (follow system), default "auto" */
  themeMode?: 'light' | 'dark' | 'auto'

  /** Keyboard character mapping for password input, array of 10 strings corresponding to digits 0-9, default ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] */
  keyboardMapping?: string[]

  /** Theme configuration */
  theme?: ThemeConfig
}
