import { ANVIL_EDITOR_TEST } from "../../../../../support/Constants";
import {
  agHelper,
  anvilSnapshot,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  `${ANVIL_EDITOR_TEST}: Anvil tests for App Theming`,
  { tags: ["@tag.Anvil"] },
  () => {
    before(() => {
      agHelper.AddDsl("anvilAppTheming");
    });

    it("1. Theme - Light and Dark Mode", () => {
      anvilSnapshot.matchSnapshotForCanvasMode("AppTheming");
      anvilSnapshot.matchSnapshotForPreviewMode("AppTheming");
      anvilSnapshot.matchSnapshotForDeployMode("AppTheming");

      anvilSnapshot.setTheme("dark");

      anvilSnapshot.matchSnapshotForCanvasMode("AppTheming", "dark");
      anvilSnapshot.matchSnapshotForPreviewMode("AppTheming", "dark");
      anvilSnapshot.matchSnapshotForDeployMode("AppTheming", "dark");

      anvilSnapshot.setTheme("light");
    });

    it("2. Theme - Accent Color", () => {
      anvilSnapshot.setAccentColor("#d54137");

      anvilSnapshot.matchSnapshotForCanvasMode("AppThemingCustomAccent");
      anvilSnapshot.matchSnapshotForPreviewMode("AppThemingCustomAccent");
      anvilSnapshot.matchSnapshotForDeployMode("AppThemingCustomAccent");

      anvilSnapshot.setAccentColor("#0080ff");
    });

    it("3. Density", () => {
      ["Tight", "Regular", "Loose"].forEach((density) => {
        anvilSnapshot.setDensity(density);

        anvilSnapshot.matchSnapshotForCanvasMode(`AppThemingDensity${density}`);
        anvilSnapshot.matchSnapshotForPreviewMode(
          `AppThemingDensity${density}`,
        );
        anvilSnapshot.matchSnapshotForDeployMode(`AppThemingDensity${density}`);
      });
    });

    it("4. Sizing", () => {
      ["Small", "Regular", "Big"].forEach((size) => {
        anvilSnapshot.setSizing(size);

        anvilSnapshot.matchSnapshotForCanvasMode(`AppThemingSizing${size}`);
        anvilSnapshot.matchSnapshotForPreviewMode(`AppThemingSizing${size}`);
        anvilSnapshot.matchSnapshotForDeployMode(`AppThemingSizing${size}`);
      });
    });

    it("5. Corners", () => {
      ["0px", "6px", "20px"].forEach((corner) => {
        anvilSnapshot.setCorners(corner);

        anvilSnapshot.matchSnapshotForCanvasMode(`AppThemingCorner${corner}`);
        anvilSnapshot.matchSnapshotForPreviewMode(`AppThemingCorner${corner}`);
        anvilSnapshot.matchSnapshotForDeployMode(`AppThemingCorner${corner}`);
      });
    }); 
  },
);
