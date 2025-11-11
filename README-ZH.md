# pypjs

一个简易好用、不受框架限制的支付面板组件。

## 使用方法

### 1. 安装

```bash
npm install pypjs
```

或使用其他包管理工具（pnpm、yarn 等）

### 2. 引入组件

#### 在 Vue/React/现代项目中使用（ES Module）

```javascript
import pypjs from 'pypjs'

// 使用组件
pypjs.open(99.99)
pypjs.setConfig({ headerTitle: '支付' })
```

#### 在浏览器中使用（Script 标签）

```html
<script src="./dist/index.js"></script>
```

引入后会自动初始化，全局对象 `pypjs` 可直接使用。

### 3. 基础用法

```javascript
// 打开/关闭面板
pypjs.open(99.99) // 支持 number 或 string
pypjs.close()

// 设置金额
pypjs.setAmount(199.0) // 支持 number 或 string
```

### 4. 自定义支付方式

#### 基础用法

```javascript
// 设置支付方式列表和字段映射
pypjs.setPaymentMethods(
  [
    { id: 1, name: '微信支付', desc: '推荐使用', icon: '💳' },
    { id: 2, name: '支付宝', desc: '安全便捷', icon: '💰' },
    { id: 3, name: 'Apple Pay', desc: '快速支付', icon: '🍎' }
  ],
  {
    titleField: 'name',      // 标题字段名
    subtitleField: 'desc',   // 副标题字段名
    iconField: 'icon',       // 图标字段名
    valueField: 'id'         // 值字段名
  }
);
```

#### 二级分组

```javascript
pypjs.setPaymentMethods(
  [
    {
      name: '在线支付',
      children: [
        { id: 1, name: '微信支付', desc: '推荐使用', icon: '💳' },
        { id: 2, name: '支付宝', desc: '安全便捷', icon: '💰' },
        { id: 3, name: 'Apple Pay', desc: '快速支付', icon: '🍎' }
      ]
    },
    {
      name: '银行卡支付',
      children: [
        { id: 4, name: '储蓄卡', desc: '支持各大银行', icon: '💵' },
        { id: 5, name: '信用卡', desc: '支持各大银行', icon: '💳' }
      ]
    }
  ],
  {
    titleField: 'name',
    subtitleField: 'desc',
    iconField: 'icon',
    valueField: 'id'
  }
);
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

### 全局方法

#### 基础方法

- `pypjs.open(amount?: number | string)` - 打开支付面板，可选传入金额
- `pypjs.close()` - 关闭支付面板
- `pypjs.setAmount(amount: number | string)` - 设置支付金额

#### 支付方式

- `pypjs.setPaymentMethods(methods?, fieldMapping?)` - 设置支付方式列表
  - `methods`: 支付方式数组（可选），如果不传或传空数组，会恢复为默认支付方式
  - `fieldMapping`: 可选，字段映射配置
    - `titleField`: 标题字段名（默认 'title' 或 'name'）
    - `subtitleField`: 副标题字段名（默认 'subtitle' 或 'desc'）
    - `iconField`: 图标字段名（默认 'icon'）
    - `valueField`: 值字段名（默认 'value' 或 'id'）
- `pypjs.getSelectedMethod()` - 获取当前选中的支付方式

#### 配置

- `pypjs.setConfig(config)` - 配置所有选项
- `pypjs.resetConfig()` - 重置为默认值

主要配置项：
- `allowSwipeToClose`, `closeOnOverlayClick`, `enablePassword`, `passwordLength`
- `language`, `i18n`, `themeMode`, `theme`, `keyboardMapping`
- `amountAlign`, `amountFont`, `textFont`, `iconDisplay`
- `allowConfirmWithoutMethods`, `hidePaymentMethods`

#### 事件

- `pypjs.on('confirm', handler)` - `{ method, amount, password, methodData }`
- `pypjs.on('close', handler)`

## 浏览器支持

现代浏览器（Chrome、Firefox、Safari、Edge）和移动端浏览器。

## 许可证

MIT
