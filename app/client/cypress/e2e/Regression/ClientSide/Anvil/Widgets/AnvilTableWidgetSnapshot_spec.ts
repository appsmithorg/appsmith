import { ANVIL_EDITOR_TEST } from "../../../../../support/Constants";
import {
  agHelper,
  anvilSnapshot,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  `${ANVIL_EDITOR_TEST}: Anvil tests for Table Widget`,
  { tags: ["@tag.Anvil", "@tag.Visual"] },
  () => {
    before(() => {
      agHelper.AddDsl("anvilTableWidget");
    });

    it("1. Canvas Mode", () => {
      anvilSnapshot.matchSnapshotForCanvasMode("TableWidget");
      anvilSnapshot.setTheme("dark");
      anvilSnapshot.matchSnapshotForCanvasMode("TableWidget", "dark");
      anvilSnapshot.setTheme("light");
    });

    it("2. Preview Mode", () => {
      anvilSnapshot.matchSnapshotForPreviewMode("TableWidget");
    });

    it("3. Deploy Mode", () => {
      anvilSnapshot.matchSnapshotForDeployMode("TableWidget");
    });
  },
);
