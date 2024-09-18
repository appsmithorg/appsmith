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
import { AnvilDraggingArena } from "../editor/canvasArenas/AnvilDraggingArena";
import { FlexLayout, type FlexLayoutProps } from "./components/FlexLayout";
import { defaultHighlightPayload } from "../utils/constants";

abstract class BaseLayoutComponent extends PureComponent<
  LayoutComponentProps,
  LayoutComponentState
> {
  constructor(props: LayoutComponentProps) {
    super(props);
    this.state = {
      order: [...props.layoutOrder, props.layoutId],
    };
  }

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
  static getChildTemplate(
    _props: LayoutProps,
    _widgets?: WidgetLayoutProps[],
  ): LayoutProps | null {
    return null && _props && _widgets;
  }

  getFlexLayoutProps(): Omit<FlexLayoutProps, "children"> {
    return {
      canvasId: this.props.canvasId,
      isContainer: !!this.props.isContainer,
      isDropTarget: !!this.props.isDropTarget,
      layoutId: this.props.layoutId,
      layoutIndex: this.props.layoutIndex,
      layoutType: this.props.layoutType,
      parentDropTarget: this.props.parentDropTarget,
      ...(this.props.layoutStyle || {}),
    };
  }

  // Get a list of highlights to demarcate the drop positions within the layout.
  static deriveHighlights: DeriveHighlightsFn = () => () =>
    defaultHighlightPayload;

  // Get a list of child widgetIds rendered by the layout.
  static extractChildWidgetIds(props: LayoutProps): string[] {
    return this.rendersWidgets ? extractWidgetIdsFromLayoutProps(props) : [];
  }

  // Get types of widgets that are allowed in this layout component.
  static getWhitelistedTypes(props: LayoutProps): string[] {
    if (props.allowedWidgetTypes && props.allowedWidgetTypes.length) {
      return props.allowedWidgetTypes;
    }

    return [];
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
    const { canvasId, layout, parentDropTarget, renderMode } = this.props;

    return renderLayouts(
      layout as LayoutProps[],
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
    const { canvasId, isDropTarget, layoutId, layoutType, parentDropTarget } =
      this.props;

    if (!isDropTarget) return null;

    return (
      <AnvilDraggingArena
        allowedWidgetTypes={this.props.allowedWidgetTypes || []}
        deriveAllHighlightsFn={LayoutFactory.getDeriveHighlightsFn(layoutType)(
          this.props,
          canvasId,
          this.state.order,
          parentDropTarget,
        )}
        layoutId={layoutId}
        layoutType={layoutType}
        widgetId={canvasId}
      />
    );
  }

  // Check if the layout component renders widgets or layouts.
  static rendersWidgets: boolean = false;

  render(): JSX.Element | null {
    return <>{this.renderContent()}</>;
  }

  protected renderContent(): React.ReactNode {
    return this.props.renderMode === RenderModes.CANVAS
      ? this.renderEditMode()
      : this.renderViewMode();
  }

  renderEditMode(): JSX.Element {
    return (
      <>
        {this.renderViewMode()}
        {this.renderDraggingArena()}
      </>
    );
  }

  renderViewMode(): React.ReactNode {
    return (
      <FlexLayout {...this.getFlexLayoutProps()}>
        {this.renderChildren()}
      </FlexLayout>
    );
  }

  renderChildren(): React.ReactNode {
    return (this.constructor as typeof BaseLayoutComponent).rendersWidgets
      ? this.renderChildWidgets()
      : this.renderChildLayouts();
  }
}

export default BaseLayoutComponent;
