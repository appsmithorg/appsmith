import { ANVIL_EDITOR_TEST } from "../../../../../support/Constants";
import {
  agHelper,
  anvilSnapshot,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  `${ANVIL_EDITOR_TEST}: Anvil tests for Checkbox Widget`,
  { tags: ["@tag.Anvil", "@tag.Visual"] },
  () => {
    before(() => {
      agHelper.AddDsl("anvilCheckboxWidget");
    });

    it("1. Canvas Mode", () => {
      anvilSnapshot.matchSnapshotForCanvasMode("CheckboxWidget");
      anvilSnapshot.setTheme("dark");
      anvilSnapshot.matchSnapshotForCanvasMode("CheckboxWidget", "dark");
      anvilSnapshot.setTheme("light");
    });

    it("2. Preview Mode", () => {
      anvilSnapshot.matchSnapshotForPreviewMode("CheckboxWidget");
    });

    it("3. Deploy Mode", () => {
      anvilSnapshot.matchSnapshotForDeployMode("CheckboxWidget");
    });
  },
);
