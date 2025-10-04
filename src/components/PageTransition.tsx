import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: ReactNode;
}

export const PageTransition = ({ children }: PageTransitionProps) => {
  const location = useLocation();

  return (
    <div 
      key={location.pathname}
      className="animate-page-slide-in"
    >
      {children}
    </div>
  );
};
