import { agHelper } from "../../../../support/Objects/ObjectsCore";

describe(
  "Validating use cases for Auto Dimension",
  { tags: ["@tag.MainContainer"] },
  () => {
    before(() => {
      agHelper.AddDsl("mainContainerOverflow");
    });

    it("1. Artboard should contain the main container fully", () => {
      agHelper.GetWidgetCSSHeight(".t--canvas-artboard").then((height) => {
        agHelper.GetWidgetCSSHeight(".drop-target-0").then((mcHeight) => {
          expect(parseInt(height?.split("px")[0])).to.greaterThan(
            parseInt(mcHeight?.split("px")[0]),
          );
        });
      });
    });
  },
);
