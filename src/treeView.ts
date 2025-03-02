import * as vscode from 'vscode';
import { Config } from './config';
import { uriScheme } from './constants';
import type { ClusterSmiParser } from './parser';
import type { ClusterSmiOutput, Device, Memory, Node, Process, Runtime } from './types';
import { DeviceInfoField, ProcessInfoField } from './types';

const deviceAuthority = 'device';
const availableDeviceColor = new vscode.ThemeColor('terminal.ansiGreen');

interface DeviceUriQuery {
   available: boolean;
}

function createDeviceUri(query: DeviceUriQuery): vscode.Uri {
   return vscode.Uri.parse(`${uriScheme}://${deviceAuthority}?${query.available ? 'available=true' : ''}`);
}

function isDeviceUri(uri: vscode.Uri): boolean {
   return uri.scheme === uriScheme && uri.authority === deviceAuthority;
}

function parseQuery(query: string): DeviceUriQuery {
   const searchParams = new URLSearchParams(query);
   return {
      available: searchParams.get('available') === 'true',
   };
}

class DeviceHighlightProvider implements vscode.FileDecorationProvider {
   async provideFileDecoration(uri: vscode.Uri, token: vscode.CancellationToken): Promise<vscode.FileDecoration | undefined> {
      if (isDeviceUri(uri)) {
         const query = parseQuery(uri.query);
         if (query.available) {
            return {
               color: availableDeviceColor,
               tooltip: 'Available',
               propagate: false,
            };
         }
      }
   }
}

function padNumber(n: number, width: number): string {
   return n.toString().padStart(width, ' ');
}

function isAvailableDevice(device: Device): boolean {
   return device.processes.length === 0;
}

class NodeItem extends vscode.TreeItem {
   constructor(node: Node) {
      super(node.hostname, vscode.TreeItemCollapsibleState.Collapsed);
      this.contextValue = 'node';
      this.iconPath = new vscode.ThemeIcon('server-environment');
   }
}

class DeviceItem extends vscode.TreeItem {
   constructor(device: Device) {
      super(device.id.toString(), vscode.TreeItemCollapsibleState.Collapsed);
      this.contextValue = 'device';
      this.description = device.name;
      this.iconPath = new vscode.ThemeIcon('chip', isAvailableDevice(device) ? availableDeviceColor : undefined);
      this.resourceUri = createDeviceUri({ available: isAvailableDevice(device) });
   }
}

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
   private config = Config.getInstance();

   constructor() {
      this.disposables.push(
         this.config.onDidChangeConfig((items) => {
            if (items.some((item) => item === Config.ConfigItem.DeviceInfoFields || item === Config.ConfigItem.ProcessInfoFields)) {
               this.refresh();
            }
         }),
      );
   }

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
         return this.config.deviceInfoFields.map((field) => {
            switch (field) {
               case DeviceInfoField.Utilization:
                  return { field, value: element.utilization };
               case DeviceInfoField.Memory:
                  return { field, value: element.memory };
               case DeviceInfoField.FanSpeed:
                  return { field, value: element.fanSpeed };
               case DeviceInfoField.Temperature:
                  return { field, value: element.temperature };
               case DeviceInfoField.PowerUsage:
                  return { field, value: element.powerUsage };
               case DeviceInfoField.Processes:
                  return { field, value: element.processes };
            }
         });
      }

      if (isDeviceinfo(element) && element.field === DeviceInfoField.Processes) {
         return element.value;
      }

      if (isProcess(element)) {
         return this.config.processInfoFields.map((field) => {
            switch (field) {
               case ProcessInfoField.Pid:
                  return { field, value: element.pid };
               case ProcessInfoField.UsedGpuMemory:
                  return { field, value: element.usedGpuMemory };
               case ProcessInfoField.Username:
                  return { field, value: element.username };
               case ProcessInfoField.Runtime:
                  return { field, value: element.runtime };
            }
         });
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
      vscode.window.registerFileDecorationProvider(new DeviceHighlightProvider()),
      parser.onDidUpdate((output) => {
         treeDataProvider.update(output);
      }),
   ];
}
