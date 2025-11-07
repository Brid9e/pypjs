# 支付面板 Web Component

移动端支付面板组件。

## 安装

```bash
pnpm install
```

## 开发

```bash
pnpm run dev
```

## 构建

```bash
pnpm run build
```

构建完成后，会在 `dist` 目录生成 `payment-panel.js` 文件。

## 使用方法

### 1. 引入组件

```html
<script src="./dist/payment-panel.js"></script>
```

### 2. 创建组件实例

```javascript
// 方式1: 使用 createElement
const paymentPanel = document.createElement('payment-panel');
document.body.appendChild(paymentPanel);

// 方式2: 直接在 HTML 中使用
<payment-panel></payment-panel>
```

### 3. 打开支付面板

```javascript
// 基础打开
paymentPanel.open();

// 带金额打开
paymentPanel.open(99.99);
```

### 4. 关闭支付面板

```javascript
paymentPanel.close();
```

### 5. 设置金额

```javascript
paymentPanel.setAmount(199.00);
```

### 6. 自定义关闭阈值

```javascript
// 方式1: 通过方法设置
paymentPanel.setCloseThreshold(150); // 设置距离阈值为150px
paymentPanel.setCloseThresholdPercent(0.4); // 设置距离阈值为面板高度的40%
paymentPanel.setVelocityThreshold(0.8); // 设置速度阈值为0.8px/ms

// 方式2: 通过HTML属性设置
<payment-panel
  close-threshold="150"
  close-threshold-percent="0.4"
  velocity-threshold="0.8">
</payment-panel>
```

### 7. 监听事件

```javascript
// 监听支付确认事件
paymentPanel.addEventListener('payment-confirm', (e) => {
  const { method, amount } = e.detail;
  console.log('支付方式:', method);
  console.log('支付金额:', amount);
});

// 监听关闭事件
paymentPanel.addEventListener('payment-close', () => {
  console.log('支付面板已关闭');
});
```

## API

### 方法

- `open(amount?: number)` - 打开支付面板，可选传入金额
- `close()` - 关闭支付面板
- `setAmount(amount: number)` - 设置支付金额
- `setCloseThreshold(threshold: number)` - 设置关闭距离阈值（像素）
- `setCloseThresholdPercent(percent: number)` - 设置关闭距离阈值（百分比，0-1之间）
- `setVelocityThreshold(threshold: number)` - 设置速度阈值（像素/毫秒）

### 属性

- `close-threshold` - 关闭距离阈值（像素，默认100px）
- `close-threshold-percent` - 关闭距离阈值（百分比，默认0.3即30%）
- `velocity-threshold` - 速度阈值（像素/毫秒，默认0.5）

### 拖拽关闭

组件支持通过向下拖拽来关闭面板：
- 可以从拖拽手柄（顶部横条）或标题栏区域开始拖拽
- 拖拽距离超过阈值或拖拽速度超过速度阈值时，松开手指会自动关闭
- 未达到阈值时，面板会回弹到原位置
- 内容区域可以正常滚动，不会触发拖拽

### 事件

- `payment-confirm` - 支付确认时触发，事件详情包含：
  - `method`: 选择的支付方式（wechat/alipay/card）
  - `amount`: 支付金额
- `payment-close` - 支付面板关闭时触发

## 主题

组件会自动检测系统主题设置，支持亮色主题和暗色主题。使用 GitHub 风格的配色方案，所有颜色通过 CSS 变量管理，可以轻松自定义。

## 浏览器支持

- Chrome/Edge (最新版本)
- Firefox (最新版本)
- Safari (最新版本)
- 移动端浏览器

## 许可证

ISC
