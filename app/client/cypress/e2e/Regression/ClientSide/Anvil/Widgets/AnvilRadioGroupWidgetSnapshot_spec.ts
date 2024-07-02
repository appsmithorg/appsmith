import { ANVIL_EDITOR_TEST } from "../../../../../support/Constants";
import {
  agHelper,
  anvilSnapshot,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  `${ANVIL_EDITOR_TEST}: Anvil tests for Radio Group Widget`,
  { tags: ["@tag.Anvil"] },
  () => {
    before(() => {
      agHelper.AddDsl("anvilRadioGroupWidget");
    });

    it("1. Canvas Mode", () => {
      anvilSnapshot.verifyCanvasMode("RadioGroupWidget");
    });

    it("2. Preview Mode", () => {
      anvilSnapshot.verifyPreviewMode("RadioGroupWidget");
    });

    it("3. Deploy Mode", () => {
      anvilSnapshot.verifyDeployMode("RadioGroupWidget");
    });
  },
);
