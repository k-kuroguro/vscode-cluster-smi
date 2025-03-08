import * as vscode from 'vscode';
import { extensionName } from '../constants';
import type { ClusterSmiOutput } from '../types';
import { CollapsibleStateStore } from './collapsibleStateStore';
import { DeviceHighlightProvider } from './deviceHighlight';
import { ClusterSmiTreeDataProvider } from './treeDataProvider';
import type { Element } from './types';

export class ClusterSmiTreeView {
   private readonly treeDataProvider: ClusterSmiTreeDataProvider;
   private collapsibleStateStore: CollapsibleStateStore;
   private treeView: vscode.TreeView<Element>;
   private disposables: vscode.Disposable[] = [];

   constructor(context: vscode.ExtensionContext) {
      this.collapsibleStateStore = new CollapsibleStateStore(context.workspaceState);
      this.treeDataProvider = new ClusterSmiTreeDataProvider(this.collapsibleStateStore);
      this.treeView = vscode.window.createTreeView(`${extensionName}.treeView`, { treeDataProvider: this.treeDataProvider, showCollapseAll: true });
      this.disposables.push(
         this.treeDataProvider,
         this.treeView,
         this.treeView.onDidCollapseElement((e) => {
            this.collapsibleStateStore.update(e.element, vscode.TreeItemCollapsibleState.Collapsed);
            this.collapsibleStateStore.save();
         }),
         this.treeView.onDidExpandElement((e) => {
            this.collapsibleStateStore.update(e.element, vscode.TreeItemCollapsibleState.Expanded);
            this.collapsibleStateStore.save();
         }),
         vscode.window.registerFileDecorationProvider(new DeviceHighlightProvider()),
         vscode.commands.registerCommand(`${extensionName}.treeView.refresh`, () => {
            this.treeDataProvider.refresh();
         }),
      );
   }

   clearCache(): void {
      this.collapsibleStateStore.clear();
      this.collapsibleStateStore.save();
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
