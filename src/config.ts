import * as vscode from 'vscode';
import { extensionName } from './constants';
import { DeviceInfoField, ProcessInfoField } from './types';

export class Config {
   private _onDidChange: vscode.EventEmitter<Config.ConfigItems> = new vscode.EventEmitter<Config.ConfigItems>();
   readonly onDidChange: vscode.Event<Config.ConfigItems> = this._onDidChange.event;

   private static instance: Config = new Config();
   private workspaceConfig: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration(extensionName);
   private disposables: vscode.Disposable[] = [this._onDidChange];

   private constructor() {
      this.disposables.push(
         vscode.workspace.onDidChangeConfiguration((e) => {
            this.loadWorkspaceConfig();
            const changedItems = Object.values(Config.ConfigItem).filter((item) => e.affectsConfiguration(`${extensionName}.${item}`));
            if (changedItems.length) this._onDidChange.fire(changedItems);
         }),
      );
   }

   static getInstance(): Config {
      return Config.instance;
   }

   loadWorkspaceConfig(): void {
      this.workspaceConfig = vscode.workspace.getConfiguration(extensionName);
   }

   dispose(): void {
      for (const disposable of this.disposables) {
         disposable.dispose();
      }
   }

   get execPath(): string {
      return this.workspaceConfig.get(Config.ConfigItem.ExecPath) || 'cluster-smi';
   }

   set execPath(path: string) {
      this.workspaceConfig.update(Config.ConfigItem.ExecPath, path, vscode.ConfigurationTarget.Global);
      this._onDidChange.fire([Config.ConfigItem.ExecPath]);
   }

   get deviceInfoFields(): DeviceInfoField[] {
      return this.workspaceConfig.get(Config.ConfigItem.DeviceInfoFields) ?? Object.values(DeviceInfoField);
   }

   set deviceInfoFields(fields: DeviceInfoField[]) {
      this.workspaceConfig.update(Config.ConfigItem.DeviceInfoFields, fields, vscode.ConfigurationTarget.Global);
      this._onDidChange.fire([Config.ConfigItem.DeviceInfoFields]);
   }

   get processInfoFields(): ProcessInfoField[] {
      return this.workspaceConfig.get(Config.ConfigItem.ProcessInfoFields) ?? Object.values(ProcessInfoField);
   }

   set processInfoFields(fields: ProcessInfoField[]) {
      this.workspaceConfig.update(Config.ConfigItem.ProcessInfoFields, fields, vscode.ConfigurationTarget.Global);
      this._onDidChange.fire([Config.ConfigItem.ProcessInfoFields]);
   }

   get nodeRegex(): string | undefined {
      return this.workspaceConfig.get(Config.ConfigItem.NodeRegex);
   }

   set nodeRegex(regex: string | undefined) {
      this.workspaceConfig.update(Config.ConfigItem.NodeRegex, regex, vscode.ConfigurationTarget.Global);
      this._onDidChange.fire([Config.ConfigItem.NodeRegex]);
   }
}

export namespace Config {
   export const ConfigItem = {
      ExecPath: 'execPath',
      DeviceInfoFields: 'deviceInfoFields',
      ProcessInfoFields: 'processInfoFields',
      NodeRegex: 'nodeRegex',
   } as const;
   export type ConfigItem = (typeof ConfigItem)[keyof typeof ConfigItem];
   export type ConfigItems = ConfigItem[];
}
