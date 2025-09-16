# Tooltip Component

A reusable tooltip component that provides helpful information on hover or focus.

## Components

### Tooltip

The base tooltip component that wraps any content and shows a tooltip on hover/focus.

### InfoTooltip

A specialized tooltip component that displays an info icon (ℹ️) with a tooltip.

## Usage

### Basic Tooltip

```tsx
import { Tooltip } from "libComponents/Tooltip";

<Tooltip content="This is helpful information">
  <button>Hover me</button>
</Tooltip>;
```

### Info Icon Tooltip

```tsx
import { InfoTooltip } from "libComponents/Tooltip";

<label>
  Field Name
  <InfoTooltip content="This field is used for..." />
</label>;
```

## Props

### Tooltip Props

- `content`: The tooltip text to display
- `children`: The element that triggers the tooltip
- `className`: Additional CSS classes
- `position`: Tooltip position ("top", "bottom", "left", "right")

### InfoTooltip Props

- `content`: The tooltip text to display
- `className`: Additional CSS classes for the info icon
- `position`: Tooltip position ("top", "bottom", "left", "right")

## Features

- **Smart positioning**: Automatically adjusts position to stay on screen
- **Accessibility**: Supports both mouse and keyboard navigation
- **Delayed display**: 300ms delay prevents accidental triggers
- **Responsive**: Adapts to different screen sizes
- **Customizable**: Easy to style and position

## Examples

### Form Labels

```tsx
<label className="flex items-center">
  <span>Email Address</span>
  <InfoTooltip content="We'll use this for account notifications" />
</label>
```

### Buttons

```tsx
<Tooltip content="This action cannot be undone">
  <button className="bg-red-500">Delete</button>
</Tooltip>
```

### Custom Content

```tsx
<Tooltip content="Click to learn more about this feature">
  <div className="cursor-pointer">
    <span>Advanced Settings</span>
    <Icon className="ml-2" />
  </div>
</Tooltip>
```
