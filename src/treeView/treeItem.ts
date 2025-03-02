import * as vscode from 'vscode';
import { DeviceInfoField, ProcessInfoField } from '../types';
import type { Device, DeviceInfo, Node, Process, ProcessInfo } from '../types';
import { availableDeviceColor, createDeviceUri } from './deviceHighlight';
import { isAvailableDevice, padNumber } from './utils';

export type TreeItem = NodeItem | DeviceItem | DeviceInfoItem | ProcessItem | ProcessInfoItem;

export class NodeItem extends vscode.TreeItem {
   constructor(node: Node) {
      super(node.hostname, vscode.TreeItemCollapsibleState.Collapsed);
      this.contextValue = 'node';
      this.iconPath = new vscode.ThemeIcon('server-environment');
   }
}

export class DeviceItem extends vscode.TreeItem {
   constructor(device: Device) {
      super(device.id.toString(), vscode.TreeItemCollapsibleState.Collapsed);
      this.contextValue = 'device';
      this.description = device.name;
      this.iconPath = new vscode.ThemeIcon('chip', isAvailableDevice(device) ? availableDeviceColor : undefined);
      this.resourceUri = createDeviceUri({ available: isAvailableDevice(device) });
   }
}

export class DeviceInfoItem extends vscode.TreeItem {
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

export class ProcessItem extends vscode.TreeItem {
   constructor(process: Process) {
      super(process.name, vscode.TreeItemCollapsibleState.Collapsed);
      this.contextValue = 'process';
      this.description = process.username;
   }
}

export class ProcessInfoItem extends vscode.TreeItem {
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
