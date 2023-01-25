import { promisify } from "./utils/Promisify";

function copyToClipboardFnDescriptor(
  data: string,
  options?: { debug?: boolean; format?: string },
) {
  return {
    type: "COPY_TO_CLIPBOARD",
    payload: {
      data,
      options: { debug: options?.debug, format: options?.format },
    },
  };
}

const copyToClipboard = promisify(copyToClipboardFnDescriptor);

export default copyToClipboard;
