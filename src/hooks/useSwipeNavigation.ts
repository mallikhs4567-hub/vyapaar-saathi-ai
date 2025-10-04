import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SwipeNavigationOptions {
  threshold?: number;
  enabled?: boolean;
}

export const useSwipeNavigation = ({ 
  threshold = 50, 
  enabled = true 
}: SwipeNavigationOptions = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const routes = ['/', '/auth', '/dashboard'];

  const getCurrentRouteIndex = () => {
    return routes.indexOf(location.pathname);
  };

  const handleSwipe = () => {
    const swipeDistance = touchEndX.current - touchStartX.current;
    const currentIndex = getCurrentRouteIndex();

    if (Math.abs(swipeDistance) < threshold) return;

    if (swipeDistance > 0) {
      // Swipe right - go to previous page
      if (currentIndex > 0) {
        navigate(routes[currentIndex - 1]);
      }
    } else {
      // Swipe left - go to next page
      if (currentIndex < routes.length - 1) {
        navigate(routes[currentIndex + 1]);
      }
    }
  };

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
      handleSwipe();
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, location.pathname]);

  return { currentRoute: location.pathname, routes };
};
