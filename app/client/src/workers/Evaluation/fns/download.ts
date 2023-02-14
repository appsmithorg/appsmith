import { promisify } from "./utils/Promisify";

function downloadFnDescriptor(data: string, name: string, type: string) {
  return {
    type: "DOWNLOAD" as const,
    payload: { data, name, type },
  };
}

export type TDownloadArgs = Parameters<typeof downloadFnDescriptor>;
export type TDownloadDescription = ReturnType<typeof downloadFnDescriptor>;
export type TDownloadActionType = TDownloadDescription["type"];

async function download(...args: Parameters<typeof downloadFnDescriptor>) {
  return promisify(downloadFnDescriptor)(...args);
}

export default download;
