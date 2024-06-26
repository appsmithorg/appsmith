import { ANVIL_EDITOR_TEST } from "../../../../../support/Constants";
import {
  agHelper,
  anvilSnapshot,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  `${ANVIL_EDITOR_TEST}: Anvil tests for Switch Group Widget`,
  { tags: ["@tag.Anvil"] },
  () => {
    before(() => {
      agHelper.AddDsl("anvilSwitchGroupWidget");
    });

    it("1. Canvas Mode", () => {
      anvilSnapshot.verifyCanvasMode("SwitchGroupWidget");
    });

    it("2. Preview Mode", () => {
      anvilSnapshot.verifyPreviewMode("SwitchoGroupWidget");
    });

    it("3. Deploy Mode", () => {
      anvilSnapshot.verifyDeployMode("SwitchGroupWidget");
    });
  },
);
