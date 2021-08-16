const workerContext: Worker = self as any;

export enum ReplayOperation {
  UNDO = "undo",
  REDO = "redo",
}
//TODO: Create a more complete RPC setup in the subtree-eval branch.
function messageEventListener(
  fn: (message: ReplayOperation, requestData: any) => void,
) {
  return (e: MessageEvent) => {
    const startTime = performance.now();
    const { method, requestData, requestId } = e.data;
    const responseData = fn(method, requestData);
    const endTime = performance.now();
    workerContext.postMessage({
      requestId,
      responseData,
      timeTaken: (endTime - startTime).toFixed(2),
    });
  };
}

workerContext.addEventListener(
  "message",
  messageEventListener((method) => {
    switch (method) {
      case ReplayOperation.UNDO:
        return { "0": { lable: "testin this" } };
      case ReplayOperation.REDO:
        // CODE FOR REDO
        return { "0": { lable: "testin this" } };
    }
  }),
);

export default workerContext;
