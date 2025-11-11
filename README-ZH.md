# pypjs

一个简易好用、不受框架限制的支付面板组件。

## 使用方法

### 1. 安装

```bash
npm install pypjs
```

或使用其他包管理工具（pnpm、yarn 等）

### 2. 引入

**ES Module:**
```javascript
import pypjs from 'pypjs'
```

**Script 标签:**
```html
<script src="./dist/index.js"></script>
```

### 3. 基础用法

```javascript
// 打开/关闭面板
pypjs.open(99.99) // 支持 number 或 string
pypjs.close()

// 设置金额
pypjs.setAmount(199.0) // 支持 number 或 string
```

### 4. 支付方式

```javascript
pypjs.setPaymentMethods([
  { id: 1, name: '微信支付', desc: '推荐使用', icon: '💳' },
  { id: 2, name: '支付宝', desc: '安全便捷', icon: '💰' }
], {
  titleField: 'name',
  subtitleField: 'desc',
  iconField: 'icon',
  valueField: 'id'
})

// 二级分组
pypjs.setPaymentMethods([
  {
    name: '在线支付',
    children: [
      { id: 1, name: '微信支付', icon: '💳' },
      { id: 2, name: '支付宝', icon: '💰' }
    ]
  }
], { titleField: 'name', valueField: 'id' })
```

### 5. 配置

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

### 6. 事件

```javascript
pypjs.on('confirm', (e) => {
  const { method, amount, password } = e.detail
  console.log('支付:', method, amount, password)
})

pypjs.on('close', () => {
  console.log('面板已关闭')
})
```

## 特性

- **多语言**: 支持 zh、en、ja、ru，可部分覆盖
- **主题**: `light` | `dark` | `auto`（跟随系统），支持自定义颜色和渐变
- **键盘映射**: 将数字 0-9 映射到自定义字符（键盘显示数字，输入使用映射值）
- **图标显示**: `always` | `never` | `auto`，支持图片URL、emoji或默认SVG
- **金额对齐**: `left` | `center` | `right`，支持自定义字体

## API 参考

### 基础方法

- `pypjs.open(amount?: number | string)` - 打开支付面板，可选传入金额
- `pypjs.close()` - 关闭支付面板
- `pypjs.setAmount(amount: number | string)` - 设置支付金额

### 支付方式

- `pypjs.setPaymentMethods(methods?, fieldMapping?)` - 设置支付方式列表
  - `methods`: 支付方式数组（可选）
  - `fieldMapping`: 可选，字段映射配置
    - `titleField`: 标题字段名（默认 'title' 或 'name'）
    - `subtitleField`: 副标题字段名（默认 'subtitle' 或 'desc'）
    - `iconField`: 图标字段名（默认 'icon'）
    - `valueField`: 值字段名（默认 'value' 或 'id'）
- `pypjs.getSelectedMethod()` - 获取当前选中的支付方式

### 配置

- `pypjs.setConfig(config: PaymentPanelConfig)` - 配置所有选项

