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

  static addChild(
    props: LayoutProps,
    children: WidgetLayoutProps[] | LayoutProps[],
    highlight: AnvilHighlightInfo,
  ): LayoutProps {
    return addChildToLayout(props, children, highlight);
  }

  static getChildTemplate(props: LayoutProps): LayoutProps | undefined {
    return props;
  }

  static deriveHighlights: DeriveHighlightsFn = () => () => [];

  static extractChildWidgetIds(props: LayoutProps): string[] {
    return this.rendersWidgets ? extractWidgetIdsFromLayoutProps(props) : [];
  }

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

  renderChildWidgets(): React.ReactNode {
    return renderWidgets(this.props);
  }

  renderDraggingArea(): React.ReactNode | null {
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

  static rendersWidgets: boolean = false;

  render(): JSX.Element | null {
    return null;
  }
}

export default BaseLayoutComponent;
