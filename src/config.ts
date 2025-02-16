import * as vscode from 'vscode';
import { extensionName } from './constants';

export class Config {
   private _onDidChangeConfig: vscode.EventEmitter<Config.ConfigItems | undefined> = new vscode.EventEmitter<Config.ConfigItems | undefined>();
   readonly onDidChangeConfig: vscode.Event<Config.ConfigItems | undefined> = this._onDidChangeConfig.event;

   private static instance: Config = new Config();
   private workspaceConfig: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration(extensionName);
   private disposables: vscode.Disposable[] = [];

   private constructor() {
      this.disposables.push(
         vscode.workspace.onDidChangeConfiguration((e) => {
            this.loadWorkspaceConfig();
            if (e.affectsConfiguration(`${extensionName}.${Config.ConfigItem.UseWarning}`)) this._onDidChangeConfig.fire([Config.ConfigItem.UseWarning]);
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

   get useWarning(): boolean {
      return this.workspaceConfig.get(Config.ConfigItem.UseWarning) ?? false;
   }

   set useWarning(allow: boolean) {
      this.workspaceConfig.update(Config.ConfigItem.UseWarning, allow, vscode.ConfigurationTarget.Global);
      this._onDidChangeConfig.fire([Config.ConfigItem.UseWarning]);
   }
}

export namespace Config {
   export const ConfigItem = {
      UseWarning: 'useWarning',
   } as const;
   export type ConfigItem = (typeof ConfigItem)[keyof typeof ConfigItem];
   export type ConfigItems = ConfigItem[];
}
