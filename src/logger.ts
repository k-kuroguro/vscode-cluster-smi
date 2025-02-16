import * as util from 'node:util';
import { type LogOutputChannel, window } from 'vscode';
import { extensionDisplayName } from './constants';

export interface Logger {
   debug(...data: unknown[]): void;
   info(...data: unknown[]): void;
   warn(...data: unknown[]): void;
   error(...data: unknown[]): void;
}

export class OutputChannelLogger implements Logger {
   private readonly channel: LogOutputChannel;

   constructor() {
      this.channel = window.createOutputChannel(extensionDisplayName, { log: true });
   }

   debug(...data: unknown[]): void {
      this.channel.debug(util.format(...data));
   }

   info(...data: unknown[]): void {
      this.channel.info(util.format(...data));
   }

   warn(...data: unknown[]): void {
      this.channel.warn(util.format(...data));
   }

   error(...data: unknown[]): void {
      this.channel.error(util.format(...data));
   }

   dispose(): void {
      this.channel.dispose();
   }
}
