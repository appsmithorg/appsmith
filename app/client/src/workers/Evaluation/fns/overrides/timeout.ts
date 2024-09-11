import ExecutionMetaData from "../utils/ExecutionMetaData";

const _internalSetTimeout = self.setTimeout;
const _internalClearTimeout = self.clearTimeout;

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setTimeout(cb: (...args: any) => any, delay: number, ...args: any) {
  const metaData = ExecutionMetaData.getExecutionMetaData();
  return _internalSetTimeout(
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function (...args: any) {
      self["$isDataField"] = false;
      ExecutionMetaData.setExecutionMetaData(metaData);
      typeof cb === "function" && cb(...args);
    },
    delay,
    ...args,
  );
}

function clearTimeout(timerId: number) {
  return _internalClearTimeout(timerId);
}

export { setTimeout, clearTimeout };
