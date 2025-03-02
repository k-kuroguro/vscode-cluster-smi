import * as vscode from 'vscode';
import { extensionName } from '../constants';
import type { ClusterSmiParser } from '../parser';
import type { ClusterSmiProcessManager } from '../processManager';
import { DeviceHighlightProvider } from './deviceHighlight';
import { ClusterSmiTreeDataProvider } from './treeDataProvider';

export function registerClusterSmiTreeView(parser: ClusterSmiParser, processManager: ClusterSmiProcessManager): vscode.Disposable[] {
   const treeDataProvider = new ClusterSmiTreeDataProvider();
   return [
      treeDataProvider,
      vscode.window.registerTreeDataProvider(`${extensionName}.treeView`, treeDataProvider),
      vscode.window.registerFileDecorationProvider(new DeviceHighlightProvider()),
      parser.onDidUpdate((output) => {
         treeDataProvider.update(output);
      }),
      processManager.onExit(() => {
         // For both successful and error exits.
         treeDataProvider.update();
      }),
      processManager.onError((error) => {
         // For errors like spawn ENOENT (process start errors).
         treeDataProvider.update();
      }),
   ];
}
