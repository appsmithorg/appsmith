import { ANVIL_EDITOR_TEST } from "../../../../../support/Constants";
import {
  agHelper,
  anvilSnapshot,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  `${ANVIL_EDITOR_TEST}: Anvil tests for Button Widget`,
  { tags: ["@tag.Anvil"] },
  () => {
    before(() => {
      agHelper.AddDsl("anvilInputWidget");
    });

    it("1. Canvas Mode", () => {
      // trigger input invalid state
      anvilSnapshot.enterPreviewMode();
      cy.get("input[aria-required=true]").first().type("123");
      cy.get("input[aria-required=true]").first().clear();
      anvilSnapshot.exitPreviewMode();

      anvilSnapshot.verifyCanvasMode("InputWidget");
    });

    it("2. Preview Mode", () => {
      anvilSnapshot.verifyPreviewMode("InputWidget");
    });

    it("3. Deploy Mode", () => {
      anvilSnapshot.verifyDeployMode("InputWidget");
    });
  },
);
