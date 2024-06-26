import { ANVIL_EDITOR_TEST } from "../../../../../support/Constants";
import {
  agHelper,
  anvilSnapshot,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  `${ANVIL_EDITOR_TEST}: Anvil tests for Currency Input Widget`,
  { tags: ["@tag.Anvil"] },
  () => {
    before(() => {
      agHelper.AddDsl("anvilCurrencyInputWidget");
    });

    it("1. Canvas Mode", () => {
      anvilSnapshot.triggerInputInvalidState();
      anvilSnapshot.verifyCanvasMode("CurrencyInputWidget");
    });

    it("2. Preview Mode", () => {
      anvilSnapshot.verifyPreviewMode("CurrencyInputWidget");
    });

    it("3. Deploy Mode", () => {
      anvilSnapshot.verifyDeployMode("CurrencyInputWidget");
    });
  },
);
