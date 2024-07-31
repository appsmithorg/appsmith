import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import withMeta from "widgets/MetaHOC";
import { withLazyRender } from "widgets/withLazyRender";
import type BaseWidget from "widgets/BaseWidget";
import withWidgetProps from "widgets/withWidgetProps";
import { withLayoutSystemWidgetHOC } from "../../layoutSystems/withLayoutSystemWidgetHOC";
import { flow, identity } from "lodash";

export interface BaseWidgetProps extends WidgetProps, WidgetState {}

export const withBaseWidgetHOC = (
  Widget: typeof BaseWidget,
  needsMeta: boolean,
  eagerRender: boolean,
) => {
  return flow([
    // Adds Meta properties and functionality
    needsMeta ? withMeta : identity,

    // Adds respective layout specific layers to a widget
    withLayoutSystemWidgetHOC,

    // Adds Lazy rendering layer to a widget
    eagerRender ? identity : withLazyRender,

    // Adds/Enhances widget props
    withWidgetProps,
  ])(Widget);
};
