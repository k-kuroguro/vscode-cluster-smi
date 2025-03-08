import * as vscode from 'vscode';
import { DeviceInfoField, ProcessInfoField } from '../types';
import type { Device, DeviceInfo, Node, Process, ProcessInfo } from '../types';
import { availableDeviceColor, createDeviceUri } from './deviceHighlight';
import { isAvailableDevice, padNumber } from './utils';

export type TreeItem = TimestampItem | NodeItem | DeviceItem | DeviceInfoItem | ProcessItem | ProcessInfoItem;

export class TimestampItem extends vscode.TreeItem {
   constructor(timestamp: Date) {
      super(TimestampItem.getLabel(timestamp), vscode.TreeItemCollapsibleState.None);
      this.contextValue = 'timestamp';
      this.iconPath = new vscode.ThemeIcon('clock');
      this.tooltip = `Last updated: ${this.label}`;
   }

   private static getLabel(timestamp: Date): string {
      return timestamp
         .toISOString()
         .replace('T', ' ')
         .replace(/\.\d+Z$/, ''); // YYYY-MM-DDTHH:mm:ss.fffZ -> YYYY-MM-DD HH:mm:ss
   }
}

export class NodeItem extends vscode.TreeItem {
   constructor(node: Node, collapsibleState?: vscode.TreeItemCollapsibleState) {
      super(node.hostname, collapsibleState ?? vscode.TreeItemCollapsibleState.Collapsed);
      this.contextValue = 'node';
      this.iconPath = new vscode.ThemeIcon('server-environment');
      this.tooltip = node.hostname;
   }
}

export class DeviceItem extends vscode.TreeItem {
   constructor(device: Device, collapsibleState?: vscode.TreeItemCollapsibleState) {
      super(device.id.toString(), collapsibleState ?? vscode.TreeItemCollapsibleState.Collapsed);
      this.contextValue = 'device';
      this.description = device.name;
      this.iconPath = new vscode.ThemeIcon('chip', isAvailableDevice(device) ? availableDeviceColor : undefined);
      this.resourceUri = createDeviceUri({ available: isAvailableDevice(device) });
      this.tooltip = `${device.id}: ${device.name}`;
   }
}

export class DeviceInfoItem extends vscode.TreeItem {
   constructor(deviceInfo: DeviceInfo, collapsibleState?: vscode.TreeItemCollapsibleState) {
      super(DeviceInfoItem.getLabel(deviceInfo), collapsibleState ?? DeviceInfoItem.getCollapsibleState(deviceInfo));
      this.contextValue = 'gpuInfo';
      this.description = DeviceInfoItem.getDescription(deviceInfo);
      this.tooltip = `${DeviceInfoItem.getLabel(deviceInfo)}: ${DeviceInfoItem.getDescription(deviceInfo)}`;
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
            return `${value.length} running`;
      }
   }

   private static getCollapsibleState(deviceInfo: DeviceInfo): vscode.TreeItemCollapsibleState {
      return deviceInfo.field === DeviceInfoField.Processes ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None;
   }
}

export class ProcessItem extends vscode.TreeItem {
   constructor(process: Process, collapsibleState?: vscode.TreeItemCollapsibleState) {
      super(process.name, collapsibleState ?? vscode.TreeItemCollapsibleState.Collapsed);
      this.contextValue = 'process';
      this.description = process.username;
      this.tooltip = process.name;
   }
}

export class ProcessInfoItem extends vscode.TreeItem {
   constructor(processInfo: ProcessInfo) {
      super(ProcessInfoItem.getLabel(processInfo), vscode.TreeItemCollapsibleState.None);
      this.contextValue = 'processInfo';
      this.description = ProcessInfoItem.getDescription(processInfo);
      this.tooltip = `${ProcessInfoItem.getLabel(processInfo)}: ${ProcessInfoItem.getDescription(processInfo)}`;
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
