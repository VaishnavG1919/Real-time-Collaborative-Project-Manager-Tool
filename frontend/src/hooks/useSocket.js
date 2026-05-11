import { useEffect } from 'react';
import { useSocket as useSocketCtx } from '../context/SocketContext';

// Convenience hook: auto-removes listener on unmount
export const useSocketEvent = (event, handler, deps = []) => {
  const { on } = useSocketCtx();
  useEffect(() => {
    const cleanup = on(event, handler);
    return cleanup;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};