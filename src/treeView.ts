import * as vscode from 'vscode';
import type { ClusterSmiParser } from './parser';
import type { ClusterSmiOutput, Device, Memory, Node, Process, Runtime } from './types';

function padNumber(n: number, width: number): string {
   return n.toString().padStart(width, ' ');
}

class NodeItem extends vscode.TreeItem {
   constructor(node: Node) {
      super(node.hostname, vscode.TreeItemCollapsibleState.Collapsed);
      this.contextValue = 'node';
   }
}

class DeviceItem extends vscode.TreeItem {
   constructor(device: Device) {
      super(device.id.toString(), vscode.TreeItemCollapsibleState.Collapsed);
      this.contextValue = 'device';
      this.description = device.name;
   }
}

const DeviceInfoField = {
   Utilization: 'utilization',
   Memory: 'memory',
   FanSpeed: 'fanSpeed',
   Temperature: 'temperature',
   PowerUsage: 'powerUsage',
   Processes: 'processes',
} as const;
type DeviceInfoField = (typeof DeviceInfoField)[keyof typeof DeviceInfoField];

type DeviceInfo =
   | { field: typeof DeviceInfoField.Utilization; value: number }
   | { field: typeof DeviceInfoField.Memory; value: Memory }
   | { field: typeof DeviceInfoField.FanSpeed; value: number }
   | { field: typeof DeviceInfoField.Temperature; value: number }
   | { field: typeof DeviceInfoField.PowerUsage; value: number }
   | { field: typeof DeviceInfoField.Processes; value: Process[] };

class DeviceInfoItem extends vscode.TreeItem {
   constructor(deviceInfo: DeviceInfo) {
      super(DeviceInfoItem.getLabel(deviceInfo), DeviceInfoItem.getCollapsibleState(deviceInfo));
      this.contextValue = 'gpuInfo';
      this.description = DeviceInfoItem.getDescription(deviceInfo);
   }

   private static getLabel(deviceInfo: DeviceInfo): string {
      const { field } = deviceInfo;
      switch (field) {
         case DeviceInfoField.Utilization:
            return 'GPU-Util';
         case DeviceInfoField.Memory:
            return 'Memory-Usage';
         case DeviceInfoField.FanSpeed:
            return 'Fan';
         case DeviceInfoField.Temperature:
            return 'Temp';
         case DeviceInfoField.PowerUsage:
            return 'Power';
         case DeviceInfoField.Processes:
            return 'Processes';
      }
   }

   private static getDescription(deviceInfo: DeviceInfo): string {
      const { field, value } = deviceInfo;
      switch (field) {
         case DeviceInfoField.Utilization:
            return `${padNumber(value, 3)} %`;
         case DeviceInfoField.Memory:
            return `${padNumber(value.used, 5)} MiB / ${padNumber(value.total, 5)} MiB (${padNumber(value.percentage, 3)} %)`;
         case DeviceInfoField.FanSpeed:
            return `${padNumber(value, 3)} %`;
         case DeviceInfoField.Temperature:
            return `${padNumber(value, 3)} °C`;
         case DeviceInfoField.PowerUsage:
            return `${padNumber(value, 3)} W`;
         case DeviceInfoField.Processes:
            return `Running: ${value.length}`;
      }
   }

   private static getCollapsibleState(deviceInfo: DeviceInfo): vscode.TreeItemCollapsibleState {
      return deviceInfo.field === DeviceInfoField.Processes ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None;
   }
}

class ProcessItem extends vscode.TreeItem {
   constructor(process: Process) {
      super(process.name, vscode.TreeItemCollapsibleState.Collapsed);
      this.contextValue = 'process';
      this.description = process.username;
   }
}

const ProcessInfoField = {
   Pid: 'pid',
   UsedGpuMemory: 'usedGpuMemory',
   Username: 'username',
   Runtime: 'runtime',
} as const;
type ProcessInfoField = (typeof ProcessInfoField)[keyof typeof ProcessInfoField];

type ProcessInfo =
   | { field: typeof ProcessInfoField.Pid; value: number }
   | { field: typeof ProcessInfoField.UsedGpuMemory; value: number }
   | { field: typeof ProcessInfoField.Username; value: string }
   | { field: typeof ProcessInfoField.Runtime; value: Runtime };

class ProcessInfoItem extends vscode.TreeItem {
   constructor(processInfo: ProcessInfo) {
      super(ProcessInfoItem.getLabel(processInfo), vscode.TreeItemCollapsibleState.None);
      this.contextValue = 'processInfo';
      this.description = ProcessInfoItem.getDescription(processInfo);
   }

