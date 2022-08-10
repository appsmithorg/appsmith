import { FocusableElement } from "navigation/FocusableElement";

export enum FocusEntity {
  ApiPane = "ApiPane",
  PropertyPane = "PropertyPane",
  Widget = "Widget",
}

export interface FocusableEntity {
  entityInformation: {
    entity: FocusEntity;
  };
  focusableElements: FocusableElement[];
  registerElement: () => void;
  navigateTo: (element: FocusableElement) => void;
}
