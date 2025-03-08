import type { Device, DeviceInfo, Node, Process, ProcessInfo, WithParent } from '../types';

export type Element = Date | Node | WithParent<Device> | WithParent<DeviceInfo> | WithParent<Process> | WithParent<ProcessInfo>;
