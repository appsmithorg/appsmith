import { objectKeys } from "@appsmith/utils";
import {
  checkContainersForAutoHeightAction,
  updateWidgetAutoHeightAction,
} from "actions/autoHeightActions";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { Colors } from "constants/Colors";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import {
  GridDefaults,
  WIDGET_TAGS,
  WidgetHeightLimits,
} from "constants/WidgetConstants";
import type { CanvasWidgetsReduxState } from "ee/reducers/entityReducers/canvasWidgetsReducer";
import type { SetterConfig, Stylesheet } from "entities/AppTheming";
import { renderAppsmithCanvas } from "layoutSystems/CanvasFactory";
import type { FlexLayer } from "layoutSystems/autolayout/utils/types";
import {
  FlexLayerAlignment,
  FlexVerticalAlignment,
  LayoutDirection,
  Positioning,
  ResponsiveBehavior,
} from "layoutSystems/common/utils/constants";
import { LayoutSystemTypes } from "layoutSystems/types";
import { get, orderBy } from "lodash";
import React from "react";
import store from "store";
import { generateTypeDef } from "utils/autocomplete/defCreatorUtils";
import { klonaFullWithTelemetry } from "utils/helpers";
import { getWidgetBluePrintUpdates } from "utils/WidgetBlueprintUtils";
import { DynamicHeight } from "utils/WidgetFeatures";
import type { DerivedPropertiesMap } from "WidgetProvider/factory/types";
import type {
  AnvilConfig,
  AutocompletionDefinitions,
  AutoLayoutConfig,
  FlattenedWidgetProps,
  PropertyUpdates,
  SnipingModeProperty,
  WidgetBaseConfiguration,
} from "WidgetProvider/types";
import { BlueprintOperationTypes } from "WidgetProvider/types";
import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";
import {
  DefaultAutocompleteDefinitions,
  isAutoHeightEnabledForWidget,
} from "widgets/WidgetUtils";

import type { CardChromeProps } from "../chromeHeight";
import {
  getCardChromeHeightInPx,
  getCardChromeHeightInRows,
} from "../chromeHeight";
import CardComponent from "../component";
import type {
  CardFooterAction,
  CardMenuItem,
  CardWidgetProps,
} from "../constants";
import {
  DEFAULT_MEDIA_HEIGHT,
  MEDIA_LEFT_WIDTH,
  MediaObjectFitTypes,
  MediaPositionTypes,
} from "../constants";
import IconSVG from "../icon.svg";
import ThumbnailSVG from "../thumbnail.svg";
import contentConfig from "./propertyConfig/contentConfig";
import styleConfig from "./propertyConfig/styleConfig";

class CardWidget extends BaseWidget<CardWidgetProps, WidgetState> {
  static type = "CARD_WIDGET";

  static getConfig(): WidgetBaseConfiguration {
    return {
      name: "Card",
      iconSVG: IconSVG,
      thumbnailSVG: ThumbnailSVG,
      tags: [WIDGET_TAGS.DISPLAY],
      needsMeta: true,
      isCanvas: true,
      // The card's height is driven by its body content plus header/footer
      // chrome (see getCanvasHeightOffset). Without this flag the auto-height
      // saga updates the height in the editor's reducer but never persists it
      // (shouldEval stays false in updateWidgetAutoHeightSaga), so a published
      // app renders a stale, too-short card that clips the body. Table/List
      // set this for the same content-driven-height reason.
      needsHeightForContent: true,
      searchTags: ["card", "panel", "tile"],
    };
  }

  static getFeatures() {
    return {
      dynamicHeight: {
        // Index of the "General" section in the content property pane config
        sectionIndex: 6,
        active: true,
      },
    };
  }

