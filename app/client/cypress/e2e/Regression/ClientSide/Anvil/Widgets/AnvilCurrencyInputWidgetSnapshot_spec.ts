import { ANVIL_EDITOR_TEST } from "../../../../../support/Constants";
import {
  agHelper,
  anvilSnapshot,
} from "../../../../../support/Objects/ObjectsCore";

// TODO: Enable when issue(github.com/appsmithorg/appsmith/issues/36419) is solved.
describe.skip(
  `${ANVIL_EDITOR_TEST}: Anvil tests for Currency Input Widget`,
  { tags: ["@tag.Anvil", "@tag.Visual"] },
  () => {
    before(() => {
      agHelper.AddDsl("anvilCurrencyInputWidget");
    });

    it("1. Canvas Mode", () => {
      anvilSnapshot.triggerInputInvalidState();
      anvilSnapshot.matchSnapshotForCanvasMode("CurrencyInputWidget");
      anvilSnapshot.setTheme("dark");
      anvilSnapshot.matchSnapshotForCanvasMode("CurrencyInputWidget", "dark");
      anvilSnapshot.setTheme("light");
    });

    it("2. Preview Mode", () => {
      anvilSnapshot.matchSnapshotForPreviewMode("CurrencyInputWidget");
    });

    it("3. Deploy Mode", () => {
      anvilSnapshot.matchSnapshotForDeployMode("CurrencyInputWidget");
    });
  },
);
