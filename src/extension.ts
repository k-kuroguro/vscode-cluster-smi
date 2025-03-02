import * as vscode from 'vscode';
import { Config } from './config';
import { extensionName } from './constants';
import { type Logger, OutputChannelLogger } from './logger';
import { ClusterSmiParser, type ParseError } from './parser';
import { ClusterSmiProcessManager, ProcessAlreadyRunningError } from './processManager';
import { registerClusterSmiTreeView } from './treeView';

function handleCmdError(logger: Logger, error: Error | Buffer) {
   const prefix = 'An error occurred while executing the command:';
   if (error instanceof Error) {
      logger.error(`${prefix} ${error.stack ?? error.message ?? String(error)}`);
   } else {
      logger.error(`${prefix} ${error.toString()}`);
   }
}

function handleParserError(logger: Logger, error: ParseError) {
   logger.error(`An error occurred during parsing: ${error.stack ?? error.message ?? String(error)}`);
}

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
      parser.onError((error) => {
         handleParserError(logger, error);
      }),
      processManager.onStdout((data) => {
         parser.write(data);
      }),
      processManager.onStderr((data) => {
         handleCmdError(logger, data);
      }),
      processManager.onError((error) => {
         handleCmdError(logger, error);
      }),
   );

   disposables.push(
      vscode.commands.registerCommand(`${extensionName}.showOutputChannel`, () => {
         logger.show();
      }),
      vscode.commands.registerCommand(`${extensionName}.startProcess`, () => {
         try {
            processManager.start();
         } catch (error) {
            if (error instanceof ProcessAlreadyRunningError) {
               vscode.window.showInformationMessage('cluster-smi is already running.');
            } else {
               throw error;
            }
         }
      }),
   );
   disposables.push(...registerClusterSmiTreeView(parser, processManager));

   context.subscriptions.push(...disposables);
}

export function deactivate() {}
