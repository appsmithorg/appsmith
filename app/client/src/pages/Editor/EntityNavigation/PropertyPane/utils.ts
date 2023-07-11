import type {
  PropertyPaneConfig,
  PropertyPaneControlConfig,
} from "constants/PropertyControlConstants";

//TODO: This should probably get recursive
//TODO: property paths when it is not a single path
//TODO: When we want to customize the parsing for certain widgets
export const getSectionId = (
  config: readonly PropertyPaneConfig[],
  propertyPath: string,
): string | undefined => {
  for (let index = 0; index < config.length; index++) {
    const sectionChildren = config[index].children;
    if (sectionChildren) {
      for (
        let childIndex = 0;
        childIndex < sectionChildren.length;
        childIndex++
      ) {
        const controlConfig = sectionChildren[
          childIndex
        ] as PropertyPaneControlConfig;
        if (controlConfig.propertyName === propertyPath) {
          return config[index].id;
        }
      }
    }
  }
};
