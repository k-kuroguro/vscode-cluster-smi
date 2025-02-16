import * as vscode from 'vscode';
import { Config } from './config';
import { extensionDisplayName } from './constants';
import { OutputChannelLogger } from './logger';

export function activate(context: vscode.ExtensionContext) {
   const disposables: vscode.Disposable[] = [];

   const logger = new OutputChannelLogger();
   disposables.push(logger);
   logger.info(`"${extensionDisplayName}" is now active!`);

   const config = Config.getInstance();
   disposables.push(config);

   disposables.push(
      vscode.commands.registerCommand('extension-name.helloWorld', () => {
         if (config.useWarning) {
            vscode.window.showWarningMessage('Hello World!');
         } else {
            vscode.window.showInformationMessage('Hello World!');
         }
      }),
   );

   context.subscriptions.push(...disposables);
}

export function deactivate() {}
