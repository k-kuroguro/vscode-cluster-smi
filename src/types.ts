export interface Memory {
   used: number; // MiB
   total: number; // MiB
   percentage: number; // %
}

export interface Runtime {
   days: number;
   hours: number;
   minutes: number;
   seconds: number;
}

export interface Process {
   pid: number;
   usedGpuMemory: number; // MiB
   name: string;
   username: string;
   runtime: Runtime;
}

export interface Device {
   id: number;
   name: string;
   utilization: number; // %
   memory: Memory;
   fanSpeed: number; // %
   temperature: number; // °C
   powerUsage: number; // W
   processes: Process[];
}

export interface Node {
   hostname: string;
   devices: Device[];
}

export interface ClusterSmiOutput {
   timestamp: Date;
   nodes: Node[];
}

export const DeviceInfoField = {
   Utilization: 'utilization',
   Memory: 'memory',
   FanSpeed: 'fanSpeed',
   Temperature: 'temperature',
   PowerUsage: 'powerUsage',
   Processes: 'processes',
} as const;
export type DeviceInfoField = (typeof DeviceInfoField)[keyof typeof DeviceInfoField];

export type DeviceInfoProcesses = { field: typeof DeviceInfoField.Processes; value: Process[] };
export type DeviceInfo =
   | { field: typeof DeviceInfoField.Utilization; value: number }
   | { field: typeof DeviceInfoField.Memory; value: Memory }
   | { field: typeof DeviceInfoField.FanSpeed; value: number }
   | { field: typeof DeviceInfoField.Temperature; value: number }
   | { field: typeof DeviceInfoField.PowerUsage; value: number }
   | DeviceInfoProcesses;

export const ProcessInfoField = {
   Pid: 'pid',
   UsedGpuMemory: 'usedGpuMemory',
   Username: 'username',
   Runtime: 'runtime',
} as const;
export type ProcessInfoField = (typeof ProcessInfoField)[keyof typeof ProcessInfoField];

export type ProcessInfo =
   | { field: typeof ProcessInfoField.Pid; value: number }
   | { field: typeof ProcessInfoField.UsedGpuMemory; value: number }
   | { field: typeof ProcessInfoField.Username; value: string }
   | { field: typeof ProcessInfoField.Runtime; value: Runtime };

export interface ExitStatus {
   code?: number;
   signal?: NodeJS.Signals;
}

export type WithParent<T> = T extends Device
   ? T & { parent: Node }
   : T extends DeviceInfo
     ? T & { parent: WithParent<Device> }
     : T extends Process
       ? T & { parent: WithParent<DeviceInfoProcesses> }
       : T extends ProcessInfo
         ? T & { parent: WithParent<Process> }
         : never;
