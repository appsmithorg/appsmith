import { ANVIL_EDITOR_TEST } from "../../../../../support/Constants";
import {
  agHelper,
  anvilSnapshot,
} from "../../../../../support/Objects/ObjectsCore";

const locators = anvilSnapshot.getLocators();

describe(
  `${ANVIL_EDITOR_TEST}: Anvil tests for App Theming`,
  { tags: ["@tag.Anvil"] },
  () => {
    before(() => {
      agHelper.AddDsl("anvilAppTheming");
    });

    it("1. Theme - Light and Dark", () => {
      anvilSnapshot.matchSnapshot(locators.canvas, "AppTheming");
      anvilSnapshot.matchSnapshotForPreviewMode("AppTheming");
      anvilSnapshot.matchSnapshotForDeployMode("AppTheming");

      anvilSnapshot.setTheme("dark");

      anvilSnapshot.matchSnapshot(locators.canvas, "AppTheming", "canvas", "dark");
      anvilSnapshot.matchSnapshotForPreviewMode("AppTheming", "dark");
      anvilSnapshot.matchSnapshotForDeployMode("AppTheming", "dark");
    });

    it("2. Preview Mode", () => {
      anvilSnapshot.verifyPreviewMode("ButtonWidget");
    });

    it("3. Deploy Mode", () => {
      anvilSnapshot.verifyDeployMode("ButtonWidget");
    });
  },
);
