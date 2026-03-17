/**
 * Leafer Design System - TypeScript 类型定义
 */

export interface ThemeColors {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  background: string;
  surface: string;
  border: string;
  text: {
    primary: string;
    secondary: string;
    disabled: string;
    inverse: string;
  };
}

export interface Typography {
  fontFamily: string;
  fontSize: {
    xs: number;
    sm: number;
    base: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
    '4xl': number;
  };
  fontWeight: {
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
}

export interface Spacing {
  0: number;
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
  6: number;
  8: number;
  10: number;
  12: number;
  16: number;
}

export interface BorderRadius {
  none: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
  full: number;
}

export interface Shadow {
  x: number;
  y: number;
  blur: number;
  color: string;
}

export interface Shadows {
  sm: Shadow;
  md: Shadow;
  lg: Shadow;
  xl: Shadow;
}

export interface DesignSystemConfig {
  name: string;
  version: string;
  theme: {
    light: ThemeColors;
    dark: ThemeColors;
  };
  typography: Typography;
  spacing: Spacing;
  borderRadius: BorderRadius;
  shadows: Shadows;
}

export interface UIElement {
  type: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string | { type: string; stops: string[] };
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number | { topLeft: number; topRight: number; bottomLeft: number; bottomRight: number };
  shadow?: Shadow;
  text?: string;
  fontSize?: number;
  fontWeight?: number | string;
  fontFamily?: string;
  textAlign?: string;
  opacity?: number;
  children?: UIElement[];
}

export interface Template {
  width: number;
  height: number;
  backgroundColor?: string;
  elements: UIElement[];
}

export interface GeneratorOptions {
  name?: string;
  primaryColor?: string;
  secondaryColor?: string;
  mode?: 'light' | 'dark';
  fontFamily?: string;
}

export interface RendererOptions {
  pixelRatio?: number;
  backgroundColor?: string;
  maxCacheSize?: number;
  outputDir?: string;
}

export interface RenderResult {
  url: string;
  base64: string;
  width: number;
  height: number;
  format: string;
  pixelRatio: number;
  cacheKey: string;
  cached: boolean;
  renderTime: number;
}

export declare class ThemeConfig {
  constructor(options?: GeneratorOptions);
  mode: 'light' | 'dark';
  name: string;
  colors: { light: ThemeColors; dark: ThemeColors };
  typography: Typography;
  spacing: Spacing;
  borderRadius: BorderRadius;
  shadows: Shadows;
  getColors(): ThemeColors;
  setMode(mode: 'light' | 'dark'): void;
}

export declare class AdvancedComponentGenerator {
  constructor(config: ThemeConfig);
  generateTable(
    headers: string[],
    rows: string[][],
    options?: { width?: number; rowHeight?: number; x?: number; y?: number }
  ): UIElement;
  generateModal(
    title: string,
    content: string,
    options?: { width?: number; x?: number; y?: number }
  ): UIElement;
  generateDropdown(
    label: string,
    items: { label: string; selected: boolean }[],
    options?: { width?: number; isOpen?: boolean; x?: number; y?: number }
  ): UIElement;
  generateTabs(
    tabs: string[],
    activeIndex?: number,
    options?: { tabWidth?: number; x?: number; y?: number }
  ): UIElement;
  generateSwitch(isOn?: boolean, options?: { x?: number; y?: number }): UIElement;
  generateCheckbox(checked?: boolean, label?: string, options?: { x?: number; y?: number }): UIElement;
  generateRadio(selected?: boolean, label?: string, options?: { x?: number; y?: number }): UIElement;
}

export declare class ResponsiveTemplateGenerator {
  constructor(config: ThemeConfig);
  generateMobileLoginPage(): Template;
  generateMobileHomePage(): Template;
  generateTabletDashboard(): Template;
}

export declare class DesignSystemProGenerator {
  constructor(options?: GeneratorOptions);
  config: ThemeConfig;
  generate(): DesignSystemConfig;
  export(outputDir: string): DesignSystemConfig;
}

export declare class LeaferRenderer {
  constructor(options?: RendererOptions);
  render(config: {
    width: number;
    height: number;
    elements: UIElement[];
    options?: {
      format?: string;
      quality?: number;
      pixelRatio?: number;
      backgroundColor?: string;
    };
  }): Promise<RenderResult>;
}

// 便捷函数
export declare function createGenerator(options?: GeneratorOptions): DesignSystemProGenerator;
export declare function createRenderer(options?: RendererOptions): LeaferRenderer;
export declare function generateDesignSystem(
  options?: GeneratorOptions,
  outputDir?: string
): DesignSystemConfig;
export declare function renderTemplate(
  template: Template,
  options?: { outputDir?: string; format?: string; quality?: number; pixelRatio?: number }
): Promise<RenderResult>;
export declare function renderTemplates(
  templates: Template[],
  options?: { outputDir?: string; format?: string; quality?: number; pixelRatio?: number }
): Promise<Array<{ success: boolean; template: string; result?: RenderResult; error?: string }>>;
