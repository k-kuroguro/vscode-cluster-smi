import * as util from 'node:util';
import { type LogOutputChannel, window } from 'vscode';
import { extensionDisplayName } from './constants';

type Arguments = readonly unknown[];

export const LogLevel = {
   Debug: 'debug',
   Info: 'info',
   Warn: 'warn',
   Error: 'error',
} as const;
export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

export interface Logger {
   log: (level: LogLevel, ...data: Arguments) => void;
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

   log(level: LogLevel, ...data: Arguments): void {
      switch (level) {
         case LogLevel.Debug:
            this.debug(...data);
            break;
         case LogLevel.Info:
            this.info(...data);
            break;
         case LogLevel.Warn:
            this.warn(...data);
            break;
         case LogLevel.Error:
            this.error(...data);
            break;
      }
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

   show(): void {
      this.channel.show();
   }

   dispose(): void {
      this.channel.dispose();
   }
}
