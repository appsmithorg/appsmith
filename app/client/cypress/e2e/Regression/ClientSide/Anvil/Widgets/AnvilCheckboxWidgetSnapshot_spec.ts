import { ANVIL_EDITOR_TEST } from "../../../../../support/Constants";
import {
  agHelper,
  anvilSnapshot,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  `${ANVIL_EDITOR_TEST}: Anvil tests for Checkbox Widget`,
  { tags: ["@tag.Anvil"] },
  () => {
    before(() => {
      agHelper.AddDsl("anvilCheckboxWidget");
    });

    it("1. Canvas Mode", () => {
      anvilSnapshot.verifyCanvasMode("CheckboxWidget");
    });

    it("2. Preview Mode", () => {
      anvilSnapshot.verifyPreviewMode("CheckboxWidget");
    });

    it("3. Deploy Mode", () => {
      anvilSnapshot.verifyDeployMode("CheckboxWidget");
    });
  },
);
