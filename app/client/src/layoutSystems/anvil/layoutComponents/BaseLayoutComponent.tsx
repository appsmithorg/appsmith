import React, { PureComponent } from "react";
import type {
  AnvilHighlightInfo,
  DeriveHighlightsFn,
  LayoutComponentProps,
  LayoutComponentState,
  LayoutComponentTypes,
  LayoutProps,
  WidgetLayoutProps,
} from "../utils/anvilTypes";
import { renderLayouts, renderWidgets } from "../utils/layouts/renderUtils";
import {
  addChildToLayout,
  extractWidgetIdsFromLayoutProps,
  removeChildFromLayout,
} from "../utils/layouts/layoutUtils";
import { RenderModes } from "constants/WidgetConstants";
import LayoutFactory from "./LayoutFactory";
import { AnvilCanvasDraggingArena } from "../canvasArenas/AnvilCanvasDraggingArena";

abstract class BaseLayoutComponent extends PureComponent<
  LayoutComponentProps,
  LayoutComponentState
> {
  static type: LayoutComponentTypes;

  // Add a child widget / layout to the parent layout component.
  static addChild(
    props: LayoutProps,
    children: WidgetLayoutProps[] | LayoutProps[],
    highlight: AnvilHighlightInfo,
  ): LayoutProps {
    return addChildToLayout(props, children, highlight);
  }

  // get template of layout component to wrap new widgets in.
  static getChildTemplate(_props: LayoutProps): LayoutProps | null {
    return null && _props;
  }

  // Get a list of highlights to demarcate the drop positions within the layout.
  static deriveHighlights: DeriveHighlightsFn = () => () => [];

  // Get a list of child widgetIds rendered by the layout.
  static extractChildWidgetIds(props: LayoutProps): string[] {
    return this.rendersWidgets ? extractWidgetIdsFromLayoutProps(props) : [];
  }

  // Remove a child widget / layout from the layout component.
  // return undefined if layout is not permanent and is empty after deletion.
  static removeChild(
    props: LayoutProps,
    child: WidgetLayoutProps | LayoutProps,
  ): LayoutProps | undefined {
    return removeChildFromLayout(props, child);
  }

  renderChildLayouts(): React.ReactNode {
    const { canvasId, childrenMap, layout, parentDropTarget, renderMode } =
      this.props;
    return renderLayouts(
      layout as LayoutProps[],
      childrenMap,
      canvasId,
      parentDropTarget,
      renderMode,
      this.state.order,
    );
  }

  // Render child widgets using the layout property.
  renderChildWidgets(): React.ReactNode {
    return renderWidgets(this.props);
  }

  renderDraggingArena(): React.ReactNode | null {
    const {
      canvasId,
      isDropTarget,
      layoutId,
      layoutType,
      parentDropTarget,
      renderMode,
    } = this.props;
    if (!isDropTarget || renderMode !== RenderModes.CANVAS) return null;
    return (
      <AnvilCanvasDraggingArena
        allowedWidgetTypes={this.props.allowedWidgetTypes || []}
        canvasId={canvasId}
        deriveAllHighlightsFn={LayoutFactory.getDeriveHighlightsFn(layoutType)(
          this.props,
          canvasId,
          this.state.order,
          parentDropTarget,
        )}
        layoutId={layoutId}
      />
    );
  }

  // Check if the layout component renders widgets or layouts.
  static rendersWidgets: boolean = false;

  render(): JSX.Element | null {
    return null;
  }
}

export default BaseLayoutComponent;
