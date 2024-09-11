import { WorkerMessenger } from "workers/Evaluation/fns/utils/Messenger";
import { evalTreeTransmissionErrorHandler } from "../evalTree";
import { isFunction } from "lodash";

const mockEvalErrorHandler = jest.fn();
const mockSendMessage = jest.fn();

jest.mock("workers/Evaluation/handlers/evalTree", () => {
  const actualExports = jest.requireActual(
    "workers/Evaluation/handlers/evalTree",
  );
  return {
    __esModule: true,
    ...actualExports,
    evalTreeTransmissionErrorHandler: (...args: unknown[]) => {
      mockEvalErrorHandler();
      actualExports.evalTreeTransmissionErrorHandler(...args);
    },
  };
});
jest.mock("utils/MessageUtil", () => {
  const actualExports = jest.requireActual("utils/MessageUtil");
  return {
    __esModule: true,
    ...actualExports,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sendMessage: (...args: any[]) => {
      mockSendMessage(args[0].body.data);
      const {
        body: { data },
      } = args[0];
      if (isFunction(data.response)) {
        throw new Error("unserializable data");
      }
    },
  };
});

describe("test", () => {
  it("calls custom evalTree error handler", () => {
    const startTime = Date.now();
    const endTime = startTime + 1000;
    const UNSERIALIZABLE_DATA = {
      response: () => {},
      logs: {
        depedencies: { name: ["test", "you"] },
      },
    };
    WorkerMessenger.respond(
      "TEST",
      UNSERIALIZABLE_DATA,
      startTime,
      endTime,
      evalTreeTransmissionErrorHandler,
    );
    // Since response is unserializable, expect EvalErrorHandler to be called
    expect(mockEvalErrorHandler).toBeCalledTimes(1);
    // Error in the first attempt, then, a successfully second attempt
    expect(mockSendMessage).toBeCalledTimes(2);

    expect(mockSendMessage.mock.calls[0]).toEqual([UNSERIALIZABLE_DATA]);
    // The error handler should convert data to a serializable form
    expect(mockSendMessage.mock.calls[1]).toEqual([
      JSON.parse(JSON.stringify(UNSERIALIZABLE_DATA)),
    ]);
  });
});
