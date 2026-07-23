/**
 * HotelFlow Design System - Color Palette
 * Based on dataviz color formula: categorical + status
 *
 * Status colors: good (open), warning (in_progress), critical (closed/resolved)
 * Priority colors: low (neutral), medium (warning), high (critical)
 */

export const LIGHT_MODE = {
  // Surface & Text
  surface: '#ffffff',
  surfaceSecondary: '#f8f9fa',
  text: '#1a1a1a',
  textSecondary: '#666666',
  textTertiary: '#999999',
  border: '#e0e0e0',

  // Status colors (semantic)
  statusOpen: '#0066cc',      // Blue - open tickets
  statusInProgress: '#ff9800', // Amber - in progress
  statusClosed: '#4caf50',    // Green - closed/resolved

  // Priority colors
  priorityLow: '#4caf50',     // Green
  priorityMedium: '#ff9800',  // Amber
  priorityHigh: '#f44336',    // Red

  // Category colors (categorical, fixed order)
  categoryComplaint: '#f44336',    // Red
  categoryInquiry: '#2196f3',      // Blue
  categoryBooking: '#4caf50',      // Green
  categoryOther: '#9e9e9e',        // Gray

  // Interactive
  hover: '#f5f5f5',
  focus: '#0066cc',
  focusRing: '#b3d9ff',

  // Sentiment
  sentimentPositive: '#4caf50',
  sentimentNeutral: '#9e9e9e',
  sentimentNegative: '#f44336',
};

export const DARK_MODE = {
  // Surface & Text
  surface: '#1e1e1e',
  surfaceSecondary: '#2d2d2d',
  text: '#ffffff',
  textSecondary: '#b0b0b0',
  textTertiary: '#808080',
  border: '#3a3a3a',

  // Status colors (adjusted for dark mode)
  statusOpen: '#4da6ff',      // Lighter blue
  statusInProgress: '#ffb74d', // Lighter amber
  statusClosed: '#66bb6a',    // Lighter green

  // Priority colors
  priorityLow: '#66bb6a',     // Green
  priorityMedium: '#ffb74d',  // Amber
  priorityHigh: '#ef5350',    // Red

  // Category colors
  categoryComplaint: '#ef5350',    // Red
  categoryInquiry: '#42a5f5',      // Blue
  categoryBooking: '#66bb6a',      // Green
  categoryOther: '#bdbdbd',        // Gray

  // Interactive
  hover: '#333333',
  focus: '#4da6ff',
  focusRing: '#1a4d80',

  // Sentiment
  sentimentPositive: '#66bb6a',
  sentimentNeutral: '#bdbdbd',
  sentimentNegative: '#ef5350',
};

export const getStatusColor = (status, isDark = false) => {
  const palette = isDark ? DARK_MODE : LIGHT_MODE;

  switch (status) {
    case 'open':
      return palette.statusOpen;
    case 'in_progress':
      return palette.statusInProgress;
    case 'closed':
      return palette.statusClosed;
    default:
      return palette.textTertiary;
  }
};

export const getPriorityColor = (priority, isDark = false) => {
  const palette = isDark ? DARK_MODE : LIGHT_MODE;

  switch (priority) {
    case 'low':
      return palette.priorityLow;
    case 'medium':
      return palette.priorityMedium;
    case 'high':
      return palette.priorityHigh;
    default:
      return palette.textSecondary;
  }
};

export const getCategoryColor = (category, isDark = false) => {
  const palette = isDark ? DARK_MODE : LIGHT_MODE;

  switch (category) {
    case 'complaint':
      return palette.categoryComplaint;
    case 'inquiry':
      return palette.categoryInquiry;
    case 'booking':
      return palette.categoryBooking;
    case 'other':
      return palette.categoryOther;
    default:
      return palette.textSecondary;
  }
};
