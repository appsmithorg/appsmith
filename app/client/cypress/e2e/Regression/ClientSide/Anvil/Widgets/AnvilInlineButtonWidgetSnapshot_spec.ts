import { ANVIL_EDITOR_TEST } from "../../../../../support/Constants";
import {
  agHelper,
  anvilSnapshot,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  `${ANVIL_EDITOR_TEST}: Anvil tests for Inline Button Widget`,
  { tags: ["@tag.Anvil"] },
  () => {
    before(() => {
      agHelper.AddDsl("anvilInlineButtonWidget");
    });

    it("1. Canvas Mode", () => {
      anvilSnapshot.verifyCanvasMode("InlineButtonWidget");
    });

    it("2. Preview Mode", () => {
      anvilSnapshot.verifyPreviewMode("InlineButtonWidget");
    });

    it("3. Deploy Mode", () => {
      anvilSnapshot.verifyDeployMode("InlineButtonWidget");
    });
  },
);
