import { ANVIL_EDITOR_TEST } from "../../../../../support/Constants";
import {
  agHelper,
  anvilSnapshot,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  `${ANVIL_EDITOR_TEST}: Anvil tests for Toolbar Button Widget`,
  { tags: ["@tag.Anvil"] },
  () => {
    before(() => {
      agHelper.AddDsl("anvilToolbarButtonWidget");
    });

    it("1. Canvas Mode", () => {
      anvilSnapshot.verifyCanvasMode("ToolbarButtonWidget");
    });

    it("2. Preview Mode", () => {
      anvilSnapshot.verifyPreviewMode("ToolbarButtonWidget");
    });

    it("3. Deploy Mode", () => {
      anvilSnapshot.verifyDeployMode("ToolbarButtonWidget");
    });
  },
);
