import { ANVIL_EDITOR_TEST } from "../../../../../support/Constants";
import {
  agHelper,
  anvilSnapshot,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  `${ANVIL_EDITOR_TEST}: Anvil tests for Input Widget`,
  { tags: ["@tag.Anvil"] },
  () => {
    before(() => {
      agHelper.AddDsl("anvilInputWidget");
    });

    it("1. Canvas Mode", () => {
      anvilSnapshot.verifyCanvasMode("InputWidget");
    });

    it("2. Preview Mode", () => {
      anvilSnapshot.verifyPreviewMode("InputWidget");
    });

    it("3. Deploy Mode", () => {
      anvilSnapshot.verifyDeployMode("InputWidget");
    });
  },
);
