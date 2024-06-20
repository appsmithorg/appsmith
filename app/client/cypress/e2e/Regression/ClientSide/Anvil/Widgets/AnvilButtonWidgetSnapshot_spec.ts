import { ANVIL_EDITOR_TEST } from "../../../../../support/Constants";
import {
  agHelper,
  anvilSnapshot,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  `${ANVIL_EDITOR_TEST}: Anvil tests for Button Widget`,
  { tags: ["@tag.Anvil"] },
  () => {
    before(() => {
      agHelper.AddDsl("anvilButtonWidget");
    });

    it("1. Canvas Mode", () => {
      anvilSnapshot.verifyCanvasMode("ButtonWidget");
    });

    it("2. Preview Mode", () => {
      anvilSnapshot.verifyPreviewMode("ButtonWidget");
    });

    it("3. Deploy Mode", () => {
      anvilSnapshot.verifyDeployMode("ButtonWidget");
    });
  },
);
