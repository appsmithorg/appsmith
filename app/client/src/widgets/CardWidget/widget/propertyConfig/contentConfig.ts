import type { PropertyPaneConfig } from "constants/PropertyControlConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";

import type { CardWidgetProps } from "../../constants";
import { MediaObjectFitTypes, MediaPositionTypes } from "../../constants";
import footerActionsConfig from "./childPanels/footerActionsConfig";
import menuItemsConfig from "./childPanels/menuItemsConfig";

export default [
  {
    sectionName: "Data",
    children: [
      {
        propertyName: "cardData",
        helpText:
          "Sets the entity displayed by this card. Connect a datasource, or bind one record, e.g. {{userQuery.data[0]}}",
        label: "Card data",
        // Opts the Card into the one-click "Connect data" flow. The aliases are
        // the fields the user maps to actual columns; getPropertyUpdatesForQuery
        // Binding turns them into title/subtitle bindings.
        controlType: "ONE_CLICK_BINDING_CONTROL",
        controlConfig: {
          aliases: [
            {
              name: "title",
              isSearcheable: true,
              isRequired: true,
            },
            {
              name: "subtitle",
            },
          ],
          sampleData: JSON.stringify(
            { name: "John Doe", email: "john.doe@example.com" },
            null,
            2,
          ),
        },
        placeholderText: '{{Query1.data[0]}} or { "name": "John" }',
        inputType: "OBJECT",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.OBJECT,
          params: { default: {} },
        },
      },
    ],
  },
  {
    sectionName: "Media",
    children: [
      {
        propertyName: "mediaPosition",
        helpText: "Sets the position of the media slot",
        label: "Position",
        controlType: "ICON_TABS",
        fullWidth: true,
        options: [
          {
            label: "Top",
            value: MediaPositionTypes.TOP,
          },
          {
            label: "Left",
            value: MediaPositionTypes.LEFT,
          },
          {
            label: "None",
            value: MediaPositionTypes.NONE,
          },
        ],
        defaultValue: MediaPositionTypes.NONE,
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.TEXT,
          params: {
            allowedValues: [
              MediaPositionTypes.TOP,
              MediaPositionTypes.LEFT,
              MediaPositionTypes.NONE,
            ],
            default: MediaPositionTypes.NONE,
          },
        },
        postUpdateAction: ReduxActionTypes.CHECK_CONTAINERS_FOR_AUTO_HEIGHT,
      },
      {
        propertyName: "mediaImage",
        helpText:
          "Sets the image to display in the media slot. The image is shown only when Position is not None",
        label: "Image",
        controlType: "INPUT_TEXT",
        placeholderText: "URL / Base64",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
        postUpdateAction: ReduxActionTypes.CHECK_CONTAINERS_FOR_AUTO_HEIGHT,
      },
      {
        propertyName: "mediaAltText",
        helpText:
          "Sets the alternative text of the media image for screen readers",
        label: "Alt text",
        controlType: "INPUT_TEXT",
        placeholderText: "Describe the image",
        isBindProperty: true,
        isTriggerProperty: false,
        hidden: (props: CardWidgetProps) =>
          props.mediaPosition === MediaPositionTypes.NONE,
        dependencies: ["mediaPosition"],
        validation: { type: ValidationTypes.TEXT },
      },
      {
        propertyName: "mediaHeight",
        helpText: "Sets the height of the media slot in pixels",
        label: "Media height",
        controlType: "INPUT_TEXT",
        placeholderText: "140",
        isBindProperty: true,
        isTriggerProperty: false,
        hidden: (props: CardWidgetProps) =>
          props.mediaPosition !== MediaPositionTypes.TOP,
        dependencies: ["mediaPosition"],
        validation: {
          type: ValidationTypes.NUMBER,
          params: { min: 40, default: 140 },
        },
        postUpdateAction: ReduxActionTypes.CHECK_CONTAINERS_FOR_AUTO_HEIGHT,
      },
      {
        propertyName: "mediaObjectFit",
        helpText: "Sets how the image fits inside the media slot",
        label: "Image fit",
        controlType: "ICON_TABS",
        fullWidth: true,
        options: [
          {
            label: "Cover",
            value: MediaObjectFitTypes.COVER,
          },
          {
            label: "Contain",
            value: MediaObjectFitTypes.CONTAIN,
          },
        ],
        defaultValue: MediaObjectFitTypes.COVER,
        isBindProperty: true,
        isTriggerProperty: false,
        hidden: (props: CardWidgetProps) =>
          props.mediaPosition === MediaPositionTypes.NONE,
        dependencies: ["mediaPosition"],
        validation: {
          type: ValidationTypes.TEXT,
          params: {
            allowedValues: [
              MediaObjectFitTypes.COVER,
              MediaObjectFitTypes.CONTAIN,
            ],
            default: MediaObjectFitTypes.COVER,
          },
        },
      },
    ],
  },
  {
    sectionName: "Header",
    children: [
      {
        propertyName: "showHeader",
        helpText: "Controls the visibility of the card header",
        label: "Show header",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
        postUpdateAction: ReduxActionTypes.CHECK_CONTAINERS_FOR_AUTO_HEIGHT,
      },
      {
        propertyName: "title",
        helpText: "Sets the title of the card",
        label: "Title",
        controlType: "INPUT_TEXT",
        placeholderText: "Card title",
        isBindProperty: true,
        isTriggerProperty: false,
        hidden: (props: CardWidgetProps) => !props.showHeader,
        dependencies: ["showHeader"],
        validation: { type: ValidationTypes.TEXT },
      },
      {
        propertyName: "subtitle",
        helpText: "Sets the subtitle of the card",
        label: "Subtitle",
        controlType: "INPUT_TEXT",
        placeholderText: "Card subtitle",
        isBindProperty: true,
        isTriggerProperty: false,
        hidden: (props: CardWidgetProps) => !props.showHeader,
        dependencies: ["showHeader"],
        validation: { type: ValidationTypes.TEXT },
      },
      {
        propertyName: "avatarImage",
        helpText:
          "Sets the avatar image of the card header. Takes precedence over the avatar icon",
        label: "Avatar image",
        controlType: "INPUT_TEXT",
        placeholderText: "URL / Base64",
        isBindProperty: true,
        isTriggerProperty: false,
        hidden: (props: CardWidgetProps) => !props.showHeader,
        dependencies: ["showHeader"],
        validation: { type: ValidationTypes.TEXT },
      },
      {
        propertyName: "avatarIcon",
        helpText:
          "Sets the avatar icon of the card header. Used when no avatar image is set",
        label: "Avatar icon",
        controlType: "ICON_SELECT",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        hidden: (props: CardWidgetProps) => !props.showHeader,
        dependencies: ["showHeader"],
        validation: { type: ValidationTypes.TEXT },
      },
      {
        propertyName: "badgeText",
        helpText: "Sets the text of the status badge",
        label: "Badge text",
        controlType: "INPUT_TEXT",
        placeholderText: "Active",
        isBindProperty: true,
        isTriggerProperty: false,
        hidden: (props: CardWidgetProps) => !props.showHeader,
        dependencies: ["showHeader"],
        validation: { type: ValidationTypes.TEXT },
      },
      {
        propertyName: "badgeColor",
        helpText: "Sets the background color of the status badge",
        label: "Badge color",
        controlType: "COLOR_PICKER",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        hidden: (props: CardWidgetProps) => !props.showHeader,
        dependencies: ["showHeader"],
        validation: { type: ValidationTypes.TEXT },
      },
      {
        propertyName: "showMenu",
        helpText:
          "Controls the visibility of the overflow (⋮) menu in the card header",
        label: "Show menu",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        hidden: (props: CardWidgetProps) => !props.showHeader,
        dependencies: ["showHeader"],
        validation: { type: ValidationTypes.BOOLEAN },
      },
      {
        helpText: "Menu items of the overflow (⋮) menu",
        propertyName: "menuItems",
        controlType: "MENU_ITEMS",
        label: "Menu items",
        isBindProperty: false,
        isTriggerProperty: false,
        // The shared MENU_ITEMS control refuses to delete the last remaining
        // item, so "Show menu" is the supported way to remove the menu entirely.
        hidden: (props: CardWidgetProps) =>
          !props.showHeader || props.showMenu === false,
        dependencies: ["showHeader", "showMenu"],
        panelConfig: menuItemsConfig,
      },
    ],
  },
  {
    sectionName: "Footer",
    children: [
      {
        propertyName: "showFooter",
        helpText: "Controls the visibility of the card footer",
        label: "Show footer",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
        postUpdateAction: ReduxActionTypes.CHECK_CONTAINERS_FOR_AUTO_HEIGHT,
      },
      {
        helpText: "Action buttons rendered in the card footer",
        propertyName: "footerActions",
        controlType: "GROUP_BUTTONS",
        label: "Actions",
        isBindProperty: false,
        isTriggerProperty: false,
        hidden: (props: CardWidgetProps) => !props.showFooter,
        dependencies: ["childStylesheet", "showFooter"],
        panelConfig: footerActionsConfig,
      },
    ],
  },
  {
    sectionName: "Selection",
    children: [
      {
        propertyName: "selectionEnabled",
        helpText:
          "Lets users select the card by clicking it. Selection takes precedence over the clickable behavior: when enabled, clicking the card toggles selection instead of firing onCardClick",
        label: "Enable selection",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
      {
        propertyName: "defaultSelected",
        helpText:
          "Selects the card by default. Changes to the default selection update the widget state",
        label: "Default selected",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        hidden: (props: CardWidgetProps) => !props.selectionEnabled,
        dependencies: ["selectionEnabled"],
        validation: { type: ValidationTypes.BOOLEAN },
      },
      {
        helpText:
          "when the card selection is toggled. The new state is available on the widget's isSelected property",
        propertyName: "onSelect",
        label: "onSelect",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
        hidden: (props: CardWidgetProps) => !props.selectionEnabled,
        dependencies: ["selectionEnabled"],
      },
    ],
  },
  {
    sectionName: "Expansion",
    children: [
      {
        propertyName: "expandCollapseEnabled",
        helpText:
          "Shows a chevron in the header that collapses the card to its media and header",
        label: "Enable expand and collapse",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
      {
        propertyName: "defaultExpanded",
        helpText:
          "Expands the card by default. Changes to the default update the widget state",
        label: "Default expanded",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        hidden: (props: CardWidgetProps) => !props.expandCollapseEnabled,
        dependencies: ["expandCollapseEnabled"],
        validation: { type: ValidationTypes.BOOLEAN },
      },
      {
        helpText: "when the card is expanded",
        propertyName: "onExpand",
        label: "onExpand",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
        hidden: (props: CardWidgetProps) => !props.expandCollapseEnabled,
        dependencies: ["expandCollapseEnabled"],
      },
      {
        helpText: "when the card is collapsed",
        propertyName: "onCollapse",
        label: "onCollapse",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
        hidden: (props: CardWidgetProps) => !props.expandCollapseEnabled,
        dependencies: ["expandCollapseEnabled"],
      },
    ],
  },
  {
    sectionName: "General",
    children: [
      {
        propertyName: "isVisible",
        helpText: "Controls the visibility of the widget",
        label: "Visible",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
      {
        propertyName: "isClickable",
        helpText:
          "Makes the whole card clickable and enables the onCardClick event. When selection is enabled, clicking the card toggles selection instead of firing onCardClick",
        label: "Clickable",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
      {
        propertyName: "isDisabled",
        helpText:
          "Disables the card: dims it and blocks card clicks, selection, expansion, footer actions and the overflow menu",
        label: "Disabled",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
      {
        propertyName: "shouldScrollContents",
        helpText: "Enables scrolling for content inside the card body",
        label: "Scroll contents",
        controlType: "SWITCH",
        isBindProperty: false,
        isTriggerProperty: false,
      },
      {
        propertyName: "animateLoading",
        label: "Animate loading",
        controlType: "SWITCH",
        helpText: "Controls the loading of the widget",
        defaultValue: true,
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
    ],
  },
  {
    sectionName: "Events",
    // Selection takes precedence over the clickable behavior, so onCardClick
    // can never fire while selection is enabled — don't offer an action
    // selector that is silently dead.
    hidden: (props: CardWidgetProps) =>
      !props.isClickable || Boolean(props.selectionEnabled),
    children: [
      {
        helpText: "when the card background is clicked",
        propertyName: "onCardClick",
        label: "onCardClick",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
        dependencies: ["isClickable", "selectionEnabled"],
      },
    ],
  },
] as PropertyPaneConfig[];
