import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const PageRefreshContext = createContext(null);

export const PageRefreshProvider = ({ children }) => {
  const handlerRef = useRef(null);
  const [refreshing, setRefreshing] = useState(false);

  const registerRefresh = useCallback((handler) => {
    handlerRef.current = handler;
    return () => {
      if (handlerRef.current === handler) handlerRef.current = null;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!handlerRef.current) return false;
    setRefreshing(true);
    try {
      await handlerRef.current();
      return true;
    } finally {
      setRefreshing(false);
    }
  }, []);

  const value = useMemo(() => ({ registerRefresh, refresh, refreshing }), [registerRefresh, refresh, refreshing]);

  return (
    <PageRefreshContext.Provider value={value}>
      {children}
    </PageRefreshContext.Provider>
  );
};

export const usePageRefreshRegister = (handler) => {
  const ctx = useContext(PageRefreshContext);
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!ctx?.registerRefresh) return undefined;
    return ctx.registerRefresh(() => handlerRef.current?.());
  }, [ctx]);
};

export const usePageRefresh = () => {
  const ctx = useContext(PageRefreshContext);
  if (!ctx) {
    return { refresh: async () => false, refreshing: false };
  }
  return { refresh: ctx.refresh, refreshing: ctx.refreshing };
};

export default PageRefreshContext;
