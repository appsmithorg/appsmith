import { agHelper, anvilSnapshot, deployMode, locators } from "../../../../../../support/Objects/ObjectsCore";
import { ANVIL_EDITOR_TEST, modifierKey } from "../../../../../../support/Constants";

describe(
  `${ANVIL_EDITOR_TEST}: Anvil tests for Button Widget`,
  { tags: ["@tag.Anvil"] },
  () => {
    const widgetName = "ButtonWidget";

    before(() => {
      agHelper.AddDsl("anvilButtonWidget");
    });

    it("1. Canvas Mode", () => {
      anvilSnapshot.verifyCanvasMode(widgetName);
    });

    it("2. Preview Mode", () => {
      anvilSnapshot.verifyPreviewMode(widgetName);
    });

    it("3. Deploy Mode", () => {
      anvilSnapshot.verifyDeployMode(widgetName);
    });
  },
);
