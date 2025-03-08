import type { Device, DeviceInfo, Node, Process, ProcessInfo, WithParent } from '../types';

export type Element = Date | NodeFilter | Node | WithParent<Device> | WithParent<DeviceInfo> | WithParent<Process> | WithParent<ProcessInfo>;

export interface NodeFilter {
   regex: string;
}
