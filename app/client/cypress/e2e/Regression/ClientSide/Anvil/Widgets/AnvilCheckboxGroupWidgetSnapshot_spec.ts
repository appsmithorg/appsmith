import { ANVIL_EDITOR_TEST } from "../../../../../support/Constants";
import {
  agHelper,
  anvilSnapshot,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  `${ANVIL_EDITOR_TEST}: Anvil tests for Checkbox Group Widget`,
  { tags: ["@tag.Anvil"] },
  () => {
    before(() => {
      agHelper.AddDsl("anvilCheckboxGroupWidget");
    });

    it("1. Canvas Mode", () => {
      anvilSnapshot.triggerCheckboxGroupInvalidState();
      anvilSnapshot.matchSanpshotForCanvasMode("CheckboxGroupWidget");
      anvilSnapshot.setTheme("dark");
      anvilSnapshot.matchSanpshotForCanvasMode("CheckboxGroupWidget", "dark");
      anvilSnapshot.setTheme("light");
    });

    it("2. Preview Mode", () => {
      anvilSnapshot.matchSanpshotForCanvasMode("CheckboxGroupWidget");
    });

    it("3. Deploy Mode", () => {
      anvilSnapshot.matchSnapshotForDeployMode("CheckboxGroupWidget");
    });
  },
);
