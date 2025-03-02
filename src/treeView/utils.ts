import type { Device } from '../types';

export function padNumber(n: number, width: number): string {
   return n.toString().padStart(width, ' ');
}

export function isAvailableDevice(device: Device): boolean {
   return device.processes.length === 0;
}
