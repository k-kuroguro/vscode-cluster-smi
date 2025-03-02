import * as vscode from 'vscode';
import type { ClusterSmiParser } from '../parser';
import { DeviceHighlightProvider } from './deviceHighlight';
import { ClusterSmiTreeDataProvider } from './treeDataProvider';

export function registerClusterSmiTreeView(context: vscode.ExtensionContext, parser: ClusterSmiParser): vscode.Disposable[] {
   const treeDataProvider = new ClusterSmiTreeDataProvider();
   return [
      treeDataProvider,
      vscode.window.registerTreeDataProvider('cluster-smi.treeView', treeDataProvider),
      vscode.window.registerFileDecorationProvider(new DeviceHighlightProvider()),
      parser.onDidUpdate((output) => {
         treeDataProvider.update(output);
      }),
   ];
}
