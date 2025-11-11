English | [简体中文](https://github.com/Brid9e/pypjs/blob/main/README-ZH.md)

# pypjs

A simple, easy-to-use, framework-agnostic payment panel component.

## Usage

### 1. Installation

```bash
npm install pypjs
```

Or use other package managers (pnpm, yarn, etc.)

### 2. Import the Component

#### In Vue/React/Modern Projects (ES Module)

```javascript
import pypjs from 'pypjs'

// Use the component
pypjs.open(99.99)
pypjs.setConfig({ headerTitle: 'Payment' })
```

#### In Browser (Script Tag)

```html
<script src="./dist/index.js"></script>
```

After including, the global `pypjs` object is available for use.

### 3. Basic Usage

```javascript
// Open/close panel
pypjs.open(99.99) // Supports number or string
pypjs.close()

// Set amount
pypjs.setAmount(199.0) // Supports number or string
```

### 4. Custom Payment Methods

#### Basic Usage

```javascript
// Set payment methods list and field mapping
pypjs.setPaymentMethods(
  [
    { id: 1, name: 'WeChat Pay', desc: 'Recommended', icon: '💳' },
    { id: 2, name: 'Alipay', desc: 'Secure & Convenient', icon: '💰' },
    { id: 3, name: 'Apple Pay', desc: 'Fast Payment', icon: '🍎' }
  ],
  {
    titleField: 'name', // Title field name
    subtitleField: 'desc', // Subtitle field name
    iconField: 'icon', // Icon field name
    valueField: 'id' // Value field name
  }
)
```

#### Two-Level Grouping

```javascript
pypjs.setPaymentMethods(
  [
    {
      name: 'Online Payment',
      children: [
        { id: 1, name: 'WeChat Pay', desc: 'Recommended', icon: '💳' },
        { id: 2, name: 'Alipay', desc: 'Secure & Convenient', icon: '💰' },
        { id: 3, name: 'Apple Pay', desc: 'Fast Payment', icon: '🍎' }
      ]
    },
    {
      name: 'Bank Card',
      children: [
        { id: 4, name: 'Debit Card', desc: 'All Banks Supported', icon: '💵' },
        { id: 5, name: 'Credit Card', desc: 'All Banks Supported', icon: '💳' }
      ]
    }
  ],
  {
    titleField: 'name',
    subtitleField: 'desc',
    iconField: 'icon',
    valueField: 'id'
  }
)
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

### Global Methods

#### Basic Methods

- `pypjs.open(amount?: number | string)` - Open payment panel, optionally with amount
- `pypjs.close()` - Close payment panel
- `pypjs.setAmount(amount: number | string)` - Set payment amount

#### Payment Methods

- `pypjs.setPaymentMethods(methods?, fieldMapping?)` - Set payment methods list
  - `methods`: Payment methods array (optional), if not provided or empty array, restores default payment methods
  - `fieldMapping`: Optional field mapping configuration
    - `titleField`: Title field name (default 'title' or 'name')
    - `subtitleField`: Subtitle field name (default 'subtitle' or 'desc')
    - `iconField`: Icon field name (default 'icon')
    - `valueField`: Value field name (default 'value' or 'id')
- `pypjs.getSelectedMethod()` - Get currently selected payment method

#### Configuration

- `pypjs.setConfig(config)` - Configure all options
- `pypjs.resetConfig()` - Reset to defaults

Main config options:
- `allowSwipeToClose`, `closeOnOverlayClick`, `enablePassword`, `passwordLength`
- `language`, `i18n`, `themeMode`, `theme`, `keyboardMapping`
- `amountAlign`, `amountFont`, `textFont`, `iconDisplay`
- `allowConfirmWithoutMethods`, `hidePaymentMethods`

#### Events

- `pypjs.on('confirm', handler)` - `{ method, amount, password, methodData }`
- `pypjs.on('close', handler)`

## Browser Support

Modern browsers (Chrome, Firefox, Safari, Edge) and mobile browsers.

## License

MIT
