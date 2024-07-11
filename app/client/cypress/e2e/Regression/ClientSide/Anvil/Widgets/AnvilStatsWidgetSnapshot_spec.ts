import { ANVIL_EDITOR_TEST } from "../../../../../support/Constants";
import {
  agHelper,
  anvilSnapshot,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  `${ANVIL_EDITOR_TEST}: Anvil tests for Stats Widget`,
  { tags: ["@tag.Anvil"] },
  () => {
    before(() => {
      agHelper.AddDsl("anvilStatsWidget");
    });

    it("1. Canvas Mode", () => {
      anvilSnapshot.matchSanpshotForCanvasMode("StatsWidget");
      anvilSnapshot.setTheme("dark");
      anvilSnapshot.matchSanpshotForCanvasMode("StatsWidget", "dark");
      anvilSnapshot.setTheme("light");
    });

    it("2. Preview Mode", () => {
      anvilSnapshot.enterPreviewMode("StatsWidget");
    });

    it("3. Deploy Mode", () => {
      anvilSnapshot.matchSnapshotForDeployMode("StatsWidget");
    });
  },
);
