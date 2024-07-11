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
      anvilSnapshot.matchSanpshotForCanvasMode("SwitchoGroupWidget");
      anvilSnapshot.setTheme("dark");
      anvilSnapshot.matchSanpshotForCanvasMode("SwitchoGroupWidget", "dark");
      anvilSnapshot.setTheme("light");
    });

    it("2. Preview Mode", () => {
      anvilSnapshot.matchSnapshotForPreviewMode("SwitchoGroupWidget");
    });

    it("3. Deploy Mode", () => {
      anvilSnapshot.matchSnapshotForDeployMode("SwitchGroupWidget");
    });
  },
);