   private static getLabel(processInfo: ProcessInfo): string {
      const { field } = processInfo;
      switch (field) {
         case ProcessInfoField.Pid:
            return 'PID';
         case ProcessInfoField.UsedGpuMemory:
            return 'GPU Mem';
         case ProcessInfoField.Username:
            return 'User';
         case ProcessInfoField.Runtime:
            return 'Runtime';
      }
   }

   private static getDescription(processInfo: ProcessInfo): string {
      const { field, value } = processInfo;
      switch (field) {
         case ProcessInfoField.Pid:
            return value.toString();
         case ProcessInfoField.UsedGpuMemory:
            return `${padNumber(value, 5)} MiB`;
         case ProcessInfoField.Username:
            return value;
         case ProcessInfoField.Runtime: {
            const { days, hours, minutes, seconds } = value;
            return `${padNumber(days, 2)} d ${padNumber(hours, 2)} h ${padNumber(minutes, 2)} m ${padNumber(seconds, 2)} s`;
         }
      }
   }
}

type Element = Node | Device | DeviceInfo | Process | ProcessInfo;
type TreeItem = NodeItem | DeviceItem | DeviceInfoItem | ProcessItem | ProcessInfoItem;

function isNode(element: Element): element is Node {
   return 'devices' in element;
}

function isDevice(element: Element): element is Device {
   return 'processes' in element;
}

function isDeviceinfo(element: Element): element is DeviceInfo {
   return 'field' in element && (Object.values(DeviceInfoField) as string[]).includes(element.field);
}

function isProcess(element: Element): element is Process {
   return 'pid' in element;
}

function isProcessInfo(element: Element): element is ProcessInfo {
   return 'field' in element && (Object.values(ProcessInfoField) as string[]).includes(element.field);
}

class ClusterSmiTreeDataProvider implements vscode.TreeDataProvider<Element> {
   private _onDidChangeTreeData: vscode.EventEmitter<Element | Element[] | undefined> = new vscode.EventEmitter<Element | Element[] | undefined>();
   readonly onDidChangeTreeData: vscode.Event<Element | Element[] | undefined> = this._onDidChangeTreeData.event;

   private output?: ClusterSmiOutput;
   private disposables: vscode.Disposable[] = [this._onDidChangeTreeData];

   refresh(): void {
      this._onDidChangeTreeData.fire(undefined);
   }

   getTreeItem(element: Element): TreeItem {
      if (isNode(element)) {
         return new NodeItem(element);
      }

      if (isDevice(element)) {
         return new DeviceItem(element);
      }

      if (isDeviceinfo(element)) {
         return new DeviceInfoItem(element);
      }

      if (isProcess(element)) {
         return new ProcessItem(element);
      }

      if (isProcessInfo(element)) {
         return new ProcessInfoItem(element);
      }

      return element;
   }

   getChildren(element?: Element): Element[] {
      if (!this.output) {
         return [];
      }

      if (!element) {
         return this.output.nodes;
      }

      if (isNode(element)) {
         return element.devices;
      }

      if (isDevice(element)) {
         return [
            { field: DeviceInfoField.Utilization, value: element.utilization },
            { field: DeviceInfoField.Memory, value: element.memory },
            { field: DeviceInfoField.FanSpeed, value: element.fanSpeed },
            { field: DeviceInfoField.Temperature, value: element.temperature },
            { field: DeviceInfoField.PowerUsage, value: element.powerUsage },
            { field: DeviceInfoField.Processes, value: element.processes },
         ];
      }

      if (isDeviceinfo(element) && element.field === DeviceInfoField.Processes) {
         return element.value;
      }

      if (isProcess(element)) {
         return [
            { field: ProcessInfoField.Pid, value: element.pid },
            { field: ProcessInfoField.UsedGpuMemory, value: element.usedGpuMemory },
            { field: ProcessInfoField.Username, value: element.username },
            { field: ProcessInfoField.Runtime, value: element.runtime },
         ];
      }

      return [];
   }

   update(output: ClusterSmiOutput): void {
      this.output = output;
      this.refresh();
   }

   dispose(): void {
      for (const disposable of this.disposables) {
         disposable.dispose();
      }
   }
}

export function registerClusterSmiTreeView(context: vscode.ExtensionContext, parser: ClusterSmiParser): vscode.Disposable[] {
   const treeDataProvider = new ClusterSmiTreeDataProvider();
   return [
      treeDataProvider,
      vscode.window.registerTreeDataProvider('clusterSmi', treeDataProvider),
      parser.onDidUpdate((output) => {
         treeDataProvider.update(output);
      }),
   ];
}
