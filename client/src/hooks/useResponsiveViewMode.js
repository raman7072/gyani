import { useState, useEffect } from 'react';

/**
 * Hook to provide responsive default view mode:
 * - Desktop (>= 768px): 'directory' default view
 * - Mobile (< 768px): 'grid' default view
 * Adjusts automatically across desktop and mobile, while preserving explicit user selection.
 */
export function useResponsiveViewMode(desktopDefault = 'directory') {
  const [userChoice, setUserChoice] = useState(null);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile((prev) => (prev !== mobile ? mobile : prev));
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const currentViewMode = userChoice || (isMobile ? 'grid' : desktopDefault);

  return [currentViewMode, setUserChoice];
}
