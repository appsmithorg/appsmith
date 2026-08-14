import { ENTITY_TYPE } from "ee/entities/DataTree/types";
import type { DataTreeEntity } from "entities/DataTree/dataTreeTypes";
import lintTriggerPath from "./lintTriggerPath";

jest.mock("ee/utils/lintRulesHelpers", () => ({
  getLintRulesBasedOnContext: jest.fn(() => ({})),
}));

const widgetEntity = {
  ENTITY_TYPE: ENTITY_TYPE.WIDGET,
} as DataTreeEntity;

const webworkerTelemetry = {};

describe("lintTriggerPath", () => {
  it.each(["", "{{}}", "{{;}}", ";", "{{undefined;}}"])(
    "returns no errors for empty leftover trigger value %j",
    (userScript) => {
      const lintErrors = lintTriggerPath({
        userScript,
        entity: widgetEntity,
        globalData: {},
        webworkerTelemetry,
      });

      expect(lintErrors).toEqual([]);
    },
  );

  it("still reports syntax errors in a real trigger script", () => {
    const lintErrors = lintTriggerPath({
      userScript: "{{showAlert(}}",
      entity: widgetEntity,
      globalData: {},
      webworkerTelemetry,
    });

    expect(lintErrors.length).toBeGreaterThan(0);
  });
});
