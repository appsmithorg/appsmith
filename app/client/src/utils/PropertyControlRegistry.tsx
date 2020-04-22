import React from "react";
import PropertyControlFactory from "./PropertyControlFactory";
import {
  PropertyControls,
  PropertyControlPropsType,
} from "components/propertyControls";
import BaseControl from "components/propertyControls/BaseControl";
class PropertyControlRegistry {
  static registerPropertyControlBuilders() {
    Object.values(PropertyControls).forEach(
      (Control: typeof BaseControl & { getControlType: () => string }) => {
        const controlType = Control.getControlType();
        PropertyControlFactory.registerControlBuilder(controlType, {
          buildPropertyControl(
            controlProps: PropertyControlPropsType,
          ): JSX.Element {
            return <Control {...controlProps} />;
          },
        });
      },
    );
  }
}

export default PropertyControlRegistry;
