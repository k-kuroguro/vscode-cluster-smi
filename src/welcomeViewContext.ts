import * as vscode from 'vscode';
import { extensionName } from './constants';

const WelcomeViewContext = {
   ProcessExitedSuccessfully: `${extensionName}.processExitedSuccessfully`,
   ProcessExitedWithError: `${extensionName}.processExitedWithError`,
   OutputIsEmpty: `${extensionName}.outputIsEmpty`,
} as const;
type WelcomeViewContext = (typeof WelcomeViewContext)[keyof typeof WelcomeViewContext];

function setWelcomeViewContext(key: WelcomeViewContext, value: boolean): void {
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

export function setOutputIsEmpty(value: boolean): void {
   setWelcomeViewContext(WelcomeViewContext.OutputIsEmpty, value);
}
