import * as vscode from 'vscode';
import { extensionName } from './constants';

export const WelcomeViewContext = {
   ProcessExitedSuccessfully: `${extensionName}.processExitedSuccessfully`,
   ProcessExitedWithError: `${extensionName}.processExitedWithError`,
} as const;
export type WelcomeViewContext = (typeof WelcomeViewContext)[keyof typeof WelcomeViewContext];

export function setWelcomeViewContext(key: WelcomeViewContext, value: boolean): void {
   vscode.commands.executeCommand('setContext', key, value);
}

export function setProcessIsRunning(): void {
   setWelcomeViewContext(WelcomeViewContext.ProcessExitedSuccessfully, false);
   setWelcomeViewContext(WelcomeViewContext.ProcessExitedWithError, false);
}

export function setProcessExitedSuccessfully(): void {
   setWelcomeViewContext(WelcomeViewContext.ProcessExitedSuccessfully, true);
   setWelcomeViewContext(WelcomeViewContext.ProcessExitedWithError, false);
}

export function setProcessExitedWithError(): void {
   setWelcomeViewContext(WelcomeViewContext.ProcessExitedSuccessfully, false);
   setWelcomeViewContext(WelcomeViewContext.ProcessExitedWithError, true);
}
