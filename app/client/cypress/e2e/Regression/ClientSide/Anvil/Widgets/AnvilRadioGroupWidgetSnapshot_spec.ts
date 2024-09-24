import { ANVIL_EDITOR_TEST } from "../../../../../support/Constants";
import {
  agHelper,
  anvilSnapshot,
} from "../../../../../support/Objects/ObjectsCore";

// TODO: Enable when issue(github.com/appsmithorg/appsmith/issues/36419) is solved.
describe.skip(
  `${ANVIL_EDITOR_TEST}: Anvil tests for Radio Group Widget`,
  { tags: ["@tag.Anvil", "@tag.Visual"] },
  () => {
    before(() => {
      agHelper.AddDsl("anvilRadioGroupWidget");
    });

    it("1. Canvas Mode", () => {
      anvilSnapshot.matchSnapshotForCanvasMode("RadioGroupWidget");
      anvilSnapshot.setTheme("dark");
      anvilSnapshot.matchSnapshotForCanvasMode("RadioGroupWidget", "dark");
      anvilSnapshot.setTheme("light");
    });

    it("2. Preview Mode", () => {
      anvilSnapshot.matchSnapshotForPreviewMode("RadioGroupWidget");
    });

    it("3. Deploy Mode", () => {
      anvilSnapshot.matchSnapshotForDeployMode("RadioGroupWidget");
    });
  },
);
