/**
 * Formatting utilities for reports
 * Provides consistent currency formatting, color-coding, and visual indicators
 */

import { Badge } from "@/components/ui/badge";

/**
 * Format currency in Indian Rupee (INR) format
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format number with thousand separators (Indian format)
 */
export const formatNumber = (num: number, decimals = 2): string => {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number, decimals = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Get color class based on value range
 * @param value - The value to evaluate
 * @param thresholds - Object with good, warning, and danger thresholds
 * @param inverse - If true, lower is better (e.g., for wastage)
 */
export const getValueColor = (
  value: number,
  thresholds: { good: number; warning: number },
  inverse = false
): string => {
  if (inverse) {
    if (value <= thresholds.good) return "text-green-600";
    if (value <= thresholds.warning) return "text-yellow-600";
    return "text-red-600";
  } else {
    if (value >= thresholds.good) return "text-green-600";
    if (value >= thresholds.warning) return "text-yellow-600";
    return "text-red-600";
  }
};

/**
 * Get background color class based on value range
 */
export const getValueBgColor = (
  value: number,
  thresholds: { good: number; warning: number },
  inverse = false
): string => {
  if (inverse) {
    if (value <= thresholds.good) return "bg-green-50 border-green-200";
    if (value <= thresholds.warning) return "bg-yellow-50 border-yellow-200";
    return "bg-red-50 border-red-200";
  } else {
    if (value >= thresholds.good) return "bg-green-50 border-green-200";
    if (value >= thresholds.warning) return "bg-yellow-50 border-yellow-200";
    return "bg-red-50 border-red-200";
  }
};

/**
 * Get a status badge configuration for performance metrics
 */
export const getPerformanceBadgeProps = (
  value: number,
  thresholds: { excellent: number; good: number; average: number }
): { variant: string; label: string; className?: string } => {
  if (value >= thresholds.excellent) {
    return {
      variant: "default",
      label: "Excellent",
      className: "bg-green-500",
    };
  }
  if (value >= thresholds.good) {
    return { variant: "default", label: "Good", className: "bg-blue-500" };
  }
  if (value >= thresholds.average) {
    return { variant: "secondary", label: "Average" };
  }
  return { variant: "destructive", label: "Poor" };
};

/**
 * Get indicator for stock levels
 */
export const getStockLevelIndicator = (
  currentStock: number,
  reorderLevel: number
): { color: string; label: string } => {
  const ratio = currentStock / reorderLevel;

  if (ratio <= 0.5) {
    return { color: "text-red-600", label: "Critical" };
  }
  if (ratio <= 1.0) {
    return { color: "text-orange-600", label: "Low" };
  }
  if (ratio <= 1.5) {
    return { color: "text-yellow-600", label: "Reorder Soon" };
  }
  return { color: "text-green-600", label: "Good" };
};

/**
 * Get color-coded card classes for summary cards
 */
export const getSummaryCardClasses = (
  variant: "success" | "warning" | "danger" | "info" | "neutral"
): string => {
  const variants = {
    success: "bg-gradient-to-br from-green-50 to-green-100 border-green-200",
    warning: "bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200",
    danger: "bg-gradient-to-br from-red-50 to-red-100 border-red-200",
    info: "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200",
    neutral: "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200",
  };

  return variants[variant];
};

/**
 * Get text color for summary card values
 */
export const getSummaryValueColor = (
  variant: "success" | "warning" | "danger" | "info" | "neutral"
): string => {
  const colors = {
    success: "text-green-600",
    warning: "text-yellow-700",
    danger: "text-red-600",
    info: "text-blue-600",
    neutral: "text-gray-700",
  };

  return colors[variant];
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

/**
 * Format date and time
 */
export const formatDateTime = (date: string | Date): string => {
  return new Date(date).toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Format date only
 */
export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};
