import * as vscode from 'vscode';
import { extensionName } from './constants';

export class Config {
   private _onDidChangeConfig: vscode.EventEmitter<Config.ConfigItems> = new vscode.EventEmitter<Config.ConfigItems>();
   readonly onDidChangeConfig: vscode.Event<Config.ConfigItems> = this._onDidChangeConfig.event;

   private static instance: Config = new Config();
   private workspaceConfig: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration(extensionName);
   private disposables: vscode.Disposable[] = [];

   private constructor() {
      this.disposables.push(
         vscode.workspace.onDidChangeConfiguration((e) => {
            this.loadWorkspaceConfig();
            if (e.affectsConfiguration(`${extensionName}.${Config.ConfigItem.ExecPath}`)) this._onDidChangeConfig.fire([Config.ConfigItem.ExecPath]);
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
      return this.workspaceConfig.get(Config.ConfigItem.ExecPath) ?? 'cluster-smi';
   }

   set execPath(path: string) {
      this.workspaceConfig.update(Config.ConfigItem.ExecPath, path, vscode.ConfigurationTarget.Global);
      this._onDidChangeConfig.fire([Config.ConfigItem.ExecPath]);
   }
}

export namespace Config {
   export const ConfigItem = {
      ExecPath: 'execPath',
   } as const;
   export type ConfigItem = (typeof ConfigItem)[keyof typeof ConfigItem];
   export type ConfigItems = ConfigItem[];
}
