import * as vscode from 'vscode';
import { extensionName } from './constants';

export namespace WelcomeViewContexts {
   const ContextItem = {
      ProcessExitedSuccessfully: `${extensionName}.processExitedSuccessfully`,
      ProcessExitedWithError: `${extensionName}.processExitedWithError`,
      OutputIsEmpty: `${extensionName}.outputIsEmpty`,
   } as const;
   type ContextItem = (typeof ContextItem)[keyof typeof ContextItem];

   function setWelcomeViewContext(key: ContextItem, value: boolean): void {
      vscode.commands.executeCommand('setContext', key, value);
   }

   export function setProcessIsRunning(): void {
      setWelcomeViewContext(ContextItem.ProcessExitedSuccessfully, false);
      setWelcomeViewContext(ContextItem.ProcessExitedWithError, false);
   }

   export function setProcessExitedSuccessfully(): void {
      setWelcomeViewContext(ContextItem.ProcessExitedSuccessfully, true);
      setWelcomeViewContext(ContextItem.ProcessExitedWithError, false);
   }

   export function setProcessExitedWithError(): void {
      setWelcomeViewContext(ContextItem.ProcessExitedSuccessfully, false);
      setWelcomeViewContext(ContextItem.ProcessExitedWithError, true);
   }

   export function setOutputIsEmpty(value: boolean): void {
      setWelcomeViewContext(ContextItem.OutputIsEmpty, value);
   }
}
