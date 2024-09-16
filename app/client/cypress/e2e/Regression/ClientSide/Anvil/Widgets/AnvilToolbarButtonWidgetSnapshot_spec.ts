import { ANVIL_EDITOR_TEST } from "../../../../../support/Constants";
import {
  agHelper,
  anvilSnapshot,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  `${ANVIL_EDITOR_TEST}: Anvil tests for Toolbar Button Widget`,
  { tags: ["@tag.Anvil", "@tag.Visual"] },
  () => {
    before(() => {
      agHelper.AddDsl("anvilToolbarButtonWidget");
    });

    it("1. Canvas Mode", () => {
      anvilSnapshot.matchSnapshotForCanvasMode("ToolbarButtonWidget");
      anvilSnapshot.setTheme("dark");
      anvilSnapshot.matchSnapshotForCanvasMode("ToolbarButtonWidget", "dark");
      anvilSnapshot.setTheme("light");
    });

    it("2. Preview Mode", () => {
      anvilSnapshot.matchSnapshotForPreviewMode("ToolbarButtonWidget");
    });

    it("3. Deploy Mode", () => {
      anvilSnapshot.matchSnapshotForDeployMode("ToolbarButtonWidget");
    });
  },
);
