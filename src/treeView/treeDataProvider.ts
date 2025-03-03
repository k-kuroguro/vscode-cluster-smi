import * as vscode from 'vscode';
import { Config } from '../config';
import type { ClusterSmiOutput, Device, DeviceInfo, Node, Process, ProcessInfo } from '../types';
import { DeviceInfoField, ProcessInfoField } from '../types';
import { DeviceInfoItem, DeviceItem, NodeItem, ProcessInfoItem, ProcessItem, TimestampItem, type TreeItem } from './treeItem';

export type Element = Date | Node | Device | DeviceInfo | Process | ProcessInfo;

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

export class ClusterSmiTreeDataProvider implements vscode.TreeDataProvider<Element> {
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

      return new TimestampItem(element);
   }

   getChildren(element?: Element): Element[] {
      if (!this.output) {
         return [];
      }

      if (!element) {
         return [this.output.timestamp, ...this.output.nodes];
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

   update(output?: ClusterSmiOutput): void {
      this.output = output;
      this.refresh();
   }

   dispose(): void {
      for (const disposable of this.disposables) {
         disposable.dispose();
      }
   }
}