  static getMethods() {
    return {
      getSnipingModeUpdates: (
        propValueMap: SnipingModeProperty,
      ): PropertyUpdates[] => {
        const binding = propValueMap.data;
        // The sniping saga always provides "{{ActionName.data}}" (or
        // "{{ActionName.<path>}}"). Seed cardData with the first record
        // of the bound query data.
        const cardDataBinding =
          typeof binding === "string" && binding.endsWith("}}")
            ? binding.replace(/}}$/, "[0]}}")
            : binding;

        return [
          {
            propertyPath: "cardData",
            propertyValue: cardDataBinding,
            isDynamicPropertyPath: true,
          },
        ];
      },
      /**
       * Chrome reserved for this widget, in grid rows. Shares
       * getCardChromeHeightInRows with the render path (getChromeHeight) so the
       * space the saga reserves always matches the space the component paints.
       */
      getCanvasHeightOffset: (props: WidgetProps): number =>
        // The sagas hand us raw DSL props, so the bindable/meta fields this
        // reads are all `unknown` as far as WidgetProps is concerned.
        getCardChromeHeightInRows(props as CardChromeProps),
    };
  }

  static getDefaults() {
    return {
      rows: 30,
      columns: 24,
      widgetName: "Card",
      animateLoading: true,
      backgroundColor: "#FFFFFF",
      borderColor: Colors.GREY_5,
      borderWidth: "1",
      cardData: {},
      mediaPosition: MediaPositionTypes.NONE,
      mediaHeight: DEFAULT_MEDIA_HEIGHT,
      mediaObjectFit: MediaObjectFitTypes.COVER,
      showHeader: true,
      title: "Card title",
      subtitle: "Card subtitle",
      menuItems: {
        menuItem1: {
          label: "First menu item",
          id: "menuItem1",
          widgetId: "",
          isVisible: true,
          isDisabled: false,
          index: 0,
        },
        menuItem2: {
          label: "Second menu item",
          id: "menuItem2",
          widgetId: "",
          isVisible: true,
          isDisabled: false,
          index: 1,
        },
      },
      showFooter: true,
      footerActions: {
        footerAction1: {
          label: "Edit",
          id: "footerAction1",
          widgetId: "",
          buttonVariant: "SECONDARY",
          isVisible: true,
          isDisabled: false,
          index: 0,
        },
        footerAction2: {
          label: "View",
          id: "footerAction2",
          widgetId: "",
          buttonVariant: "PRIMARY",
          isVisible: true,
          isDisabled: false,
          index: 1,
        },
      },
      isClickable: false,
      isDisabled: false,
      selectionEnabled: false,
      defaultSelected: false,
      expandCollapseEnabled: false,
      defaultExpanded: true,
      showHeaderDivider: true,
      showFooterDivider: true,
      hoverElevation: false,
      // The card's chrome is 100px (header + footer + borders) before any media,
      // so the generic MIN_CANVAS_HEIGHT_IN_ROWS floor would leave zero room for
      // the body. Reserve chrome plus a body row band, as TabsWidget does for
      // its own tab-bar chrome.
      minDynamicHeight: WidgetHeightLimits.MIN_CANVAS_HEIGHT_IN_ROWS + 5,
      // NOTE: shouldScrollContents is intentionally not declared here. For
      // isCanvas widgets WidgetFeaturePropertyEnhancements forces it to true and
      // is spread after getDefaults(), so any value set here would be dead code.
      children: [],
      positioning: Positioning.Fixed,
      responsiveBehavior: ResponsiveBehavior.Fill,
      flexVerticalAlignment: FlexVerticalAlignment.Stretch,
      minWidth: FILL_WIDGET_MIN_WIDTH,
      version: 1,
      blueprint: {
        view: [
          {
            type: "CANVAS_WIDGET",
            position: { top: 0, left: 0 },
            props: {
              containerStyle: "none",
              canExtend: false,
              detachFromLayout: true,
              children: [],
              version: 1,
              blueprint: {
                view: [
                  {
                    type: "TEXT_WIDGET",
                    size: {
                      rows: 4,
                      cols: 36,
                    },
                    position: { top: 1, left: 1 },
                    props: {
                      text: "Add widgets to design the card body",
                      fontSize: "0.875rem",
                      textColor: "#999999",
                      version: 1,
                    },
                  },
                ],
              },
            },
          },
        ],
        operations: [
          {
            type: BlueprintOperationTypes.MODIFY_PROPS,
            fn: (widget: WidgetProps & { children?: WidgetProps[] }) => {
              // Seed footer action button colors from the app theme
              // (same pattern as ButtonGroupWidget's groupButtons).
              const footerActions: Record<string, CardFooterAction> =
                klonaFullWithTelemetry(
                  widget.footerActions,
                  "CardWidget.footerActions",
                );

              // TODO: Fix this the next time the file is edited
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const dynamicBindingPathList: any[] = get(
                widget,
                "dynamicBindingPathList",
                [],
              );

              objectKeys(footerActions).map((actionKey) => {
                footerActions[actionKey].buttonColor = get(
                  widget,
                  "childStylesheet.footerAction.buttonColor",
                  "{{appsmith.theme.colors.primaryColor}}",
                );

                dynamicBindingPathList.push({
                  key: `footerActions.${actionKey}.buttonColor`,
                });
              });

              return [
                {
                  widgetId: widget.widgetId,
                  propertyName: "dynamicBindingPathList",
                  propertyValue: dynamicBindingPathList,
                },
                {
                  widgetId: widget.widgetId,
                  propertyName: "footerActions",
                  propertyValue: footerActions,
                },
              ];
            },
          },
          {
            type: BlueprintOperationTypes.MODIFY_PROPS,
            fn: (
              widget: FlattenedWidgetProps,
              widgets: CanvasWidgetsReduxState,
              parent: FlattenedWidgetProps,
              layoutSystemType: LayoutSystemTypes,
            ) => {
              if (layoutSystemType === LayoutSystemTypes.FIXED) {
                return [];
              }

              // In auto-layout, convert the seeded body canvas to a
              // vertical flex canvas (Statbox pattern).
              const canvasWidget: FlattenedWidgetProps = get(
                widget,
                "children.0",
              );
              const childrenIds: string[] = get(
                widget,
                "children.0.children",
                [],
              );
              const children: FlattenedWidgetProps[] = childrenIds.map(
                (childId) => widgets[childId],
              );
              const textWidget = children.find(
                (child) => child.type === "TEXT_WIDGET",
              );

              if (!canvasWidget || !textWidget) {
                return [];
              }

              const flexLayers: FlexLayer[] = [
                {
                  children: [
                    {
                      id: textWidget.widgetId,
                      align: FlexLayerAlignment.Start,
                    },
                  ],
                },
              ];

              return getWidgetBluePrintUpdates({
                [widget.widgetId]: {
                  dynamicHeight: DynamicHeight.AUTO_HEIGHT,
                },
                [canvasWidget.widgetId]: {
                  flexLayers,
                  useAutoLayout: true,
                  positioning: Positioning.Vertical,
                },
                [textWidget.widgetId]: {
                  responsiveBehavior: ResponsiveBehavior.Fill,
                  alignment: FlexLayerAlignment.Start,
                  rightColumn: GridDefaults.DEFAULT_GRID_COLUMNS,
                },
              });
            },
          },
        ],
      },
    };
  }

  static getAutoLayoutConfig(): AutoLayoutConfig {
    return {
      widgetSize: [
        {
          viewportMinWidth: 0,
          configuration: () => {
            return {
              minWidth: "280px",
              minHeight: "100px",
            };
          },
        },
      ],
      disableResizeHandles: {
        vertical: true,
      },
    };
  }

  static getAnvilConfig(): AnvilConfig | null {
    return {
      isLargeWidget: false,
      widgetSize: {
        maxHeight: {},
        maxWidth: {},
        minHeight: { base: "100px" },
        minWidth: { base: "280px" },
      },
    };
  }

  static getPropertyPaneContentConfig() {
    return contentConfig;
  }

  static getPropertyPaneStyleConfig() {
    return styleConfig;
  }

  static getStylesheetConfig(): Stylesheet {
    return {
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      selectedAccentColor: "{{appsmith.theme.colors.primaryColor}}",
      childStylesheet: {
        footerAction: {
          buttonColor: "{{appsmith.theme.colors.primaryColor}}",
        },
      },
    };
  }

  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return (widget: CardWidgetProps) => ({
      "!doc":
        "Card groups related information and actions into a visually distinct unit with media, header, body and footer zones",
      "!url": "https://docs.appsmith.com/widget-reference/card",
      isVisible: DefaultAutocompleteDefinitions.isVisible,
      isSelected: "bool",
      isExpanded: "bool",
      isDisabled: "bool",
      cardData: generateTypeDef(widget.cardData),
    });
  }

  static getSetterConfig(): SetterConfig {
    return {
      __setters: {
        setVisibility: {
          path: "isVisible",
          type: "boolean",
        },
        setDisabled: {
          path: "isDisabled",
          type: "boolean",
        },
        setSelected: {
          path: "defaultSelected",
          type: "boolean",
          accessor: "isSelected",
        },
        setExpanded: {
          path: "defaultExpanded",
          type: "boolean",
          accessor: "isExpanded",
        },
      },
    };
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {};
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      isSelected: "defaultSelected",
      isExpanded: "defaultExpanded",
    };
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static getMetaPropertiesMap(): Record<string, any> {
    return {
      isSelected: undefined,
      isExpanded: undefined,
    };
  }

  getVisibleMenuItems = (): CardMenuItem[] => {
    const menuItems = Object.values(this.props.menuItems || {}).filter(
      (item) => item.isVisible === true,
    );

    return orderBy(menuItems, ["index"], ["asc"]);
  };

  getVisibleFooterActions = (): CardFooterAction[] => {
    const actions = Object.values(this.props.footerActions || {}).filter(
      (action) => action.isVisible === true,
    );

    return orderBy(actions, ["index"], ["asc"]);
  };

  hasMedia = (): boolean => {
    return (
      this.props.mediaPosition !== MediaPositionTypes.NONE &&
      Boolean(this.props.mediaImage)
    );
  };

  isCardExpanded = (props: CardWidgetProps = this.props): boolean => {
    return props.expandCollapseEnabled ? props.isExpanded !== false : true;
  };

  getChromeHeight = (): number => getCardChromeHeightInPx(this.props);

  handleCardClick = () => {
    // The component already blocks these paths when disabled; guarding at the
    // executeAction boundary too so a disabled card can never fire an action
    // even if a future refactor drops a `disabled` prop.
    if (this.props.isDisabled) return;

    if (this.props.onCardClick) {
      super.executeAction({
        triggerPropertyName: "onCardClick",
        dynamicString: this.props.onCardClick,
        event: {
          type: EventType.ON_CLICK,
        },
      });
    }
  };

  handleFooterActionClick = (onClick?: string) => {
    if (this.props.isDisabled) return;

    if (onClick) {
      super.executeAction({
        triggerPropertyName: "onClick",
        dynamicString: onClick,
        event: {
          type: EventType.ON_CLICK,
        },
      });
    }
  };

  handleMenuItemClick = (onClick?: string) => {
    if (this.props.isDisabled) return;

    if (onClick) {
      super.executeAction({
        triggerPropertyName: "onClick",
        dynamicString: onClick,
        event: {
          type: EventType.ON_CLICK,
        },
      });
    }
  };

  handleToggleSelection = () => {
    if (this.props.isDisabled) {
      return;
    }

    const isSelected = !this.props.isSelected;

    this.props.updateWidgetMetaProperty("isSelected", isSelected, {
      triggerPropertyName: "onSelect",
      dynamicString: this.props.onSelect,
      event: {
        type: EventType.ON_SELECT,
      },
    });
  };

  handleToggleExpand = () => {
    if (this.props.isDisabled) {
      return;
    }

    const isExpanded = !this.isCardExpanded();

    this.props.updateWidgetMetaProperty("isExpanded", isExpanded, {
      triggerPropertyName: isExpanded ? "onExpand" : "onCollapse",
      dynamicString: isExpanded ? this.props.onExpand : this.props.onCollapse,
      event: {
        type: EventType.ON_CLICK,
      },
    });
  };

  componentDidUpdate(prevProps: CardWidgetProps) {
    const wasExpanded = this.isCardExpanded(prevProps);
    const isExpanded = this.isCardExpanded();

    // Reflow the widget height when the card collapses/expands and
    // auto height is enabled in fixed layout. Auto height is disabled
    // for meta widgets (e.g. inside ListWidgetV2 rows), so skip there.
    if (
      wasExpanded !== isExpanded &&
      !this.props.isMetaWidget &&
      this.props.layoutSystemType === LayoutSystemTypes.FIXED &&
      isAutoHeightEnabledForWidget(this.props)
    ) {
      if (isExpanded) {
        // Recompute the height from the body canvas children.
        store.dispatch(checkContainersForAutoHeightAction());
      } else {
        // Shrink to the chrome height, in pixels.
        //
        // Do NOT request 0 here. updateWidgetAutoHeightAction goes through the
        // batched (payload-less) saga path, where a requested height of 0 is the
        // platform's "widget went invisible" signal: in the editor
        // shouldCollapseThisWidget is false so the update is dropped entirely,
        // and in preview/published it forces the minimum to 0 and collapses the
        // card to zero rows — taking the header and the expand chevron with it,
        // leaving no way to re-expand. Requesting the real chrome height keeps
        // the card visible and is clamped up to minDynamicHeight as usual.
        store.dispatch(
          updateWidgetAutoHeightAction(
            this.props.widgetId,
            this.getChromeHeight(),
          ),
        );
      }
    }
  }

  renderBodyCanvas = (): React.ReactNode => {
    if (!this.isCardExpanded()) {
      return null;
    }

    const childWidgetData = {
      ...this.props.children?.filter(Boolean)[0],
    } as WidgetProps;

    if (!childWidgetData || !childWidgetData.widgetId) {
      return null;
    }

    const { componentHeight, componentWidth } = this.props;

    // Match the component's scroll gate (getWidgetView) — an extendable body
    // canvas in auto-layout has no scroll container, so content would be
    // silently unreachable.
    const canScrollContents =
      Boolean(this.props.shouldScrollContents) &&
      this.props.layoutSystemType === LayoutSystemTypes.FIXED;

    childWidgetData.parentId = this.props.widgetId;
    childWidgetData.shouldScrollContents = false;
    childWidgetData.canExtend = canScrollContents;
    childWidgetData.isVisible = this.props.isVisible;

    const bodyWidth =
      componentWidth -
      (this.hasMedia() && this.props.mediaPosition === MediaPositionTypes.LEFT
        ? MEDIA_LEFT_WIDTH
        : 0);
    // Clamped: the card can be sized below its own chrome (chrome reaches ~240px
    // with TOP media), and a negative height would be handed to the canvas as
    // bottomRow/minHeight.
    const bodyHeight = Math.max(0, componentHeight - this.getChromeHeight());

    childWidgetData.rightColumn = bodyWidth;
    childWidgetData.bottomRow = canScrollContents
      ? childWidgetData.bottomRow
      : bodyHeight;
    childWidgetData.minHeight = bodyHeight;

    const positioning: Positioning =
      this.props.layoutSystemType === LayoutSystemTypes.AUTO
        ? Positioning.Vertical
        : Positioning.Fixed;

    childWidgetData.positioning = positioning;
    childWidgetData.useAutoLayout = positioning === Positioning.Vertical;
    childWidgetData.direction =
      positioning === Positioning.Vertical
        ? LayoutDirection.Vertical
        : LayoutDirection.Horizontal;

    return renderAppsmithCanvas(childWidgetData);
  };

  getWidgetView() {
    const isClickable = Boolean(this.props.isClickable);

    return (
      <CardComponent
        avatarIcon={this.props.avatarIcon}
        avatarImage={this.props.avatarImage}
        backgroundColor={this.props.backgroundColor}
        badgeColor={this.props.badgeColor}
        badgeText={this.props.badgeText}
        borderColor={this.props.borderColor}
        borderRadius={this.props.borderRadius}
        borderWidth={this.props.borderWidth}
        boxShadow={this.props.boxShadow}
        expandCollapseEnabled={Boolean(this.props.expandCollapseEnabled)}
        footerActions={this.getVisibleFooterActions()}
        hoverElevation={Boolean(this.props.hoverElevation)}
        isClickable={isClickable}
        isDisabled={Boolean(this.props.isDisabled)}
        isExpanded={this.isCardExpanded()}
        isLoading={this.props.isLoading}
        isSelected={Boolean(this.props.isSelected)}
        mediaAltText={this.props.mediaAltText}
        mediaHeight={this.props.mediaHeight}
        mediaImage={this.props.mediaImage}
        mediaObjectFit={this.props.mediaObjectFit}
        mediaPosition={this.props.mediaPosition || MediaPositionTypes.NONE}
        menuItems={this.getVisibleMenuItems()}
        onCardClick={isClickable ? this.handleCardClick : undefined}
        onFooterActionClick={this.handleFooterActionClick}
        onMenuItemClick={this.handleMenuItemClick}
        onToggleExpand={this.handleToggleExpand}
        onToggleSelection={this.handleToggleSelection}
        selectedAccentColor={this.props.selectedAccentColor}
        selectionEnabled={Boolean(this.props.selectionEnabled)}
        shouldScrollContents={
          Boolean(this.props.shouldScrollContents) &&
          this.props.layoutSystemType === LayoutSystemTypes.FIXED
        }
        showFooter={this.props.showFooter !== false}
        showFooterDivider={this.props.showFooterDivider !== false}
        showHeader={this.props.showHeader !== false}
        showHeaderDivider={this.props.showHeaderDivider !== false}
        subtitle={this.props.subtitle}
        title={this.props.title}
        widgetId={this.props.widgetId}
        widgetName={this.props.widgetName}
      >
        {this.renderBodyCanvas()}
      </CardComponent>
    );
  }
}

export default CardWidget;
