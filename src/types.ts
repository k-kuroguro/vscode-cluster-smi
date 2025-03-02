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

export const ProcessInfoField = {
   Pid: 'pid',
   UsedGpuMemory: 'usedGpuMemory',
   Username: 'username',
   Runtime: 'runtime',
} as const;
export type ProcessInfoField = (typeof ProcessInfoField)[keyof typeof ProcessInfoField];
