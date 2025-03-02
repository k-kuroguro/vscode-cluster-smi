import { type ChildProcessWithoutNullStreams, spawn } from 'node:child_process';
import * as vscode from 'vscode';
import { Config } from './config';

export class ProcessAlreadyRunningError extends Error {
   name = 'ProcessAlreadyRunningError';
   message = 'Process is already running';
}

export class ClusterSmiProcessManager {
   private _onStdout: vscode.EventEmitter<Buffer> = new vscode.EventEmitter<Buffer>();
   private _onStderr: vscode.EventEmitter<Buffer> = new vscode.EventEmitter<Buffer>();
   readonly onStdout: vscode.Event<Buffer> = this._onStdout.event;
   readonly onStderr: vscode.Event<Buffer> = this._onStderr.event;

   private config = Config.getInstance();
   private process?: ChildProcessWithoutNullStreams;
   private disposables: vscode.Disposable[] = [this._onStdout, this._onStderr];

   constructor() {
      this.disposables.push(
         this.config.onDidChangeConfig((items) => {
            if (items.includes(Config.ConfigItem.ExecPath) && this.process) {
               this.restart();
            }
         }),
      );
   }

   start(): void {
      if (this.process) {
         throw new ProcessAlreadyRunningError();
      }
      this.process = spawn(this.config.execPath, ['-p', '-d']);
      this.process.stdout.on('data', (data: Buffer) => this._onStdout.fire(data));
      this.process.stderr.on('data', (data: Buffer) => this._onStderr.fire(data));
   }

   stop(): void {
      if (this.process) {
         this.process.kill();
         this.process = undefined;
      }
   }

   restart(): void {
      this.stop();
      this.start();
   }

   dispose(): void {
      this.stop();
      for (const disposable of this.disposables) {
         disposable.dispose();
      }
   }
}
