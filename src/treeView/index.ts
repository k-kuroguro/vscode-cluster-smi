import * as vscode from 'vscode';
import { extensionName } from '../constants';
import type { ClusterSmiParser } from '../parser';
import type { ClusterSmiProcessManager } from '../processManager';
import { WelcomeViewContexts } from '../welcomeViewContext';
import { DeviceHighlightProvider } from './deviceHighlight';
import { ClusterSmiTreeDataProvider } from './treeDataProvider';

export function registerClusterSmiTreeView(parser: ClusterSmiParser, processManager: ClusterSmiProcessManager): vscode.Disposable[] {
   const treeDataProvider = new ClusterSmiTreeDataProvider();
   const treeView = vscode.window.createTreeView(`${extensionName}.treeView`, { treeDataProvider, showCollapseAll: true });
   return [
      treeDataProvider,
      treeView,
      vscode.window.registerFileDecorationProvider(new DeviceHighlightProvider()),
      vscode.commands.registerCommand(`${extensionName}.treeView.refresh`, () => {
         treeDataProvider.refresh();
      }),
      parser.onDidUpdate((output) => {
         if (output.nodes.length) {
            WelcomeViewContexts.setOutputIsEmpty(false);
            treeDataProvider.update(output);
         } else {
            WelcomeViewContexts.setOutputIsEmpty(true);
            treeDataProvider.update();
         }
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
