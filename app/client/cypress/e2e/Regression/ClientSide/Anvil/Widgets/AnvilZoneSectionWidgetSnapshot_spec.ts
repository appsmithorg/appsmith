import { ANVIL_EDITOR_TEST
} from "../../../../../support/Constants";
import {
  agHelper,
  anvilSnapshot,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  `${ANVIL_EDITOR_TEST
}: Anvil tests for Zone and Section Widget`,
{ tags: [
    "@tag.Anvil"
  ]
},
  () => {
    before(() => {
      agHelper.AddDsl("anvilZoneSectionWidget");
  });

    it("1. Canvas Mode", () => {
      anvilSnapshot.verifyCanvasMode("ZoneSectionWidget");
  });

    it("2. Preview Mode", () => {
      anvilSnapshot.verifyPreviewMode("ZoneSectionWidget");
  });

    it("3. Deploy Mode", () => {
      anvilSnapshot.verifyDeployMode("ZoneSectionWidget");
  });
},
);
