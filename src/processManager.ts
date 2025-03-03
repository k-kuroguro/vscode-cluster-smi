import { type ChildProcessWithoutNullStreams, spawn } from 'node:child_process';
import * as vscode from 'vscode';
import { Config } from './config';
import { setProcessExitedSuccessfully, setProcessExitedWithError, setProcessIsRunning } from './welcomeViewContext';

export interface ExitStatus {
   code?: number;
   signal?: NodeJS.Signals;
}

export class ProcessAlreadyRunningError extends Error {
   name = 'ProcessAlreadyRunningError';
   message = 'Process is already running';
}

export class ClusterSmiProcessManager {
   private _onStdout: vscode.EventEmitter<Buffer> = new vscode.EventEmitter<Buffer>();
   private _onStderr: vscode.EventEmitter<Buffer> = new vscode.EventEmitter<Buffer>();
   private _onError: vscode.EventEmitter<Error> = new vscode.EventEmitter<Error>();
   private _onExit: vscode.EventEmitter<ExitStatus> = new vscode.EventEmitter<ExitStatus>();
   readonly onStdout: vscode.Event<Buffer> = this._onStdout.event;
   readonly onStderr: vscode.Event<Buffer> = this._onStderr.event;
   readonly onError: vscode.Event<Error> = this._onError.event; // Fired for errors before starting the process (e.g. spawn ENOENT) or if the process exits with an error.
   readonly onExit: vscode.Event<ExitStatus> = this._onExit.event; // Fired when the process ends, covering both successful and error exits.

   private config = Config.getInstance();
   private process?: ChildProcessWithoutNullStreams;
   private shouldBeRunning = false;
   private disposables: vscode.Disposable[] = [this._onStdout, this._onStderr, this._onError, this._onExit];

   constructor() {
      this.disposables.push(
         this.config.onDidChangeConfig((items) => {
            if (items.includes(Config.ConfigItem.ExecPath) && this.shouldBeRunning) {
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
      this.process = spawn(this.config.execPath, ['-p', '-d'], { detached: true });
      this.process.stdout.on('data', (data: Buffer) => this._onStdout.fire(data));
      this.process.stderr.on('data', (data: Buffer) => this._onStderr.fire(data));
      this.process.on('error', (error: Error) => {
         this.process = undefined;
         this._onError.fire(error);
         setProcessExitedWithError();
      });

      this.process.on('exit', (code: number | null, signal: NodeJS.Signals | null) => {
         this.process = undefined;
         this._onExit.fire({ code: code ?? undefined, signal: signal ?? undefined });

         const isError = code !== 0 || signal !== null;
         if (isError) {
            setProcessExitedWithError();
         } else {
            setProcessExitedSuccessfully();
         }
      });

      setProcessIsRunning();
   }

   async stop(): Promise<void> {
      this.shouldBeRunning = false;
      await new Promise((resolve) => {
         if (this.process?.pid) {
            process.kill(-this.process.pid);
            this.process.once('exit', () => resolve(undefined));
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
