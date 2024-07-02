import { ANVIL_EDITOR_TEST } from "../../../../../support/Constants";
import {
  agHelper,
  anvilSnapshot,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  `${ANVIL_EDITOR_TEST}: Anvil tests for Heading Widget`,
  { tags: ["@tag.Anvil"] },
  () => {
    before(() => {
      agHelper.AddDsl("anvilHeadingWidget");
    });

    it("1. Canvas Mode", () => {
      anvilSnapshot.verifyCanvasMode("HeadingWidget");
    });

    it("2. Preview Mode", () => {
      anvilSnapshot.verifyPreviewMode("HeadingWidget");
    });

    it("3. Deploy Mode", () => {
      anvilSnapshot.verifyDeployMode("HeadingWidget");
    });
  },
);
