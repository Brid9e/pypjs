English | [简体中文](https://github.com/Brid9e/pypjs/blob/main/README-ZH.md)

# pypjs

A simple, easy-to-use, framework-agnostic payment panel component.

## Usage

### 1. Installation

```bash
npm install pypjs
```

Or use other package managers (pnpm, yarn, etc.)

### 2. Import

**ES Module:**
```javascript
import pypjs from 'pypjs'
```

**Script Tag:**
```html
<script src="./dist/index.js"></script>
```

### 3. Basic Usage

```javascript
// Open/close panel
pypjs.open(99.99) // Supports number or string
pypjs.close()

// Set amount
pypjs.setAmount(199.0) // Supports number or string
```

### 4. Payment Methods

```javascript
pypjs.setPaymentMethods([
  { id: 1, name: 'WeChat Pay', desc: 'Recommended', icon: '💳' },
  { id: 2, name: 'Alipay', desc: 'Secure & Convenient', icon: '💰' }
], {
  titleField: 'name',
  subtitleField: 'desc',
  iconField: 'icon',
  valueField: 'id'
})

// Two-level grouping
pypjs.setPaymentMethods([
  {
    name: 'Online Payment',
    children: [
      { id: 1, name: 'WeChat Pay', icon: '💳' },
      { id: 2, name: 'Alipay', icon: '💰' }
    ]
  }
], { titleField: 'name', valueField: 'id' })
```

### 5. Configuration

```javascript
pypjs.setConfig({
  allowSwipeToClose: false,
  closeOnOverlayClick: false,
  enablePassword: true,
  passwordLength: 6,
  language: 'zh',
  themeMode: 'auto',
  keyboardMapping: ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')'],
  theme: {
    primaryColor: '#ff4d4f',
    panelBgLight: '#ffffff',
    panelBgDark: '#2d2d2d'
  }
})
```

### 6. Events

```javascript
pypjs.on('confirm', (e) => {
  const { method, amount, password } = e.detail
  console.log('Payment:', method, amount, password)
})

pypjs.on('close', () => {
  console.log('Panel closed')
})
```

## Features

- **i18n**: Supports zh, en, ja, ru with partial override
- **Theme**: `light` | `dark` | `auto` (follow system), customizable colors and gradients
- **Keyboard Mapping**: Map digits 0-9 to custom characters (keyboard displays digits, input uses mapped values)
- **Icon Display**: `always` | `never` | `auto`, supports image URL, emoji, or default SVG
- **Amount Alignment**: `left` | `center` | `right` with custom fonts

## API Reference

### Basic Methods

- `pypjs.open(amount?: number | string)` - Open payment panel, optionally with amount
- `pypjs.close()` - Close payment panel
- `pypjs.setAmount(amount: number | string)` - Set payment amount

### Payment Methods

- `pypjs.setPaymentMethods(methods?, fieldMapping?)` - Set payment methods list
  - `methods`: Payment methods array (optional)
  - `fieldMapping`: Optional field mapping configuration
    - `titleField`: Title field name (default 'title' or 'name')
    - `subtitleField`: Subtitle field name (default 'subtitle' or 'desc')
    - `iconField`: Icon field name (default 'icon')
    - `valueField`: Value field name (default 'value' or 'id')
- `pypjs.getSelectedMethod()` - Get currently selected payment method

### Configuration

- `pypjs.setConfig(config: PaymentPanelConfig)` - Configure all options

**Config Options:**
- `allowSwipeToClose?: boolean` - Allow swipe to close (default true)
- `closeOnOverlayClick?: boolean` - Close on overlay click (default true)
- `enablePassword?: boolean` - Enable password input (default false)
- `passwordLength?: number` - Password length (default 6, range 4-12)
- `headerTitle?: string` - Header title (optional, defaults to i18n)
- `amountLabel?: string` - Amount label (optional, defaults to i18n)
- `iconDisplay?: 'always' | 'never' | 'auto'` - Icon display mode (default 'always')
- `closeThreshold?: number` - Close distance threshold in pixels (default 100)
- `closeThresholdPercent?: number` - Close distance threshold percentage 0-1 (default 0.3)
- `velocityThreshold?: number` - Velocity threshold pixels/ms (default 0.5)
- `allowConfirmWithoutMethods?: boolean` - Allow confirm without payment methods (default true)
- `hidePaymentMethods?: boolean` - Hide payment methods section (default false)
- `amountAlign?: 'left' | 'center' | 'right'` - Amount alignment (default 'left')
- `amountFont?: string` - Amount font family
- `textFont?: string` - Text font family
- `language?: 'zh' | 'en' | 'ja' | 'ru'` - Language setting (default 'en')
- `i18n?: Partial<I18nTexts>` - Custom i18n texts (partial override)
- `themeMode?: 'light' | 'dark' | 'auto'` - Theme mode (default 'auto')
- `keyboardMapping?: string[]` - Keyboard character mapping, array of 10 strings for digits 0-9
- `theme?: ThemeConfig` - Theme configuration
  - `primaryColor?: string` - Primary color (default "#238636")
  - `primaryHoverColor?: string` - Primary hover color (default "#2ea043")
  - `overlayColor?: string` - Overlay color (default "rgba(0, 0, 0, 0.5)")
  - `panelBgLight?: string` - Panel background in light mode (default "#ffffff", supports gradients)
  - `panelBgDark?: string` - Panel background in dark mode (default "#2d2d2d", supports gradients)
  - `textPrimaryLight?: string` - Primary text color in light mode (default "#24292f")
  - `textPrimaryDark?: string` - Primary text color in dark mode (default "#e0e0e0")
  - `textSecondaryLight?: string` - Secondary text color in light mode (default "#57606a")
  - `textSecondaryDark?: string` - Secondary text color in dark mode (default "#999999")

### Individual Methods

- `pypjs.setHeaderTitle(title?: string)` - Set header title
- `pypjs.setAmountLabel(label?: string)` - Set amount label
- `pypjs.setCloseThreshold(threshold: number)` - Set close threshold (pixels)
- `pypjs.setCloseThresholdPercent(percent: number)` - Set close threshold (percentage 0-1)
- `pypjs.setVelocityThreshold(threshold: number)` - Set velocity threshold
- `pypjs.setCloseOnOverlayClick(close: boolean)` - Set close on overlay click
- `pypjs.setEnablePassword(enable: boolean)` - Set enable password input
- `pypjs.setPasswordLength(length: number)` - Set password length (4-12)
- `pypjs.setKeyboardMapping(mapping: string[])` - Set keyboard character mapping
- `pypjs.setAllowConfirmWithoutMethods(allow: boolean)` - Set allow confirm without methods
- `pypjs.setHidePaymentMethods(hide: boolean)` - Set hide payment methods
- `pypjs.setAmountAlign(align: 'left' | 'center' | 'right')` - Set amount alignment
- `pypjs.setAmountFont(font: string)` - Set amount font
- `pypjs.setTextFont(font: string)` - Set text font
- `pypjs.setLanguage(lang: 'zh' | 'en' | 'ja' | 'ru')` - Set language
- `pypjs.setI18n(i18n: Partial<I18nTexts>)` - Set custom i18n texts
- `pypjs.setThemeMode(mode: 'light' | 'dark' | 'auto')` - Set theme mode
- `pypjs.setTheme(theme: ThemeConfig)` - Set theme configuration
- `pypjs.getTheme()` - Get current theme configuration

### Events

- `pypjs.on('confirm', handler)` - Listen to payment confirm event
  - Event detail: `{ method, amount, password, methodData }`
- `pypjs.on('close', handler)` - Listen to panel close event
- `pypjs.off(event, handler)` - Remove event listener
- `pypjs.removeAllListeners(event?)` - Remove all event listeners

## Browser Support

Modern browsers (Chrome, Firefox, Safari, Edge) and mobile browsers.

## License

MIT
