import { type ChildProcessWithoutNullStreams, spawn } from 'node:child_process';
import * as vscode from 'vscode';
import { Config } from './config';
import type { Logger } from './logger';
import type { ExitStatus } from './types';

export class ProcessAlreadyRunningError extends Error {
   name = 'ProcessAlreadyRunningError';
   message = 'Process is already running';
}

export class ClusterSmiProcessManager {
   private _onStdout: vscode.EventEmitter<Buffer> = new vscode.EventEmitter<Buffer>();
   private _onStderr: vscode.EventEmitter<Buffer> = new vscode.EventEmitter<Buffer>();
   private _onError: vscode.EventEmitter<Error> = new vscode.EventEmitter<Error>();
   private _onDidExit: vscode.EventEmitter<ExitStatus> = new vscode.EventEmitter<ExitStatus>();
   private _onDidStart: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
   readonly onStdout: vscode.Event<Buffer> = this._onStdout.event;
   readonly onStderr: vscode.Event<Buffer> = this._onStderr.event;
   readonly onError: vscode.Event<Error> = this._onError.event; // Fired for errors before starting the process (e.g. spawn ENOENT) or if the process exits with an error.
   readonly onDidExit: vscode.Event<ExitStatus> = this._onDidExit.event; // Fired when the process ends, covering both successful and error exits.
   readonly onDidStart: vscode.Event<void> = this._onDidStart.event;

   private config = Config.getInstance();
   private process?: ChildProcessWithoutNullStreams;
   private shouldBeRunning = false;
   private disposables: vscode.Disposable[] = [this._onStdout, this._onStderr, this._onError, this._onDidExit, this._onDidStart];

   constructor(private readonly logger: Logger) {
      this.disposables.push(
         this.config.onDidChange((items) => {
            if (items.some((item) => item === Config.ConfigItem.ExecPath || item === Config.ConfigItem.NodeRegex) && this.shouldBeRunning) {
               this.restart();
            }
         }),
      );
   }

   start(): void {
      if (this.process) {
         throw new ProcessAlreadyRunningError();
      }

      this.shouldBeRunning = true;
      const args = ['-p', '-d'];
      if (this.config.nodeRegex) {
         args.push('-n', this.config.nodeRegex);
      }
      this.process = spawn(this.config.execPath, args);
      this.logger.info(`Started process: ${this.config.execPath} ${args.join(' ')}, pid: ${this.process.pid}`);

      this.process.stdout.on('data', (data: Buffer) => this._onStdout.fire(data));
      this.process.stderr.on('data', (data: Buffer) => this._onStderr.fire(data));
      this.process.on('error', (error: Error) => {
         this.process = undefined;
         this._onError.fire(error);
      });

      this.process.on('exit', (code: number | null, signal: NodeJS.Signals | null) => {
         this.process = undefined;
         const status: ExitStatus = { code: code ?? undefined, signal: signal ?? undefined };
         this._onDidExit.fire(status);
      });

      this._onDidStart.fire();
   }

   async stop(): Promise<void> {
      this.shouldBeRunning = false;
      await new Promise((resolve) => {
         if (this.process?.pid) {
            this.process.once('exit', () => resolve(undefined));
            process.kill(this.process.pid);
         } else {
            resolve(undefined);
         }
      });
   }

   async restart(): Promise<void> {
      await this.stop();
      this.start();
   }

   dispose(): void {
      this.stop();
      for (const disposable of this.disposables) {
         disposable.dispose();
      }
   }
}
