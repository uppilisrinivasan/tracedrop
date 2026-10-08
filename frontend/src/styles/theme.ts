/**
 * TraceDrop Design System - Theme Configuration
 *
 * Centralized color palette and design tokens for the consumer app.
 * Supports light and dark modes.
 */

export const colors = {
  // Primary Colors (Trust, Health)
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },

  // Success Colors (Health, Go)
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#145231',
  },

  // Warning Colors (Caution, Defer)
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fcd34d',
    300: '#fbbf24',
    400: '#f59e0b',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
    800: '#92400e',
    900: '#78350f',
  },

  // Danger Colors (Urgent, Action Needed)
  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  // Grayscale
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  // Info Colors
  info: {
    50: '#ecf0ff',
    100: '#e0e7ff',
    500: '#6366f1',
    600: '#4f46e5',
  },

  // Semantic Colors
  semantic: {
    bg: {
      primary: '#ffffff',
      secondary: '#f9fafb',
      tertiary: '#f3f4f6',
    },
    text: {
      primary: '#1f2937',
      secondary: '#6b7280',
      tertiary: '#9ca3af',
    },
    border: '#e5e7eb',
  },

  // Health Status Colors
  health: {
    healthy: '#10b981',
    warning: '#f59e0b',
    urgent: '#ef4444',
  },

  // Vital Sign Grade Colors
  vitals: {
    normal: '#10b981',
    elevated: '#f59e0b',
    high: '#ef4444',
    critical: '#dc2626',
  },
};

export const typography = {
  fontFamily: {
    base: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    mono: '"Courier New", monospace',
  },
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
    '4xl': '40px',
  },
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },
  letterSpacing: {
    tight: '-0.02em',
    normal: '0',
    wide: '0.02em',
  },
};

export const spacing = {
  0: '0',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
};

export const borderRadius = {
  none: '0',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
};

export const shadows = {
  none: 'none',
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
};

export const transitions = {
  fast: '150ms ease-in-out',
  base: '300ms ease-in-out',
  slow: '500ms ease-in-out',
};

// Responsive Breakpoints
export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// Dark Mode Colors (overrides for dark mode)
export const darkModeColors = {
  semantic: {
    bg: {
      primary: '#111827',
      secondary: '#1f2937',
      tertiary: '#374151',
    },
    text: {
      primary: '#f3f4f6',
      secondary: '#d1d5db',
      tertiary: '#9ca3af',
    },
    border: '#374151',
  },
};

// Component-Specific Tokens
export const componentTokens = {
  // Button
  button: {
    height: '40px',
    paddingX: '16px',
    paddingY: '8px',
    borderRadius: borderRadius.md,
    fontWeight: typography.fontWeight.semibold,
  },

  // Input
  input: {
    height: '40px',
    paddingX: '12px',
    paddingY: '8px',
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.base,
  },

  // Card
  card: {
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    shadow: shadows.md,
  },

  // Badge
  badge: {
    paddingX: '8px',
    paddingY: '4px',
    borderRadius: borderRadius.full,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
};

// Utility Functions
export function getColorByStatus(
  status: 'healthy' | 'warning' | 'urgent'
): string {
  switch (status) {
    case 'healthy':
      return colors.health.healthy;
    case 'warning':
      return colors.health.warning;
    case 'urgent':
      return colors.health.urgent;
    default:
      return colors.gray[500];
  }
}

export function getColorByUrgency(
  urgency: 'routine' | 'soon' | 'urgent' | 'critical'
): string {
  switch (urgency) {
    case 'routine':
      return colors.success[600];
    case 'soon':
      return colors.warning[600];
    case 'urgent':
      return colors.danger[600];
    case 'critical':
      return colors.danger[900];
    default:
      return colors.gray[500];
  }
}

export function getColorByVitalGrade(grade: string): string {
  switch (grade) {
    case 'Normal':
      return colors.vitals.normal;
    case 'Elevated':
    case 'Low':
      return colors.vitals.elevated;
    case 'High':
      return colors.vitals.high;
    case 'Critical':
      return colors.vitals.critical;
    default:
      return colors.gray[500];
  }
}

// Export theme object
export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  breakpoints,
  componentTokens,
};

export default theme;
