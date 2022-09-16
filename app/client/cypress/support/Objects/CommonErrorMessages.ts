export function createMessage(
  format: (...strArgs: any[]) => string,
  ...args: any[]
) {
  return format(...args);
}

export const ERROR_ACTION_EXECUTE_FAIL = (actionName: string) =>
  `${actionName} action returned an error response`;

export const ACTION_EXECUTION_CANCELLED = (actionName: string) =>
  `${actionName} was cancelled`;
