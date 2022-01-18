import { OverridingProperties } from "./dataTreeFactory";

type SetOverridingPropertyParams = {
  key: string;
  newValue: string;
  overridingProperties: OverridingProperties;
};

export const setOverridingProperty = ({
  key,
  newValue,
  overridingProperties,
}: SetOverridingPropertyParams) => {
  if (Array.isArray(overridingProperties[key])) {
    const updatedOverridingProperty = new Set(overridingProperties[key]);
    overridingProperties[key] = [...updatedOverridingProperty.add(newValue)];
  } else {
    overridingProperties[key] = [newValue];
  }
};
