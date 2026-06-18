import React, { useState, useEffect, createContext, useContext } from 'react';

const NavigationContext = createContext(null);

export function RouterProvider({ children }) {
  const [currentPath, setCurrentPath] = useState(window.location.pathname || '/');

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (to) => {
    window.history.pushState({}, '', to);
    setCurrentPath(to);
  };

  return (
    <NavigationContext.Provider value={{ currentPath, navigate }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useRouter() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
}

export function Link({ to, children, className }) {
  const { currentPath, navigate } = useRouter();
  const handleClick = (e) => {
    e.preventDefault();
    navigate(to);
  };
  
  // Support active states if needed
  const isActive = currentPath === to;
  const computedClassName = typeof className === 'function' ? className({ isActive }) : className;

  return (
    <a href={to} onClick={handleClick} className={computedClassName}>
      {children}
    </a>
  );
}

export function Route({ path, children }) {
  const { currentPath } = useRouter();
  return currentPath === path ? children : null;
}
