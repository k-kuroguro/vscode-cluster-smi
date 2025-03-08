import type * as vscode from 'vscode';
import { extensionName } from '../constants';
import type { ClusterSmiOutput, Device, DeviceInfoProcesses, Node, Process, WithParent } from '../types';
import { DeviceInfoField } from '../types';
import type { Element } from './types';
import { isDevice, isDeviceinfo, isNode, isProcess } from './utils';

type NodeKey = `node:${string}`; // "node:<hostname>"
type DeviceKey = `device:${string}.${string}`; // "device:<hostname>.<device_id>"
type DeviceInfoProcessesKey = `deviceInfo:${string}.${string}.processes`; // "deviceinfo:<hostname>.<device_id>.processes"
type ProcessKey = `process:${string}.${string}.processes.${number}`; // "process:<hostname>.<device_id>.processes.<pid>"
type Key = NodeKey | DeviceKey | DeviceInfoProcessesKey | ProcessKey;
type CollapsibleStateMap = Map<Key, vscode.TreeItemCollapsibleState.Collapsed | vscode.TreeItemCollapsibleState.Expanded>;

const stateKey = `${extensionName}.treeView.collapsibleState`;

export class CollapsibleStateStore {
   private collapsibleStateMap: CollapsibleStateMap;

   constructor(private workspaceState: vscode.Memento) {
      this.collapsibleStateMap = new Map(workspaceState.get(stateKey) ?? []);
   }

   get(element: Element): vscode.TreeItemCollapsibleState.Collapsed | vscode.TreeItemCollapsibleState.Expanded | undefined {
      const key = this.getKey(element);
      return key && this.collapsibleStateMap.get(key);
   }

   update(element: Element, state: vscode.TreeItemCollapsibleState.Collapsed | vscode.TreeItemCollapsibleState.Expanded): void {
      const key = this.getKey(element);
      if (key) {
         this.collapsibleStateMap.set(key, state);
      }
   }

   clear(): void {
      this.collapsibleStateMap.clear();
   }

   save(): void {
      this.workspaceState.update(stateKey, Array.from(this.collapsibleStateMap.entries()));
   }

   removeUnusedKeys(output: ClusterSmiOutput): void {
      const existsKeys = this.outputToKeys(output);
      for (const key of this.collapsibleStateMap.keys()) {
         if (!existsKeys.has(key)) {
            this.collapsibleStateMap.delete(key);
         }
      }
      this.save();
   }

   private outputToKeys(output: ClusterSmiOutput): Set<Key> {
      const keys = new Set<Key>();
      for (const node of output.nodes) {
         keys.add(this.getKey(node));
         for (const device of node.devices) {
            const wDevice = { parent: node, ...device };
            const wDeviceInfo = { parent: wDevice, field: DeviceInfoField.Processes, value: device.processes };
            keys.add(this.getKey(wDevice));
            keys.add(this.getKey(wDeviceInfo));
            for (const process of device.processes) {
               keys.add(this.getKey({ parent: wDeviceInfo, ...process }));
            }
         }
      }
      return keys;
   }

   private getKey(element: Node): NodeKey;
   private getKey(element: WithParent<Device>): DeviceKey;
   private getKey(element: WithParent<DeviceInfoProcesses>): DeviceInfoProcessesKey;
   private getKey(element: WithParent<Process>): ProcessKey;
   private getKey(element: Node | WithParent<Device> | WithParent<DeviceInfoProcesses> | WithParent<Process>): Key;
   private getKey(element: Element): Key | undefined;
   private getKey(element: Element): Key | undefined {
      if (isNode(element)) {
         return `node:${element.hostname}`;
      }
      if (isDevice(element)) {
         return `device:${element.parent.hostname}.${element.id}`;
      }
      if (isDeviceinfo(element) && element.field === DeviceInfoField.Processes) {
         return `deviceInfo:${element.parent.parent.hostname}.${element.parent.id}.processes`;
      }
      if (isProcess(element)) {
         return `process:${element.parent.parent.parent.hostname}.${element.parent.parent.id}.processes.${element.pid}`;
      }
   }
}
