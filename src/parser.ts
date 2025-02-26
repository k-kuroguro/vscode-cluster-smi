import * as vscode from 'vscode';
import type { ClusterSmiOutput, Device, Memory, Node, Process, Runtime } from './types';
import { isInvalidDate } from './utils';

export class ParseError extends Error {
   constructor(message: string) {
      super(message);
      this.name = 'ParseError';
   }
}

const TABLE_ROW_LENGTH = 12;

interface TableRow {
   node?: string;
   gpu?: string;
   memoryUsage?: string;
   gpuUtil?: string;
   fan?: string;
   temp?: string;
   power?: string;
   pid?: string;
   user?: string;
   command?: string;
   gpuMem?: string;
   runtime?: string;
}

function hasAnyDeviceField(row: TableRow): boolean {
   return row.gpu !== undefined || row.memoryUsage !== undefined || row.gpuUtil !== undefined || row.fan !== undefined || row.temp !== undefined || row.power !== undefined;
}

function hasAllDeviceFields(row: TableRow): row is TableRow & { gpu: string; memoryUsage: string; gpuUtil: string; fan: string; temp: string; power: string } {
   return row.gpu !== undefined && row.memoryUsage !== undefined && row.gpuUtil !== undefined && row.fan !== undefined && row.temp !== undefined && row.power !== undefined;
}

function hasAnyProcessField(row: TableRow): boolean {
   return row.pid !== undefined || row.user !== undefined || row.gpuMem !== undefined || row.runtime !== undefined;
}

function hasAllProcessFields(row: TableRow): row is TableRow & { pid: string; user: string; command: string; gpuMem: string; runtime: string } {
   return row.pid !== undefined && row.user !== undefined && row.gpuMem !== undefined && row.runtime !== undefined;
}

export class ClusterSmiParser {
   private _onDidUpdate: vscode.EventEmitter<ClusterSmiOutput> = new vscode.EventEmitter<ClusterSmiOutput>();
   private _onError: vscode.EventEmitter<ParseError> = new vscode.EventEmitter<ParseError>();
   readonly onDidUpdate: vscode.Event<ClusterSmiOutput> = this._onDidUpdate.event;
   readonly onError: vscode.Event<ParseError> = this._onError.event;

   private result?: ClusterSmiOutput;
   private disposables: vscode.Disposable[] = [this._onDidUpdate, this._onError];

   write(data: Buffer): void {
      const lines = data
         .toString()
         .split('\n')
         .map((line) => line.trim());

      let hasTableChanged = false;
      for (const line of lines) {
         if (!line) continue;

         if (this.isTimestampLine(line)) {
            const timestamp = this.parseTimestampLine(line);
            if (isInvalidDate(timestamp)) {
               this._onError.fire(new ParseError(`Could not parse timestamp: ${line}`));
               this.result = undefined;
            } else {
               this.result = { timestamp, nodes: [] };
            }
            continue;
         }

         if (this.isTableRow(line)) {
            if (!this.result) {
               this._onError.fire(new ParseError('Table row found before timestamp.'));
               continue;
            }

            const parsedRow = (() => {
               try {
                  return this.parseTableRow(line);
               } catch (error) {
                  if (error instanceof ParseError) {
                     this._onError.fire(error);
                  } else {
                     throw error;
                  }
                  return undefined;
               }
            })();

            if (!parsedRow) {
               continue;
            }

            switch (parsedRow[0]) {
               case 'Node': {
                  const [, node] = parsedRow;
                  this.result.nodes.push(node);
                  break;
               }
               case 'Device': {
                  const [, device] = parsedRow;

                  const lastNode = this.result.nodes[this.result.nodes.length - 1];
                  if (lastNode === undefined) {
                     this._onError.fire(new ParseError('Device found before node.'));
                     continue;
                  }

                  this.result.nodes[this.result.nodes.length - 1].devices.push(device);
                  break;
               }
               case 'Process': {
                  const [, process] = parsedRow;

                  const lastNode = this.result.nodes[this.result.nodes.length - 1];
                  if (lastNode === undefined) {
                     this._onError.fire(new ParseError('Process found before node.'));
                     continue;
                  }

                  const lastDevice = lastNode.devices[lastNode.devices.length - 1];
                  if (lastDevice === undefined) {
                     this._onError.fire(new ParseError('Process found before device.'));
                     continue;
                  }

                  lastDevice.processes.push(process);
                  break;
               }
            }

            hasTableChanged = true;
         }
      }

      if (this.result && hasTableChanged) {
         this._onDidUpdate.fire(this.result);
      }
   }

