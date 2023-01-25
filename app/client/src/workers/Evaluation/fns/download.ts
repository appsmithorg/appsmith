import { promisify } from "./utils/Promisify";

function downloadFnDescriptor(data: string, name: string, type: string) {
  return {
    type: "DOWNLOAD",
    payload: { data, name, type },
  };
}
const download = promisify(downloadFnDescriptor);

export default download;
