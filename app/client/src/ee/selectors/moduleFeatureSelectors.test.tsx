import * as configs from "@appsmith/configs";
import * as featureFlagsSelectors from "@appsmith/selectors/featureFlagsSelectors";
import { DEFAULT_FEATURE_FLAG_VALUE } from "@appsmith/entities/FeatureFlag";
import { getShowQueryModule, getShowUIModule } from "./moduleFeatureSelectors";
import type { FeatureFlag } from "@appsmith/entities/FeatureFlag";
import type { AppsmithUIConfigs } from "@appsmith/configs/types";
import type { AppState } from "@appsmith/reducers";

jest.mock("@appsmith/configs");
jest.mock("@appsmith/selectors/featureFlagsSelectors");

const mockFeatureFlag = (flag: FeatureFlag, value: boolean) => {
  const featureFlagsSelectorsFactory = featureFlagsSelectors as jest.Mocked<
    typeof featureFlagsSelectors
  >;
  featureFlagsSelectorsFactory.selectFeatureFlags.mockImplementation(() => ({
    ...DEFAULT_FEATURE_FLAG_VALUE,
    [flag]: value,
  }));
};

const mockCloudHosting = (value: boolean) => {
  const configsFactory = configs as jest.Mocked<typeof configs>;

  configsFactory.getAppsmithConfigs.mockImplementation(
    () =>
      ({
        cloudHosting: value,
      }) as AppsmithUIConfigs,
  );
};

describe("getShowQueryModule selector", () => {
  it("returns false when cloudHosting is true and feature flag is disabled", () => {
    mockCloudHosting(true);
    mockFeatureFlag("release_query_module_enabled", false);

    const result = getShowQueryModule({} as AppState);

    expect(result).toBe(false);
  });

  it("returns false when cloudHosting is false and feature flag is disabled", () => {
    mockCloudHosting(false);
    mockFeatureFlag("release_query_module_enabled", false);

    const result = getShowQueryModule({} as AppState);

    expect(result).toBe(false);
  });

  it("returns true when cloudHosting is true feature flag is enabled", () => {
    mockCloudHosting(true);
    mockFeatureFlag("release_query_module_enabled", true);

    const result = getShowQueryModule({} as AppState);

    expect(result).toBe(false);
  });

  it("returns true when cloudHosting is false feature flag is enabled", () => {
    mockCloudHosting(false);
    mockFeatureFlag("release_query_module_enabled", true);

    const result = getShowQueryModule({} as AppState);

    expect(result).toBe(true);
  });
});

describe("getShowUIModule selector", () => {
  it("returns false when cloudHosting is true and feature flag is disabled", () => {
    mockCloudHosting(true);
    mockFeatureFlag("release_ui_module_enabled", false);

    const result = getShowUIModule({} as AppState);

    expect(result).toBe(false);
  });

  it("returns false when cloudHosting is false and feature flag is disabled", () => {
    mockCloudHosting(false);
    mockFeatureFlag("release_ui_module_enabled", false);

    const result = getShowUIModule({} as AppState);

    expect(result).toBe(false);
  });

  it("returns true when cloudHosting is true feature flag is enabled", () => {
    mockCloudHosting(true);
    mockFeatureFlag("release_ui_module_enabled", true);

    const result = getShowUIModule({} as AppState);

    expect(result).toBe(false);
  });

  it("returns true when cloudHosting is false feature flag is enabled", () => {
    mockCloudHosting(false);
    mockFeatureFlag("release_ui_module_enabled", true);

    const result = getShowUIModule({} as AppState);

    expect(result).toBe(true);
  });
});
