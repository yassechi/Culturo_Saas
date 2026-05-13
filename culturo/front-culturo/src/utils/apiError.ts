import { isAxiosError } from 'axios';

export function apiMessage(e: unknown, fallback: string): string {
  if (isAxiosError(e)) {
    const msg = e.response?.data?.message;
    if (typeof msg === 'string' && msg.length > 0) return msg;
    if (Array.isArray(msg)) return (msg as string[]).join(', ');
  }
  return fallback;
}
