import type { ExitStatus } from './types';

export function isInvalidDate(date: Date) {
   return Number.isNaN(date.getTime());
}

export function isProcessExitedWithError({ code, signal }: ExitStatus) {
   return code !== 0 && signal !== 'SIGTERM';
}
