import type {
  AnvilConfig,
  AutoLayoutConfig,
  AutocompletionDefinitions,
  FlattenedWidgetProps,
  WidgetBaseConfiguration,
  WidgetDefaultProps,
} from "WidgetProvider/constants";
import type { DerivedPropertiesMap } from "WidgetProvider/factory";
import type { SetterConfig, Stylesheet } from "entities/AppTheming";
import type { ContainerWidgetProps } from "widgets/ContainerWidget/widget";
import {
  anvilConfig,
  baseConfig,
  defaultConfig,
  propertyPaneContent,
  propertyPaneStyle,
} from "./config";
import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import type { LayoutProps } from "layoutSystems/anvil/utils/anvilTypes";
import BaseWidget from "widgets/BaseWidget";
import type { ReactNode } from "react";
import React from "react";
import { ContainerComponent } from "widgets/anvil/Container";
import { LayoutProvider } from "layoutSystems/anvil/layoutComponents/LayoutProvider";
import { Elevations, anvilWidgets } from "widgets/anvil/constants";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import type {
  CopiedWidgetData,
  PasteDestinationInfo,
  PastePayload,
} from "layoutSystems/anvil/utils/paste/types";
import { call } from "redux-saga/effects";
import { pasteWidgetsInSection } from "layoutSystems/anvil/utils/paste/sectionPasteUtils";

class SectionWidget extends BaseWidget<SectionWidgetProps, WidgetState> {
  static type = anvilWidgets.SECTION_WIDGET;

  static getConfig(): WidgetBaseConfiguration {
    return baseConfig;
  }

  static getDefaults(): WidgetDefaultProps {
    return defaultConfig;
  }

  static getPropertyPaneConfig() {
    return [];
  }
  static getPropertyPaneContentConfig() {
    return propertyPaneContent;
  }

  static getPropertyPaneStyleConfig() {
    return propertyPaneStyle;
  }

  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return {};
  }

  static getSetterConfig(): SetterConfig | null {
    return null;
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {};
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {};
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {};
  }

  static getAutoLayoutConfig(): AutoLayoutConfig | null {
    return {};
  }

  static getAnvilConfig(): AnvilConfig | null {
    return anvilConfig;
  }

  static getStylesheetConfig(): Stylesheet {
    return {
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
    };
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  static pasteOperationChecks(
    allWidgets: CanvasWidgetsReduxState,
    oldWidget: FlattenedWidgetProps,
    newWidget: FlattenedWidgetProps,
    widgetIdMap: Record<string, string>,
  ): FlattenedWidgetProps | null {
    const widget: FlattenedWidgetProps = { ...newWidget };
    if (widget.spaceDistributed) {
      const newSpaceDistribution: { [key: string]: string } = {};
      Object.keys(widget.spaceDistributed).forEach((key: string) => {
        if (widgetIdMap[key])
          newSpaceDistribution[widgetIdMap[key]] = widget.spaceDistributed[key];
      });
      widget.spaceDistributed = newSpaceDistribution;
    }
    return widget;
  }

  static *performPasteOperation(
    allWidgets: CanvasWidgetsReduxState,
    copiedWidgets: CopiedWidgetData[],
    destinationInfo: PasteDestinationInfo,
    widgetIdMap: Record<string, string>,
    reverseWidgetIdMap: Record<string, string>,
  ) {
    const res: PastePayload = yield call(
      pasteWidgetsInSection,
      allWidgets,
      copiedWidgets,
      destinationInfo,
      widgetIdMap,
      reverseWidgetIdMap,
    );
    return res;
  }

  getWidgetView(): ReactNode {
    return (
      <ContainerComponent
        elevatedBackground={this.props.elevatedBackground}
        elevation={Elevations.SECTION_ELEVATION}
        {...this.props}
      >
        <LayoutProvider {...this.props} />
      </ContainerComponent>
    );
  }
}

export interface SectionWidgetProps extends ContainerWidgetProps<WidgetProps> {
  layout: LayoutProps[];
}

export default SectionWidget;
