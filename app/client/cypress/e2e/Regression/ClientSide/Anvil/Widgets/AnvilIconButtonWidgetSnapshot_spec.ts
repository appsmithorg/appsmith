import { ANVIL_EDITOR_TEST } from "../../../../../support/Constants";
import {
  agHelper,
  anvilSnapshot,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  `${ANVIL_EDITOR_TEST}: Anvil tests for Icon Button Widget`,
  { tags: ["@tag.Anvil"] },
  () => {
    before(() => {
      agHelper.AddDsl("anvilIconButtonWidget");
    });

    it("1. Canvas Mode", () => {
      anvilSnapshot.verifyCanvasMode("IconButtonWidget");
    });

    it("2. Preview Mode", () => {
      anvilSnapshot.verifyPreviewMode("IconButtonWidget");
    });

    it("3. Deploy Mode", () => {
      anvilSnapshot.verifyDeployMode("IconButtonWidget");
    });
  },
);
