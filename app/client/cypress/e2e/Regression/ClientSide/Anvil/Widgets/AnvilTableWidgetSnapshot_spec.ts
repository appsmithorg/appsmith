import { ANVIL_EDITOR_TEST } from "../../../../../support/Constants";
import {
  agHelper,
  anvilSnapshot,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  `${ANVIL_EDITOR_TEST}: Anvil tests for Table Widget`,
  { tags: ["@tag.Anvil"] },
  () => {
    before(() => {
      agHelper.AddDsl("anvilTableWidget");
    });

    it("1. Canvas Mode", () => {
      anvilSnapshot.verifyCanvasMode("TableWidget");
    });

    it("2. Preview Mode", () => {
      anvilSnapshot.verifyPreviewMode("TableWidget");
    });

    it("3. Deploy Mode", () => {
      anvilSnapshot.verifyDeployMode("TableWidget");
    });
  },
);
