export function createMessage(
  format: (...strArgs: any[]) => string,
  ...args: any[]
) {
  return format(...args);
}

// String constants
export const ERROR_500 = () =>
  `We apologize, something went wrong. We're trying to fix things.`;
export const ERROR_0 = () =>
  `We could not connect to our servers. Please check your network connection`;
export const ERROR_401 = () =>
  `We are unable to verify your identity. Please login again.`;
export const ERROR_413 = (maxFileSize: number) =>
  `Payload too large. File size cannot exceed ${maxFileSize}MB.`;
export const ERROR_403 = (entity: string, userEmail: string) =>
  `Sorry, but your account (${userEmail}) does not seem to have the required access to update this ${entity}. Please get in touch with your Appsmith admin to resolve this.`;

export const WORKFLOW_NAMESPACE = "default";
export const WORKFLOW_TYPE = "executeWorkflow";
export const WORKFLOW_TASK_QUEUE = "appsmith-queue";
export const WORKFLOW_RUN_HISTORY_PAGE_SIZE = 100;
export const WORKFLOW_ACTIVITY_HISTORY_PAGE_SIZE = 100;
