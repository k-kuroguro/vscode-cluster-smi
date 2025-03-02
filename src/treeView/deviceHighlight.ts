import * as vscode from 'vscode';
import { uriScheme } from '../constants';

const deviceAuthority = 'device';

export const availableDeviceColor = new vscode.ThemeColor('terminal.ansiBrightGreen');

export interface DeviceUriQuery {
   available: boolean;
}

export function createDeviceUri(query: DeviceUriQuery): vscode.Uri {
   return vscode.Uri.parse(`${uriScheme}://${deviceAuthority}?${query.available ? 'available=true' : ''}`);
}

function isDeviceUri(uri: vscode.Uri): boolean {
   return uri.scheme === uriScheme && uri.authority === deviceAuthority;
}

function parseQuery(query: string): DeviceUriQuery {
   const searchParams = new URLSearchParams(query);
   return {
      available: searchParams.get('available') === 'true',
   };
}

export class DeviceHighlightProvider implements vscode.FileDecorationProvider {
   async provideFileDecoration(uri: vscode.Uri, token: vscode.CancellationToken): Promise<vscode.FileDecoration | undefined> {
      if (isDeviceUri(uri)) {
         const query = parseQuery(uri.query);
         if (query.available) {
            return {
               badge: 'A',
               color: availableDeviceColor,
               tooltip: 'Available',
               propagate: false,
            };
         }
      }
   }
}
