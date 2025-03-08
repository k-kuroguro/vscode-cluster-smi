import * as vscode from 'vscode';
import { Config } from '../config';
import type { ClusterSmiOutput } from '../types';
import { DeviceInfoField, ProcessInfoField } from '../types';
import type { CollapsibleStateStore } from './collapsibleStateStore';
import { DeviceInfoItem, DeviceItem, NodeItem, ProcessInfoItem, ProcessItem, TimestampItem, type TreeItem } from './treeItem';
import type { Element } from './types';
import { isDevice, isDeviceinfo, isNode, isProcess, isProcessInfo } from './utils';

export class ClusterSmiTreeDataProvider implements vscode.TreeDataProvider<Element> {
   private _onDidChangeTreeData: vscode.EventEmitter<Element | Element[] | undefined> = new vscode.EventEmitter<Element | Element[] | undefined>();
   readonly onDidChangeTreeData: vscode.Event<Element | Element[] | undefined> = this._onDidChangeTreeData.event;

   private output?: ClusterSmiOutput;
   private disposables: vscode.Disposable[] = [this._onDidChangeTreeData];
   private config = Config.getInstance();

   constructor(private collapsibleStateStore: CollapsibleStateStore) {
      this.disposables.push(
         this.config.onDidChange((items) => {
            if (items.some((item) => item === Config.ConfigItem.DeviceInfoFields || item === Config.ConfigItem.ProcessInfoFields)) {
               this.refresh();
            }
         }),
         (() => {
            const d = this.onDidChangeTreeData(() => {
               if (this.output) {
                  this.collapsibleStateStore.removeUnusedKeys(this.output);
                  d.dispose();
               }
            });
            return d;
         })(), // Run only once after the first update
      );
   }

   refresh(): void {
      this._onDidChangeTreeData.fire(undefined);
   }

   getTreeItem(element: Element): TreeItem {
      if (isNode(element)) {
         return new NodeItem(element, this.collapsibleStateStore.get(element));
      }

      if (isDevice(element)) {
         return new DeviceItem(element, this.collapsibleStateStore.get(element));
      }

      if (isDeviceinfo(element)) {
         return new DeviceInfoItem(element, this.collapsibleStateStore.get(element));
      }

      if (isProcess(element)) {
         return new ProcessItem(element, this.collapsibleStateStore.get(element));
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
         return element.devices.map((device) => ({ ...device, parent: element }));
      }

      if (isDevice(element)) {
         return this.config.deviceInfoFields.map((field) => {
            switch (field) {
               case DeviceInfoField.Utilization:
                  return { field, value: element.utilization, parent: element };
               case DeviceInfoField.Memory:
                  return { field, value: element.memory, parent: element };
               case DeviceInfoField.FanSpeed:
                  return { field, value: element.fanSpeed, parent: element };
               case DeviceInfoField.Temperature:
                  return { field, value: element.temperature, parent: element };
               case DeviceInfoField.PowerUsage:
                  return { field, value: element.powerUsage, parent: element };
               case DeviceInfoField.Processes:
                  return { field, value: element.processes, parent: element };
            }
         });
      }

      if (isDeviceinfo(element) && element.field === DeviceInfoField.Processes) {
         return element.value.map((process) => ({ ...process, parent: element }));
      }

      if (isProcess(element)) {
         return this.config.processInfoFields.map((field) => {
            switch (field) {
               case ProcessInfoField.Pid:
                  return { field, value: element.pid, parent: element };
               case ProcessInfoField.UsedGpuMemory:
                  return { field, value: element.usedGpuMemory, parent: element };
               case ProcessInfoField.Username:
                  return { field, value: element.username, parent: element };
               case ProcessInfoField.Runtime:
                  return { field, value: element.runtime, parent: element };
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
