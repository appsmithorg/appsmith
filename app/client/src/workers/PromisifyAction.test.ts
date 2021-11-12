import { createGlobalData } from "workers/evaluate";

const requestId = "TEST_REQUEST";
// jest.spyOn(self, "addEventListener").mockImplementation((event, handler) => {
//   // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//   // @ts-ignore
//   const gen = handler({
//     data: {
//       method: "PROCESS_TRIGGER",
//       data: {
//         resolve: "Test resolve",
//       },
//       requestId,
//       success: true,
//       subRequestId,
//     },
//   });
//   debugger;
//   gen.next();
// });

describe("promise execution", () => {
  const postMessageMock = jest.fn();
  const dataTreeWithFunctions = createGlobalData({}, {});

  beforeEach(() => {
    self.ALLOW_ASYNC = true;
    self.REQUEST_ID = requestId;
    self.postMessage = postMessageMock;
  });
  afterAll(() => {
    jest.restoreAllMocks();
  });

  it("throws when allow async is not enabled", () => {
    self.ALLOW_ASYNC = false;
    self.IS_ASYNC = false;
    expect(dataTreeWithFunctions.showAlert).toThrowError();
    expect(self.IS_ASYNC).toBe(true);
    expect(postMessageMock).not.toHaveBeenCalled();
  });
  // it("sends an event from the worker", () => {
  //   dataTreeWithFunctions.showAlert("test alert", "info");
  //   expect(postMessageMock).toBeCalledWith({
  //     requestId,
  //     type: "PROCESS_TRIGGER",
  //     responseData: expect.objectContaining({
  //       subRequestId: expect.stringContaining(`${requestId}_`),
  //       trigger: {
  //         type: "SHOW_ALERT",
  //         payload: {
  //           message: "test alert",
  //           style: "info",
  //         },
  //       },
  //     }),
  //   });
  // });
  // it("returns a promise that resolves", () => {
  //   postMessageMock.mockReset();
  //   const returnedPromise = dataTreeWithFunctions.showAlert(
  //     "test alert",
  //     "info",
  //   );
  //   const requestArgs = postMessageMock.mock.calls[0][0];
  //   subRequestId = requestArgs.responseData.subRequestId;
  //
  //   expect(returnedPromise).resolves.toBe("123");
  // });
  //
  // it("returns a promise that rejects", () => {
  //   postMessageMock.mockReset();
  //   const returnedPromise = dataTreeWithFunctions.showAlert(
  //     "test alert",
  //     "info",
  //   );
  //   const requestArgs = postMessageMock.mock.calls[0][0];
  //   subRequestId = requestArgs.responseData.subRequestId;
  //
  //   expect(returnedPromise).rejects.toBe("testing");
  // });
  // it("does not process till right event is triggered", () => {
  //   const returnedPromise = dataTreeWithFunctions.showAlert(
  //     "test alert",
  //     "info",
  //   );
  //
  //   const requestArgs = postMessageMock.mock.calls[0][0];
  //   subRequestId = requestArgs.responseData.subRequestId;
  //
  //   expect(returnedPromise).resolves.toBe("bullshit");
  // });
  // it("same subRequestId is not accepted again", () => {});
});
