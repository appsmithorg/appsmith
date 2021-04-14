import { Component } from "react";
import { Color } from "constants/Colors";

/***
 * Components are responsible for binding render inputs to corresponding UI SDKs
 */
abstract class BaseComponent<T extends ComponentProps> extends Component<T> {}

export interface ComponentProps {
  widgetId: string;
  widgetName?: string;
  isDisabled?: boolean;
  isVisible?: boolean;
  backgroundColor?: Color;
}

export default BaseComponent;
