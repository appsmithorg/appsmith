import { ANVIL_EDITOR_TEST } from "../../../../../support/Constants";
import {
  agHelper,
  anvilSnapshot,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  `${ANVIL_EDITOR_TEST}: Anvil tests for Paragraph Widget`,
  { tags: ["@tag.Anvil"] },
  () => {
    before(() => {
      agHelper.AddDsl("anvilParagraphWidget");
    });

    it("1. Canvas Mode", () => {
      anvilSnapshot.verifyCanvasMode("ParagraphWidget");
    });

    it("2. Preview Mode", () => {
      anvilSnapshot.verifyPreviewMode("ParagraphWidget");
    });

    it("3. Deploy Mode", () => {
      anvilSnapshot.verifyDeployMode("ParagraphWidget");
    });
  },
);
