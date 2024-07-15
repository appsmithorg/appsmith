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
      anvilSnapshot.matchSanpshotForCanvasMode("AppTheming");
      anvilSnapshot.matchSnapshotForPreviewMode("AppTheming");
      anvilSnapshot.matchSnapshotForDeployMode("AppTheming");

      anvilSnapshot.setTheme("dark");

      anvilSnapshot.matchSanpshotForCanvasMode("AppTheming", "dark");
      anvilSnapshot.matchSnapshotForPreviewMode("AppTheming", "dark");
      anvilSnapshot.matchSnapshotForDeployMode("AppTheming", "dark");

      anvilSnapshot.setTheme("light");
    });

    it("2. Theme - Accent Color", () => {
      anvilSnapshot.setAccentColor("#d54137");

      anvilSnapshot.matchSanpshotForCanvasMode("AppThemingCustomAccent");
      anvilSnapshot.matchSnapshotForPreviewMode("AppThemingCustomAccent");
      anvilSnapshot.matchSnapshotForDeployMode("AppThemingCustomAccent");

      anvilSnapshot.setAccentColor("#0080ff");
    });

    it("3. Typography", () => {
      anvilSnapshot.setTypography("Inter");

      anvilSnapshot.matchSanpshotForCanvasMode("AppThemingTypography");
      anvilSnapshot.matchSnapshotForPreviewMode("AppThemingTypography");
      anvilSnapshot.matchSnapshotForDeployMode("AppThemingTypography");

      anvilSnapshot.setTypography("System Default");
    });

    it("4. Density", () => {
      ["Tight", "Regular", "Loose"].forEach((density) => {
        anvilSnapshot.setDensity(density);

        anvilSnapshot.matchSanpshotForCanvasMode(`AppThemingDensity${density}`);
        anvilSnapshot.matchSnapshotForPreviewMode(`AppThemingDensity${density}`);
        anvilSnapshot.matchSnapshotForDeployMode(`AppThemingDensity${density}`);
      });
    });

    it("5. Sizing", () => {
      ["Small", "Regular", "Big"].forEach((size) => {
        anvilSnapshot.setSizing(size);

        anvilSnapshot.matchSanpshotForCanvasMode(`AppThemingSizing${size}`);
        anvilSnapshot.matchSnapshotForPreviewMode(`AppThemingSizing${size}`);
        anvilSnapshot.matchSnapshotForDeployMode(`AppThemingSizing${size}`);
      });
    });

    it.only("6. Corners", () => {
      ["0px", "6px", "20px"].forEach((corner) => {
        anvilSnapshot.setCorners(corner);

        anvilSnapshot.matchSanpshotForCanvasMode(`AppThemingCorner${corner}`);
        anvilSnapshot.matchSnapshotForPreviewMode(`AppThemingCorner${corner}`);
        anvilSnapshot.matchSnapshotForDeployMode(`AppThemingCorner${corner}`);
      });
    });

    it("7. Icon Style", () => {
      ["Filled", "Outlined"].forEach((iconStyle) => {
        anvilSnapshot.setIconStyle(iconStyle);

        anvilSnapshot.matchSanpshotForCanvasMode(`AppThemingIcon${iconStyle}`);
        anvilSnapshot.matchSnapshotForPreviewMode(`AppThemingIcon${iconStyle}`);
        anvilSnapshot.matchSnapshotForDeployMode(`AppThemingIcon${iconStyle}`);
      });
    });
  },
);