   dispose(): void {
      for (const disposable of this.disposables) {
         disposable.dispose();
      }
   }

   private isTimestampLine(line: string): boolean {
      return line.includes('http://github.com/patwie/cluster-smi');
   }

   private isTableBorder(line: string): boolean {
      return line.startsWith('+');
   }

   private isTableRow(line: string): boolean {
      return line.startsWith('|');
   }

   private parseTimestampLine(line: string): Date {
      // Timestamp line is like "\x1b[2JSat Feb 15 21:55:04 2025 (http://github.com/patwie/cluster-smi)"
      const timestampStr = line.replace('\x1b[2J', '').replace('(http://github.com/patwie/cluster-smi)', '').trim();
      return new Date(timestampStr);
   }

   private parseTableRow(line: string): ['Node', Node] | ['Device', Device] | ['Process', Process] | undefined {
      const cols = line
         .split('|')
         .slice(1, -1)
         .map((col) => this.normalize(col));

      if (cols.length !== TABLE_ROW_LENGTH) {
         throw new ParseError(`Invalid table row: ${line}`);
      }

      const row = this.transformEmptyStringToUndefined(
         {
            node: cols[0],
            gpu: cols[1],
            memoryUsage: cols[2],
            gpuUtil: cols[3],
            fan: cols[4],
            temp: cols[5],
            power: cols[6],
            pid: cols[7],
            user: cols[8],
            command: cols[9],
            gpuMem: cols[10],
            runtime: cols[11],
         },
         ['command'], // Allow empty string for command
      );

      if (this.isTableHeader(row)) {
         return undefined;
      }

      if (row.node) {
         const node: Node = {
            hostname: row.node,
            devices: [],
         };
         if (hasAnyDeviceField(row)) {
            if (!hasAllDeviceFields(row)) {
               throw new ParseError(`Invalid table row: ${line}`);
            }
            node.devices.push(this.parseDevice(row.gpu, row.memoryUsage, row.gpuUtil, row.fan, row.temp, row.power));
            if (hasAnyProcessField(row)) {
               if (!hasAllProcessFields(row)) {
                  throw new ParseError(`Invalid table row: ${line}`);
               }
               node.devices[node.devices.length - 1].processes.push(this.parseProcess(row.pid, row.user, row.command, row.gpuMem, row.runtime));
            }
         }
         return ['Node', node];
      }

      if (hasAnyDeviceField(row)) {
         if (!hasAllDeviceFields(row)) {
            throw new ParseError(`Invalid table row: ${line}`);
         }
         const device = this.parseDevice(row.gpu, row.memoryUsage, row.gpuUtil, row.fan, row.temp, row.power);
         if (hasAnyProcessField(row)) {
            if (!hasAllProcessFields(row)) {
               throw new ParseError(`Invalid table row: ${line}`);
            }
            device.processes.push(this.parseProcess(row.pid, row.user, row.command, row.gpuMem, row.runtime));
         }
         return ['Device', device];
      }

      if (hasAnyProcessField(row)) {
         if (!hasAllProcessFields(row)) {
            throw new ParseError(`Invalid table row: ${line}`);
         }
         return ['Process', this.parseProcess(row.pid, row.user, row.command, row.gpuMem, row.runtime)];
      }

      throw new ParseError(`Invalid table row: ${line}`);
   }

   private parseProcess(pid: string, user: string, command: string, gpuMem: string, runtime: string): Process {
      return {
         pid: Number.parseInt(pid),
         username: user,
         name: command,
         usedGpuMemory: this.parseIntWithUnit(gpuMem, 'MiB', 'GPU Mem'),
         runtime: this.parseRuntime(runtime),
      };
   }

