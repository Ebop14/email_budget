import { useState, useCallback } from 'react';
import * as tauri from '../lib/tauri';
import type { ParsedTransaction } from '../types';

interface CameraState {
  isCapturing: boolean;
  isProcessing: boolean;
  error: string | null;
  ocrText: string | null;
  transaction: ParsedTransaction | null;
}

export function useCamera() {
  const [state, setState] = useState<CameraState>({
    isCapturing: false,
    isProcessing: false,
    error: null,
    ocrText: null,
    transaction: null,
  });

  const captureReceipt = useCallback(async (source: 'camera' | 'library') => {
    setState((prev) => ({ ...prev, isCapturing: true, error: null }));

    try {
      const result = await tauri.captureReceiptPhoto(source);

      if (!result.text) {
        setState((prev) => ({
          ...prev,
          isCapturing: false,
          error: 'No text detected in image. Try capturing again with better lighting.',
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        isCapturing: false,
        isProcessing: true,
        ocrText: result.text,
      }));

      // Parse the OCR text into a transaction
      const transaction = await tauri.importReceiptFromOcr(result.text, result.confidence);

      setState((prev) => ({
        ...prev,
        isProcessing: false,
        transaction,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // Don't treat cancellation as an error
      if (message.toLowerCase().includes('cancel')) {
        setState((prev) => ({ ...prev, isCapturing: false }));
      } else {
        setState((prev) => ({
          ...prev,
          isCapturing: false,
          isProcessing: false,
          error: message,
        }));
      }
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isCapturing: false,
      isProcessing: false,
      error: null,
      ocrText: null,
      transaction: null,
    });
  }, []);

  return {
    ...state,
    captureReceipt,
    reset,
  };
}
