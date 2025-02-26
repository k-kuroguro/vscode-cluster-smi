import { type ChildProcess, spawn } from 'node:child_process';
import type * as vscode from 'vscode';
import { Config } from './config';
import { OutputChannelLogger } from './logger';
import { ClusterSmiParser } from './parser';
import { registerClusterSmiTreeView } from './treeView';

function runClusterSmi(execPath: string, logger: OutputChannelLogger, parser: ClusterSmiParser): ChildProcess {
   const clusterSmi = spawn(execPath, ['-p', '-d']);
   clusterSmi.stdout.on('data', (data) => {
      parser.write(data);
   });
   clusterSmi.stderr.on('data', (data) => {
      logger.error(data.toString());
   });
   return clusterSmi;
}

export function activate(context: vscode.ExtensionContext) {
   const disposables: vscode.Disposable[] = [];

   const logger = new OutputChannelLogger();
   disposables.push(logger);

   const config = Config.getInstance();
   disposables.push(config);

   const execPath = config.execPath;
   const parser = new ClusterSmiParser();
   let clusterSmi = runClusterSmi(execPath, logger, parser);
   disposables.push(parser, { dispose: () => clusterSmi.kill() });

   disposables.push(
      parser.onDidUpdate((output) => {
         logger.info(output);
      }),
      parser.onError((error) => {
         logger.error(error);
      }),
   );

   disposables.push(
      config.onDidChangeConfig((items) => {
         if (items.includes(Config.ConfigItem.ExecPath)) {
            logger.info(`execPath changed: ${config.execPath}`);
            clusterSmi.kill();
            clusterSmi = runClusterSmi(config.execPath, logger, parser);
         }
      }),
   );

   disposables.push(...registerClusterSmiTreeView(context, parser));

   context.subscriptions.push(...disposables);
}

export function deactivate() {}
