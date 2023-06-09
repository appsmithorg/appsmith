import { promisify } from "./utils/Promisify";

function copyToClipboardFnDescriptor(
  data: string,
  options?: { debug?: boolean; format?: string },
) {
  return {
    type: "COPY_TO_CLIPBOARD" as const,
    payload: {
      data,
      options: { debug: options?.debug, format: options?.format },
    },
  };
}

export type TCopyToClipboardArgs = Parameters<
  typeof copyToClipboardFnDescriptor
>;
export type TCopyToClipboardDescription = ReturnType<
  typeof copyToClipboardFnDescriptor
>;

export type TCopyToClipboardActionType = TCopyToClipboardDescription["type"];

async function copyToClipboard(...args: TCopyToClipboardArgs) {
  return promisify(copyToClipboardFnDescriptor)(...args);
}

export default copyToClipboard;
