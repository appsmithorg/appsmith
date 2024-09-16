import { ANVIL_EDITOR_TEST } from "../../../../../support/Constants";
import {
  agHelper,
  anvilSnapshot,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  `${ANVIL_EDITOR_TEST}: Anvil tests for Heading Widget`,
  { tags: ["@tag.Anvil", "@tag.Visual"] },
  () => {
    before(() => {
      agHelper.AddDsl("anvilHeadingWidget");
    });

    it("1. Canvas Mode", () => {
      anvilSnapshot.matchSnapshotForCanvasMode("HeadingWidget");
      anvilSnapshot.setTheme("dark");
      anvilSnapshot.matchSnapshotForCanvasMode("HeadingWidget", "dark");
      anvilSnapshot.setTheme("light");
    });

    it("2. Preview Mode", () => {
      anvilSnapshot.matchSnapshotForPreviewMode("HeadingWidget");
    });

    it("3. Deploy Mode", () => {
      anvilSnapshot.matchSnapshotForDeployMode("HeadingWidget");
    });
  },
);
