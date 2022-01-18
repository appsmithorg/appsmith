import {
  PropertiesOverridingKeyMap,
  OverridingPropertyPaths,
  OverridingPropertyType,
} from "./dataTreeFactory";

type SetOverridingPropertyParams = {
  key: string;
  value: string;
  propertiesOverridingKeyMap: PropertiesOverridingKeyMap;
  overridingPropertyPaths: OverridingPropertyPaths;
  type: OverridingPropertyType;
};

export const setOverridingProperty = ({
  key: overriddenPropertyKey,
  overridingPropertyPaths,
  propertiesOverridingKeyMap,
  type,
  value: overridingPropertyKey,
}: SetOverridingPropertyParams) => {
  if (!(overriddenPropertyKey in propertiesOverridingKeyMap)) {
    propertiesOverridingKeyMap[overriddenPropertyKey] = {
      [OverridingPropertyType.DEFAULT]: undefined,
      [OverridingPropertyType.META]: undefined,
    };
  }
  switch (type) {
    case OverridingPropertyType.DEFAULT:
      propertiesOverridingKeyMap[overriddenPropertyKey][
        OverridingPropertyType.DEFAULT
      ] = overridingPropertyKey;
      break;
    case OverridingPropertyType.META:
      propertiesOverridingKeyMap[overriddenPropertyKey][
        OverridingPropertyType.META
      ] = overridingPropertyKey;
      break;
    default:
  }
  if (Array.isArray(overridingPropertyPaths[overriddenPropertyKey])) {
    const updatedOverridingProperty = new Set(
      overridingPropertyPaths[overridingPropertyKey],
    );
    overridingPropertyPaths[overridingPropertyKey] = [
      ...updatedOverridingProperty.add(overriddenPropertyKey),
    ];
  } else {
    overridingPropertyPaths[overridingPropertyKey] = [overriddenPropertyKey];
  }
};
