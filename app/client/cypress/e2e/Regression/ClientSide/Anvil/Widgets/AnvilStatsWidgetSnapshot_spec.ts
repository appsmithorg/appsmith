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
      anvilSnapshot.verifyCanvasMode("StatsWidget");
    });

    it("2. Preview Mode", () => {
      anvilSnapshot.verifyPreviewMode("StatsWidget");
    });

    it("3. Deploy Mode", () => {
      anvilSnapshot.verifyDeployMode("StatsWidget");
    });
  },
);
