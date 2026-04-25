import { useState, useCallback, type ReactNode } from 'react';
import ConfirmModal from './ConfirmModal';

export function useConfirm(): [
  (message: string) => Promise<boolean>,
  ReactNode,
] {
  const [state, setState] = useState<{
    message: string;
    resolve: (v: boolean) => void;
  } | null>(null);

  const requestConfirm = useCallback((message: string): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setState({ message, resolve });
    });
  }, []);

  const handleConfirm = () => {
    state?.resolve(true);
    setState(null);
  };

  const handleCancel = () => {
    state?.resolve(false);
    setState(null);
  };

  const modal = state ? (
    <ConfirmModal
      message={state.message}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  ) : null;

  return [requestConfirm, modal];
}
