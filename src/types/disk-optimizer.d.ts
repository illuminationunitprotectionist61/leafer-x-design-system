/**
 * DiskOptimizer TypeScript 类型定义
 * 
 * 为 DiskOptimizer 服务提供完整的类型支持
 */

/**
 * 风险等级
 */
export type RiskLevel = 'safe' | 'caution' | 'danger';

/**
 * 磁盘状态
 */
export type DiskStatus = 'normal' | 'warning' | 'critical';

/**
 * 可清理项目
 */
export interface CleanableItem {
  id: string;
  name: string;
  paths: string[];
  description: string;
  impact: string;
  riskLevel: RiskLevel;
  size?: number;
  sizeFormatted?: string;
  fileList?: FileInfo[];
  accessiblePaths?: number;
  failedPaths?: number;
}

/**
 * 文件信息
 */
export interface FileInfo {
  path: string;
  size: number;
  isDirectory: boolean;
}

/**
 * 磁盘信息
 */
export interface DiskInfo {
  drive: string;
  totalSize: number;
  freeSpace: number;
  usedSpace: number;
  usagePercent: number;
  totalSizeFormatted: string;
  freeSpaceFormatted: string;
  usedSpaceFormatted: string;
  status: DiskStatus;
}

/**
 * 分类信息
 */
export interface CategoryInfo {
  name: string;
  type: string;
  size: number;
  sizeFormatted: string;
  color: string;
  accessiblePaths: number;
}

/**
 * 大文件信息
 */
export interface LargeFileInfo {
  path: string;
  size: number;
  sizeFormatted: string;
  lastModified: string;
  isSafeToDelete: boolean;
}

/**
 * 清理结果
 */
export interface CleanupResult {
  id: string;
  name: string;
  success: boolean;
  cleanedSize: number;
  cleanedSizeFormatted: string;
  cleanedFiles: string[];
  errors?: Array<{ path: string; error: string }>;
  skippedCount?: number;
}

/**
 * 优化建议
 */
export interface OptimizationSuggestion {
  id: string;
  title: string;
  description: string;
  currentStatus: string;
  potentialSaving: number;
  potentialSavingFormatted: string;
  impact: string;
  action: string;
  command: string;
  category: string;
}

/**
 * 分析结果
 */
export interface AnalysisResult {
  success: boolean;
  diskInfo: DiskInfo | null;
  categories: CategoryInfo[];
  largeFiles: LargeFileInfo[];
  cleanableItems: CleanableItem[];
  analyzedAt?: string;
  error?: string;
  errorCode?: string;
}

/**
 * 清理操作结果
 */
export interface CleanOperationResult {
  success: boolean;
  results: CleanupResult[];
  totalCleaned: number;
  totalCleanedFormatted: string;
  cleanedAt: string;
  error?: string;
}

/**
 * 路径分析结果
 */
export interface PathAnalysisResult {
  success: boolean;
  size?: number;
  fileInfo?: FileInfo;
  reason?: string;
  error?: string;
}

/**
 * DiskOptimizer 类接口
 */
export interface IDiskOptimizer {
  analyzeDisk(): Promise<AnalysisResult>;
  getDiskInfo(drive: string): Promise<DiskInfo | null>;
  analyzeCategories(): Promise<CategoryInfo[]>;
  findLargeFiles(drive: string, limit: number): Promise<LargeFileInfo[]>;
  analyzeCleanableItems(): Promise<CleanableItem[]>;
  cleanItems(itemIds: string[]): Promise<CleanOperationResult>;
  getOptimizationSuggestions(): Promise<OptimizationSuggestion[]>;
  getCleanupHistory(limit?: number): Promise<any[]>;
}
