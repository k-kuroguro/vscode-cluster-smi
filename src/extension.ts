import * as vscode from 'vscode';
import { Config } from './config';
import { extensionName } from './constants';
import { LogLevel, type Logger, OutputChannelLogger } from './logger';
import { ClusterSmiParser, type ParseError } from './parser';
import { ClusterSmiProcessManager, ProcessAlreadyRunningError } from './processManager';
import { ClusterSmiTreeView } from './treeView';
import { isProcessExitedWithError } from './utils';
import { WelcomeViewContexts } from './welcomeViewContext';

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
   const processManager = new ClusterSmiProcessManager(logger);
   processManager.start();
   disposables.push(parser, processManager);

   const treeView = new ClusterSmiTreeView();
   disposables.push(
      treeView,
      parser.onDidUpdate((output) => {
         if (output.nodes.length) {
            WelcomeViewContexts.setOutputIsEmpty(false);
            treeView.update(output);
         } else {
            WelcomeViewContexts.setOutputIsEmpty(true);
            treeView.update();
         }
      }),
      processManager.onExit(() => {
         // For both successful and error exits.
         treeView.update();
      }),
      processManager.onError((error) => {
         // For errors like spawn ENOENT (process start errors).
         treeView.update();
      }),
   );

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
         WelcomeViewContexts.setProcessExitedWithError();
      }),
      processManager.onExit((status) => {
         logger.log(isProcessExitedWithError(status) ? LogLevel.Error : LogLevel.Info, `Process exited with code: ${status.code ?? 'null'}, signal: ${status.signal ?? 'null'}`);

         if (isProcessExitedWithError(status)) {
            WelcomeViewContexts.setProcessExitedWithError();
         } else {
            WelcomeViewContexts.setProcessExitedSuccessfully();
         }
         WelcomeViewContexts.setOutputIsEmpty(false);
      }),
      processManager.onStart(() => {
         WelcomeViewContexts.setProcessIsRunning();
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

   context.subscriptions.push(...disposables);
}

export function deactivate() {}
