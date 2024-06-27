import { ANVIL_EDITOR_TEST } from "../../../../../support/Constants";
import {
  agHelper,
  anvilSnapshot,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  `${ANVIL_EDITOR_TEST}: Anvil tests for Switch Widget`,
  { tags: ["@tag.Anvil"] },
  () => {
    before(() => {
      agHelper.AddDsl("anvilSwitchWidget");
    });

    it("1. Canvas Mode", () => {
      anvilSnapshot.verifyCanvasMode("SwitchWidget");
    });

    it("2. Preview Mode", () => {
      anvilSnapshot.verifyPreviewMode("SwitchWidget");
    });

    it("3. Deploy Mode", () => {
      anvilSnapshot.verifyDeployMode("SwitchWidget");
    });
  },
);
