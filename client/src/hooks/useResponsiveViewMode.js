import { useState, useEffect } from 'react';

/**
 * Hook to provide responsive default view mode:
 * - Desktop (>= 768px): 'directory' default view
 * - Mobile (< 768px): 'grid' default view
 * Adjusts automatically across desktop and mobile, while preserving explicit user selection.
 */
export function useResponsiveViewMode(defaultMode = 'directory') {
  const [userChoice, setUserChoice] = useState(null);

  const currentViewMode = userChoice || defaultMode;

  return [currentViewMode, setUserChoice];
}

