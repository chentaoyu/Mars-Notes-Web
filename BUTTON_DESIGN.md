# Button 设计系统

## 设计理念

重新设计的按钮系统遵循以下原则：
- **简约现代**：干净的设计语言，避免过度装饰
- **高辨识度**：清晰的视觉层次，易于识别不同操作类型
- **主题一致**：完美适配紫葡萄色主题
- **交互反馈**：微妙的动画和过渡效果，提升用户体验

## 按钮变体

### 1. Default（主要操作）
- **用途**：主要操作按钮，如"登录"、"注册"、"保存"等
- **样式特点**：
  - 紫色渐变背景（from-purple-600 to-purple-700）
  - 白色文字
  - 柔和阴影（shadow-purple-500/25）
  - hover 时放大 1.02 倍，阴影加深
  - active 时缩小到 0.98 倍
  - 暗色模式自动适配

```tsx
<Button variant="default">保存</Button>
<Button variant="default" size="lg">登录</Button>
```

### 2. Destructive（危险操作）
- **用途**：删除、注销等危险操作
- **样式特点**：
  - 红色渐变背景（from-red-600 to-red-700）
  - 白色文字
  - 红色阴影提示危险性
  - 相同的缩放交互效果

```tsx
<Button variant="destructive">删除</Button>
<Button variant="destructive" size="sm">移除</Button>
```

### 3. Outline（次要操作）
- **用途**：取消、返回等次要操作
- **样式特点**：
  - 2px 紫色边框
  - 半透明白色背景，带背景模糊
  - 紫色文字
  - hover 时填充浅紫色背景

```tsx
<Button variant="outline">取消</Button>
<Button variant="outline" size="sm">返回</Button>
```

### 4. Secondary（辅助操作）
- **用途**：辅助性操作按钮
- **样式特点**：
  - 浅紫色渐变背景（from-purple-50 to-purple-100）
  - 深紫色文字
  - 柔和的背景过渡

```tsx
<Button variant="secondary">更多选项</Button>
```

### 5. Ghost（轻量操作）
- **用途**：图标按钮、工具栏按钮等
- **样式特点**：
  - 透明背景
  - 紫色文字
  - hover 时显示浅紫色背景

```tsx
<Button variant="ghost" size="icon">
  <Settings className="h-4 w-4" />
</Button>
```

### 6. Link（链接样式）
- **用途**：链接式按钮
- **样式特点**：
  - 无背景
  - 紫色文字
  - hover 时显示下划线

```tsx
<Button variant="link">了解更多</Button>
```

### 7. Success（成功操作）✨ 新增
- **用途**：确认、完成等成功操作
- **样式特点**：
  - 绿色渐变背景（from-green-600 to-green-700）
  - 白色文字
  - 绿色阴影

```tsx
<Button variant="success">完成</Button>
```

## 尺寸规格

### Small (sm)
- 高度：8 (32px)
- 内边距：px-3.5 py-2
- 文字：text-xs
- 圆角：rounded-md

```tsx
<Button size="sm">小按钮</Button>
```

### Default
- 高度：10 (40px)
- 内边距：px-5 py-2.5
- 文字：text-sm
- 圆角：rounded-lg

```tsx
<Button>默认按钮</Button>
```

### Large (lg)
- 高度：12 (48px)
- 内边距：px-8 py-3
- 文字：text-base
- 圆角：rounded-xl

```tsx
<Button size="lg">大按钮</Button>
```

### Icon
- 尺寸：10x10 (40x40px)
- 无内边距
- 适合图标

```tsx
<Button size="icon" variant="ghost">
  <Plus className="h-4 w-4" />
</Button>
```

## 设计细节

### 1. 渐变效果
- 使用 `bg-gradient-to-br`（从左上到右下）创建微妙的深度感
- 渐变色差控制在一个色阶内，避免过于强烈

### 2. 阴影系统
- 默认阴影：shadow-md，带颜色提示（25% 透明度）
- hover 阴影：shadow-lg，加深到 40% 透明度
- 阴影颜色与按钮颜色匹配，增强视觉连贯性

### 3. 交互动画
- **缩放效果**：
  - hover：scale-[1.02]（轻微放大）
  - active：scale-[0.98]（轻微缩小）
- **过渡时长**：duration-200（200ms）
- **缓动函数**：transition-all（平滑过渡所有属性）

### 4. 焦点状态
- 2px 紫色焦点环，50% 透明度
- 2px 偏移量，确保可见性
- 符合无障碍访问标准

### 5. 禁用状态
- 透明度：50%
- 饱和度降低（saturate-50）
- 禁用指针事件

### 6. 字体设置
- 字重：font-semibold（600）
- 字间距：tracking-wide（轻微拉宽）
- 提升可读性和专业感

### 7. 图标间距
- 默认 gap-2（8px）
- 自动处理图标与文字的间距

## 暗色模式适配

所有按钮变体都针对暗色模式进行了优化：
- 调整渐变起止色
- 调整阴影透明度和颜色
- 确保文字对比度符合标准

## 使用示例

```tsx
// 表单提交
<Button type="submit" size="lg">提交</Button>

// 危险操作
<Button variant="destructive" onClick={handleDelete}>
  删除账户
</Button>

// 对话框按钮组
<DialogFooter>
  <Button variant="outline" onClick={onCancel}>
    取消
  </Button>
  <Button onClick={onConfirm}>
    确认
  </Button>
</DialogFooter>

// 工具栏
<div className="flex gap-2">
  <Button variant="ghost" size="icon">
    <Edit className="h-4 w-4" />
  </Button>
  <Button variant="ghost" size="icon">
    <Trash className="h-4 w-4" />
  </Button>
</div>

// 加载状态
<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <Loader className="h-4 w-4 animate-spin" />
      加载中...
    </>
  ) : (
    "提交"
  )}
</Button>
```

## 设计优势

1. **品牌一致性**：紫葡萄主题贯穿所有变体
2. **视觉层次**：从实心到轮廓到幽灵，清晰的重要性层级
3. **交互愉悦**：微妙的动画增强用户体验
4. **无障碍友好**：足够的对比度和焦点指示
5. **性能优化**：使用 Tailwind CSS，无额外 JavaScript
6. **响应式设计**：自动适配不同屏幕尺寸和暗色模式
