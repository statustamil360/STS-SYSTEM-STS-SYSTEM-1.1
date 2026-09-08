import { useEffect, useRef } from 'react';

const useLiveRefresh = (eventName, handler) => {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!eventName || !handlerRef.current) return undefined;
    const onEvent = () => handlerRef.current?.();
    window.addEventListener(eventName, onEvent);
    return () => window.removeEventListener(eventName, onEvent);
  }, [eventName]);
};

export default useLiveRefresh;
