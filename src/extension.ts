import type * as vscode from 'vscode';
import { Config } from './config';
import { OutputChannelLogger } from './logger';
import { ClusterSmiParser } from './parser';
import { ClusterSmiProcessManager } from './processManager';
import { registerClusterSmiTreeView } from './treeView';

export function activate(context: vscode.ExtensionContext) {
   const disposables: vscode.Disposable[] = [];

   const logger = new OutputChannelLogger();
   disposables.push(logger);

   const config = Config.getInstance();
   disposables.push(config);

   const parser = new ClusterSmiParser();
   const processManager = new ClusterSmiProcessManager();
   processManager.start();
   disposables.push(parser, processManager);

   disposables.push(
      parser.onDidUpdate((output) => {
         logger.info(output);
      }),
      parser.onError((error) => {
         logger.error(error);
      }),
      processManager.onStdout((data) => {
         parser.write(data);
      }),
      processManager.onStderr((data) => {
         console.error(data.toString());
      }),
   );

   disposables.push(...registerClusterSmiTreeView(context, parser));

   context.subscriptions.push(...disposables);
}

export function deactivate() {}
