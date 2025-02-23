import * as vscode from 'vscode';
import type { ClusterSmiParser } from './parser';
import type { ClusterSmiOutput, Device, Node, Process } from './types';

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
   Utilization: 'Utilization',
   Memory: 'Memory',
   FanSpeed: 'FanSpeed',
   Temperature: 'Temperature',
   PowerUsage: 'PowerUsage',
   Processes: 'Processes',
} as const;
type DeviceInfoField = (typeof DeviceInfoField)[keyof typeof DeviceInfoField];

class DeviceInfoItem extends vscode.TreeItem {
   constructor(
      readonly device: Device,
      readonly field: DeviceInfoField,
   ) {
      super(DeviceInfoItem.getLabel(device, field), field === DeviceInfoField.Processes ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);
      this.contextValue = 'gpuInfo';
      this.description = DeviceInfoItem.getDescription(device, field);
   }

   private static getLabel(device: Device, field: DeviceInfoField): string {
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

   private static getDescription(device: Device, field: DeviceInfoField): string {
      switch (field) {
         case DeviceInfoField.Utilization:
            return `${padNumber(device.utilization, 3)} %`;
         case DeviceInfoField.Memory:
            return `${padNumber(device.memory.used, 5)} MiB / ${padNumber(device.memory.total, 5)} MiB (${padNumber(device.memory.percentage, 3)} %)`;
         case DeviceInfoField.FanSpeed:
            return `${padNumber(device.fanSpeed, 3)} %`;
         case DeviceInfoField.Temperature:
            return `${padNumber(device.temperature, 3)} °C`;
         case DeviceInfoField.PowerUsage:
            return `${padNumber(device.powerUsage, 3)} W`;
         case DeviceInfoField.Processes:
            return `Running: ${device.processes.length}`;
      }
   }
}

class ProcessItem extends vscode.TreeItem {
   constructor(process: Process) {
      super(process.name, vscode.TreeItemCollapsibleState.Collapsed);
      this.description = process.username;
      this.contextValue = 'process';
   }
}

const ProcessInfoField = {
   Pid: 'Pid',
   UsedGpuMemory: 'UsedGpuMemory',
   Username: 'Username',
   Runtime: 'Runtime',
} as const;
type ProcessInfoField = (typeof ProcessInfoField)[keyof typeof ProcessInfoField];

class ProcessInfoItem extends vscode.TreeItem {
   constructor(
      process: Process,
      readonly field: ProcessInfoField,
   ) {
      super(ProcessInfoItem.getLabel(process, field), vscode.TreeItemCollapsibleState.None);
      this.description = ProcessInfoItem.getDescription(process, field);
      this.contextValue = 'processInfo';
   }

   private static getLabel(process: Process, field: ProcessInfoField): string {
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

   private static getDescription(process: Process, field: ProcessInfoField): string {
      switch (field) {
         case ProcessInfoField.Pid:
            return process.pid.toString();
         case ProcessInfoField.UsedGpuMemory:
            return `${padNumber(process.usedGpuMemory, 5)} MiB`;
         case ProcessInfoField.Username:
            return process.username;
         case ProcessInfoField.Runtime:
            return `${padNumber(process.runtime.days, 2)} d ${padNumber(process.runtime.hours, 2)} h ${padNumber(process.runtime.minutes, 2)} m ${padNumber(process.runtime.seconds, 2)} s`;
      }
   }
}

type Element = Node | Device | DeviceInfoItem | Process | ProcessInfoItem;
type TreeItem = NodeItem | DeviceItem | DeviceInfoItem | ProcessItem | ProcessInfoItem;

function isNode(element: Element): element is Node {
   return 'devices' in element;
}

function isDevice(element: Element): element is Device {
   return 'processes' in element;
}

function isProcess(element: Element): element is Process {
   return 'pid' in element;
}

class ClusterSmiTreeDataProvider implements vscode.TreeDataProvider<Element> {
   private _onDidChangeTreeData: vscode.EventEmitter<Element | Element[] | undefined> = new vscode.EventEmitter<Element | Element[] | undefined>();
   readonly onDidChangeTreeData: vscode.Event<Element | Element[] | undefined> = this._onDidChangeTreeData.event;

   private output?: ClusterSmiOutput;

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

      if (isProcess(element)) {
         return new ProcessItem(element);
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
            new DeviceInfoItem(element, DeviceInfoField.Utilization),
            new DeviceInfoItem(element, DeviceInfoField.Memory),
            new DeviceInfoItem(element, DeviceInfoField.FanSpeed),
            new DeviceInfoItem(element, DeviceInfoField.Temperature),
            new DeviceInfoItem(element, DeviceInfoField.PowerUsage),
            new DeviceInfoItem(element, DeviceInfoField.Processes),
         ];
      }

      if (element instanceof DeviceInfoItem && element.field === DeviceInfoField.Processes) {
         return element.device.processes;
      }

      if (isProcess(element)) {
         return [
            new ProcessInfoItem(element, ProcessInfoField.Pid),
            new ProcessInfoItem(element, ProcessInfoField.UsedGpuMemory),
            new ProcessInfoItem(element, ProcessInfoField.Username),
            new ProcessInfoItem(element, ProcessInfoField.Runtime),
         ];
      }

      return [];
   }

   update(output: ClusterSmiOutput): void {
      this.output = output;
      this.refresh();
   }
}

export function registerClusterSmiTreeView(context: vscode.ExtensionContext, parser: ClusterSmiParser): vscode.Disposable[] {
   const treeDataProvider = new ClusterSmiTreeDataProvider();
   return [
      vscode.window.registerTreeDataProvider('clusterSmi', treeDataProvider),
      parser.onDidUpdate((output) => {
         treeDataProvider.update(output);
      }),
   ];
}
