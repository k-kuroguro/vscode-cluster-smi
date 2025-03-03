import * as vscode from 'vscode';
import { extensionName } from '../constants';
import type { ClusterSmiOutput } from '../types';
import { DeviceHighlightProvider } from './deviceHighlight';
import { ClusterSmiTreeDataProvider, type Element } from './treeDataProvider';

export class ClusterSmiTreeView {
   private readonly treeDataProvider: ClusterSmiTreeDataProvider;
   private treeView: vscode.TreeView<Element>;
   private disposables: vscode.Disposable[] = [];

   constructor() {
      this.treeDataProvider = new ClusterSmiTreeDataProvider();
      this.treeView = vscode.window.createTreeView(`${extensionName}.treeView`, { treeDataProvider: this.treeDataProvider, showCollapseAll: true });
      this.disposables.push(
         this.treeDataProvider,
         this.treeView,
         vscode.window.registerFileDecorationProvider(new DeviceHighlightProvider()),
         vscode.commands.registerCommand(`${extensionName}.treeView.refresh`, () => {
            this.treeDataProvider.refresh();
         }),
      );
   }

   update(output?: ClusterSmiOutput): void {
      this.treeDataProvider.update(output);
   }

   dispose(): void {
      for (const disposable of this.disposables) {
         disposable.dispose();
      }
   }
}
