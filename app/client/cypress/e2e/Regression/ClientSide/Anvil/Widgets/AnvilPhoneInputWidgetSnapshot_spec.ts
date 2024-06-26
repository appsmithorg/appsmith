import { ANVIL_EDITOR_TEST } from "../../../../../support/Constants";
import {
  agHelper,
  anvilSnapshot,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  `${ANVIL_EDITOR_TEST}: Anvil tests for Phone Input Widget`,
  { tags: ["@tag.Anvil"] },
  () => {
    before(() => {
      agHelper.AddDsl("anvilPhoneInputWidget");
    });

    it("1. Canvas Mode", () => {
      anvilSnapshot.triggerInputInvalidState();
      anvilSnapshot.verifyCanvasMode("PhoneInputWidget");
    });

    it("2. Preview Mode", () => {
      anvilSnapshot.verifyPreviewMode("PhoneInputWidget");
    });

    it("3. Deploy Mode", () => {
      anvilSnapshot.verifyDeployMode("PhoneInputWidget");
    });
  },
);
