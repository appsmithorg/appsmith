import { enhanceRequestPayloadWithEventData } from "sagas/helper";

describe("tests the redux saga helper functions", () => {
  it("tests the enhanceRequestPayloadWithEventData function", () => {
    const inputs = [
      { payload: { id: "xyz" }, type: "COPY_ACTION_INIT" },
      { payload: { id: "xyz" }, type: "DUMMY_ACTION" },
      {
        payload: {
          id: "xyz",
          eventData: { analyticsData: { originalActionId: "abc" } },
        },
        type: "COPY_ACTION_INIT",
      },
      { payload: {}, type: "COPY_ACTION_INIT" },
      { payload: {}, type: "" },
      { payload: undefined, type: "" },
    ];

    const outputs = [
      { id: "xyz", eventData: { analyticsData: { originalActionId: "xyz" } } },
      { id: "xyz" },
      { id: "xyz", eventData: { analyticsData: { originalActionId: "abc" } } },
      {},
      {},
      undefined,
    ];

    inputs.forEach((input, index) => {
      expect(
        enhanceRequestPayloadWithEventData(input.payload, input.type),
      ).toStrictEqual(outputs[index]);
    });
  });
});
