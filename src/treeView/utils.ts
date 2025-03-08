import type { Device, DeviceInfo, Node, Process, ProcessInfo, WithParent } from '../types';
import { DeviceInfoField, ProcessInfoField } from '../types';
import type { Element } from './types';

export function padNumber(n: number, width: number): string {
   return n.toString().padStart(width, ' ');
}

export function isAvailableDevice(device: Device): boolean {
   return device.processes.length === 0;
}

export function isNode(element: Element): element is Node {
   return 'devices' in element;
}

export function isDevice(element: Element): element is WithParent<Device> {
   return 'processes' in element;
}

export function isDeviceinfo(element: Element): element is WithParent<DeviceInfo> {
   return 'field' in element && (Object.values(DeviceInfoField) as string[]).includes(element.field);
}

export function isProcess(element: Element): element is WithParent<Process> {
   return 'pid' in element;
}

export function isProcessInfo(element: Element): element is WithParent<ProcessInfo> {
   return 'field' in element && (Object.values(ProcessInfoField) as string[]).includes(element.field);
}