**配置项:**
- `allowSwipeToClose?: boolean` - 是否允许下拉关闭（默认 true）
- `closeOnOverlayClick?: boolean` - 点击遮罩层是否关闭（默认 true）
- `enablePassword?: boolean` - 是否启用密码输入（默认 false）
- `passwordLength?: number` - 密码位数（默认 6，范围 4-12）
- `headerTitle?: string` - 标题文本（可选，默认使用i18n）
- `amountLabel?: string` - 金额标签文本（可选，默认使用i18n）
- `iconDisplay?: 'always' | 'never' | 'auto'` - 图标显示模式（默认 'always'）
- `closeThreshold?: number` - 关闭距离阈值（像素，默认 100）
- `closeThresholdPercent?: number` - 关闭距离阈值（百分比 0-1，默认 0.3）
- `velocityThreshold?: number` - 速度阈值（像素/毫秒，默认 0.5）
- `allowConfirmWithoutMethods?: boolean` - 无支付方式时是否允许确认（默认 true）
- `hidePaymentMethods?: boolean` - 是否隐藏支付方式区域（默认 false）
- `amountAlign?: 'left' | 'center' | 'right'` - 金额对齐方式（默认 'left'）
- `amountFont?: string` - 金额字体
- `textFont?: string` - 文本字体
- `language?: 'zh' | 'en' | 'ja' | 'ru'` - 语言设置（默认 'en'）
- `i18n?: Partial<I18nTexts>` - 自定义多语言文本（部分覆盖）
- `themeMode?: 'light' | 'dark' | 'auto'` - 主题模式（默认 'auto'）
- `keyboardMapping?: string[]` - 键盘字符映射，数组长度为 10，对应数字 0-9
- `theme?: ThemeConfig` - 主题配置
  - `primaryColor?: string` - 主色调（默认 "#238636"）
  - `primaryHoverColor?: string` - 主色调悬停色（默认 "#2ea043"）
  - `overlayColor?: string` - 遮罩层颜色（默认 "rgba(0, 0, 0, 0.5)"）
  - `panelBgLight?: string` - 浅色模式下面板背景色（默认 "#ffffff"，支持渐变）
  - `panelBgDark?: string` - 深色模式下面板背景色（默认 "#2d2d2d"，支持渐变）
  - `textPrimaryLight?: string` - 浅色模式下主文本色（默认 "#24292f"）
  - `textPrimaryDark?: string` - 深色模式下主文本色（默认 "#e0e0e0"）
  - `textSecondaryLight?: string` - 浅色模式下次要文本色（默认 "#57606a"）
  - `textSecondaryDark?: string` - 深色模式下次要文本色（默认 "#999999"）

### 单独配置方法

- `pypjs.setHeaderTitle(title?: string)` - 设置标题
- `pypjs.setAmountLabel(label?: string)` - 设置金额标签
- `pypjs.setCloseThreshold(threshold: number)` - 设置关闭距离阈值（像素）
- `pypjs.setCloseThresholdPercent(percent: number)` - 设置关闭距离阈值（百分比 0-1）
- `pypjs.setVelocityThreshold(threshold: number)` - 设置速度阈值
- `pypjs.setCloseOnOverlayClick(close: boolean)` - 设置点击遮罩层是否关闭
- `pypjs.setEnablePassword(enable: boolean)` - 设置是否启用密码输入
- `pypjs.setPasswordLength(length: number)` - 设置密码位数（4-12）
- `pypjs.setKeyboardMapping(mapping: string[])` - 设置键盘字符映射
- `pypjs.setAllowConfirmWithoutMethods(allow: boolean)` - 设置无支付方式时是否允许确认
- `pypjs.setHidePaymentMethods(hide: boolean)` - 设置是否隐藏支付方式
- `pypjs.setAmountAlign(align: 'left' | 'center' | 'right')` - 设置金额对齐方式
- `pypjs.setAmountFont(font: string)` - 设置金额字体
- `pypjs.setTextFont(font: string)` - 设置文本字体
- `pypjs.setLanguage(lang: 'zh' | 'en' | 'ja' | 'ru')` - 设置语言
- `pypjs.setI18n(i18n: Partial<I18nTexts>)` - 设置自定义多语言文本
- `pypjs.setThemeMode(mode: 'light' | 'dark' | 'auto')` - 设置主题模式
- `pypjs.setTheme(theme: ThemeConfig)` - 设置主题配置
- `pypjs.getTheme()` - 获取当前主题配置

### 事件

- `pypjs.on('confirm', handler)` - 监听支付确认事件
  - 事件详情: `{ method, amount, password, methodData }`
- `pypjs.on('close', handler)` - 监听面板关闭事件
- `pypjs.off(event, handler)` - 移除事件监听
- `pypjs.removeAllListeners(event?)` - 移除所有事件监听

## 浏览器支持

现代浏览器（Chrome、Firefox、Safari、Edge）和移动端浏览器。

## 许可证

MIT
