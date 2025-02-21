import * as util from 'node:util';
import { type LogOutputChannel, window } from 'vscode';
import { extensionDisplayName } from './constants';

type Arguments = readonly unknown[];

export interface Logger {
   debug(...data: Arguments): void;
   info(...data: Arguments): void;
   warn(...data: Arguments): void;
   error(...data: Arguments): void;
}

export class OutputChannelLogger implements Logger {
   private readonly channel: LogOutputChannel;

   constructor() {
      this.channel = window.createOutputChannel(extensionDisplayName, { log: true });
   }

   debug(...data: Arguments): void {
      this.channel.debug(util.format(...data));
   }

   info(...data: Arguments): void {
      this.channel.info(util.format(...data));
   }

   warn(...data: Arguments): void {
      this.channel.warn(util.format(...data));
   }

   error(...data: Arguments): void {
      this.channel.error(util.format(...data));
   }

   dispose(): void {
      this.channel.dispose();
   }
}
