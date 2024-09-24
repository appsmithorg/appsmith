import type {
  PropertyPaneConfig,
  PropertyPaneControlConfig,
} from "constants/PropertyControlConstants";
import { DefaultMobileCameraTypes } from "WidgetProvider/constants";
import contentConfig from "./contentConfig";

describe("codescanner property control", () => {
  const propertyConfigs = contentConfig
    .map((sectionConfig) => sectionConfig.children)
    .flat() as PropertyPaneControlConfig[];

  const defaultCameraProperty = propertyConfigs.find(
    (propertyConfig) => propertyConfig.propertyName === "defaultCamera",
  ) as PropertyPaneConfig;

  it("validates the codescanner widget has a default camera property", () => {
    expect(defaultCameraProperty).not.toBeNull();
  });

  it("validates the options for default mobile camera property", () => {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((defaultCameraProperty as any).options).toHaveLength(2);
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((defaultCameraProperty as any).options[0].value).toEqual(
      DefaultMobileCameraTypes.FRONT,
    );
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((defaultCameraProperty as any).options[1].value).toEqual(
      DefaultMobileCameraTypes.BACK,
    );
  });

  it("validates the default mobile camera value to be back camera", () => {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((defaultCameraProperty as any).defaultValue).toEqual(
      DefaultMobileCameraTypes.BACK,
    );
  });
});
