import {
  OverridingKeysMap,
  OverridingPropertyPaths,
  OverridingPropertyType,
} from "./dataTreeFactory";

type SetOverridingPropertyParams = {
  key: string;
  value: string;
  overridingKeysMap: OverridingKeysMap;
  overridingPropertyPaths: OverridingPropertyPaths;
  type: OverridingPropertyType;
};

export const setOverridingProperty = ({
  key: overriddenPropertyKey,
  overridingKeysMap,
  overridingPropertyPaths,
  type,
  value: overridingPropertyKey,
}: SetOverridingPropertyParams) => {
  if (!(overriddenPropertyKey in overridingKeysMap)) {
    overridingKeysMap[overriddenPropertyKey] = {
      [OverridingPropertyType.DEFAULT]: undefined,
      [OverridingPropertyType.META]: undefined,
    };
  }
  switch (type) {
    case OverridingPropertyType.DEFAULT:
      overridingKeysMap[overriddenPropertyKey][
        OverridingPropertyType.DEFAULT
      ] = overridingPropertyKey;
      break;

    case OverridingPropertyType.META:
      overridingKeysMap[overriddenPropertyKey][
        OverridingPropertyType.META
      ] = overridingPropertyKey;

      break;
    default:
  }
  if (Array.isArray(overridingPropertyPaths[overridingPropertyKey])) {
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