   private parseRuntime(runtime: string): Runtime {
      const match = runtime.replace(/\s+/g, '').match(/^(\d+)(d|h|min|sec)(\d+)?(d|h|min|sec)?(\d+)?(d|h|min|sec)?(\d+)?(d|h|min|sec)?$/);
      if (!match) {
         throw new ParseError(`Invalid Runtime: ${runtime}`);
      }

      const pairs: { number: number; unit: string }[] = [];
      for (let i = 1; i < match.length; i += 2) {
         if (match[i] && match[i + 1]) {
            pairs.push({ number: Number.parseInt(match[i]), unit: match[i + 1] });
         }
      }

      const unitMap: { [key: string]: keyof Runtime } = {
         d: 'days',
         h: 'hours',
         min: 'minutes',
         sec: 'seconds',
      } as const;

      const result: Runtime = { days: 0, hours: 0, minutes: 0, seconds: 0 };

      for (const pair of pairs) {
         const field = unitMap[pair.unit];
         if (field) {
            result[field] = pair.number;
         } else {
            throw new ParseError(`Invalid Runtime: ${runtime}`);
         }
      }

      return result;
   }

   private parseDevice(gpu: string, memoryUsage: string, gpuUtil: string, fan: string, temp: string, power: string): Device {
      const { id, name } = this.parseDeviceIdAndName(gpu);
      return {
         id: id,
         name: name,
         utilization: this.parseIntWithUnit(gpuUtil, '%', 'GPU-Util'),
         memory: this.parseMemory(memoryUsage),
         fanSpeed: this.parseIntWithUnit(fan, '%', 'Fan'),
         temperature: this.parseIntWithUnit(temp, 'C', 'Temp'),
         powerUsage: this.parseIntWithUnit(power, 'W', 'Power'),
         processes: [],
      };
   }

   private parseMemory(memoryUsage: string): Memory {
      const match = memoryUsage.replace(/\s+/g, '').match(/^(\d+)MiB\/(\d+)MiB\((\d+)%\)$/);
      if (!match) {
         throw new ParseError(`Invalid Memory-Usage: ${memoryUsage}`);
      }
      return {
         used: Number.parseInt(match[1]),
         total: Number.parseInt(match[2]),
         percentage: Number.parseInt(match[3]),
      };
   }

   private parseDeviceIdAndName(gpu: string): { id: number; name: string } {
      const match = gpu.match(/^([^:]+):(.+)$/);
      if (!match) {
         throw new ParseError(`Invalid Gpu: ${gpu}`);
      }
      return { id: Number.parseInt(match[1]), name: match[2] };
   }

   private parseIntWithUnit(str: string, unit: '%' | 'W' | 'C' | 'MiB', fieldName: string): number {
      const match = str.match(new RegExp(`^(\\d+)\\s*${unit}$`));
      if (!match) {
         throw new ParseError(`Invalid ${fieldName}: ${str}`);
      }
      return Number.parseInt(match[1]);
   }

   private isTableHeader(row: TableRow): boolean {
      return (
         row.node === 'Node' &&
         row.gpu === 'Gpu' &&
         row.memoryUsage === 'Memory-Usage' &&
         row.gpuUtil === 'GPU-Util' &&
         row.fan === 'Fan' &&
         row.temp === 'Temp' &&
         row.power === 'Power' &&
         row.pid === 'PID' &&
         row.user === 'User' &&
         row.command === 'Command' &&
         row.gpuMem === 'GPU Mem' &&
         row.runtime === 'Runtime'
      );
   }

   private normalize(str: string): string {
      return this.removeAnsiColorCodes(str).trim();
   }

   private transformEmptyStringToUndefined(obj: TableRow, ignore: string[] = []): TableRow {
      return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, ignore.includes(key) ? value : value === '' ? undefined : value]) as [keyof TableRow, string][]);
   }

   private removeAnsiColorCodes(str: string): string {
      // biome-ignore lint/suspicious/noControlCharactersInRegex: This regex is used to remove ANSI color codes.
      return str.replace(/\x1b\[[0-9;]*m/g, '');
   }
}
