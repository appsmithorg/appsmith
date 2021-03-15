import React from "react";
import { Action } from "entities/Action";
import { Directions } from "utils/helpers";
import { WidgetProps } from "widgets/BaseWidget";
import CustomizedDropdown, {
  CustomizedDropdownOption,
} from "pages/common/CustomizedDropdown";
import Button from "components/editorComponents/Button";
import {
  createNewApiAction,
  createNewQueryAction,
} from "actions/apiPaneActions";
import {
  LIGHTNING_MENU_DATA_API,
  LIGHTNING_MENU_DATA_QUERY,
  LIGHTNING_MENU_DATA_WIDGET,
  LIGHTNING_MENU_OPTION_HTML,
  LIGHTNING_MENU_OPTION_JS,
  LIGHTNING_MENU_QUERY_CREATE_NEW,
  LIGHTNING_MENU_API_CREATE_NEW,
  createMessage,
} from "constants/messages";
import { Skin } from "constants/DefaultTheme";
import { ReduxAction } from "constants/ReduxActionConstants";

export const getApiOptions = (
  skin: Skin,
  apis: Action[],
  pageId: string,
  dispatch: (action: ReduxAction<unknown>) => void,
  updateDynamicInputValue: (value: string, cursor?: number) => void,
) => ({
  sections: [
    {
      isSticky: true,
      options: [
        {
          content: (
            <Button
              text={createMessage(LIGHTNING_MENU_API_CREATE_NEW)}
              icon="plus"
              iconAlignment="left"
              skin={skin}
              type="button"
            />
          ),
          onSelect: () => {
            dispatch(createNewApiAction(pageId, "LIGHTNING_MENU"));
          },
        },
      ],
    },
    {
      options: apis.map((api) => ({
        content: api.name,
        onSelect: () => {
          updateDynamicInputValue(`{{${api.name}.data}}`);
        },
      })),
    },
  ],
  trigger: {
    text: createMessage(LIGHTNING_MENU_DATA_API),
  },
  openDirection: Directions.RIGHT,
  openOnHover: true,
  skin: skin,
  modifiers: {
    offset: {
      offset: "0, 16px",
    },
  },
});

export const getQueryOptions = (
  skin: Skin,
  queries: Action[],
  pageId: string,
  dispatch: (action: ReduxAction<unknown>) => void,
  updateDynamicInputValue: (value: string, cursor?: number) => void,
) => ({
  sections: [
    {
      isSticky: true,
      options: [
        {
          content: (
            <Button
              text={createMessage(LIGHTNING_MENU_QUERY_CREATE_NEW)}
              icon="plus"
              iconAlignment="left"
              skin={skin}
              type="button"
            />
          ),
          onSelect: () => {
            dispatch(createNewQueryAction(pageId, "LIGHTNING_MENU"));
          },
        },
      ],
    },
    {
      options: queries.map((query) => ({
        content: query.name,
        onSelect: () => {
          updateDynamicInputValue(`{{${query.name}.data}}`);
        },
      })),
    },
  ],
  trigger: {
    text: createMessage(LIGHTNING_MENU_DATA_QUERY),
  },
  openDirection: Directions.RIGHT,
  openOnHover: true,
  skin: skin,
  modifiers: {
    offset: {
      offset: "0, 16px",
    },
  },
});

export const getWidgetOptions = (
  skin: Skin,
  widgets: WidgetProps[],
  updateDynamicInputValue: (value: string, cursor?: number) => void,
) => ({
  sections: [
    {
      options: widgets.map((widget) => ({
        content: widget.widgetName,
        disabled: false,
        shouldCloseDropdown: true,
        onSelect: () => {
          updateDynamicInputValue(`{{${widget.widgetName}.}}`);
        },
      })),
    },
  ],
  trigger: {
    text: createMessage(LIGHTNING_MENU_DATA_WIDGET),
  },
  openDirection: Directions.RIGHT,
  openOnHover: true,
  skin: skin,
  modifiers: {
    offset: {
      offset: "0, 16px",
    },
  },
});

export const getLightningMenuOptions = (
  apis: Action[],
  queries: Action[],
  widgets: WidgetProps[],
  pageId: string,
  dispatch: (action: ReduxAction<unknown>) => void,
  skin: Skin,
  updateDynamicInputValue: (value: string, cursor?: number) => void,
) => {
  const options: CustomizedDropdownOption[] = [
    {
      content: (
        <CustomizedDropdown
          {...getApiOptions(
            skin,
            apis,
            pageId,
            dispatch,
            updateDynamicInputValue,
          )}
        />
      ),
      disabled: false,
      shouldCloseDropdown: false,
    },
    {
      content: (
        <CustomizedDropdown
          {...getQueryOptions(
            skin,
            queries,
            pageId,
            dispatch,
            updateDynamicInputValue,
          )}
        />
      ),
      disabled: false,
      shouldCloseDropdown: false,
    },
  ];
  if (widgets.length > 0) {
    widgets = widgets.sort((a: WidgetProps, b: WidgetProps) => {
      return a.widgetName.toUpperCase() > b.widgetName.toUpperCase() ? 1 : -1;
    });
    options.push({
      content: (
        <CustomizedDropdown
          {...getWidgetOptions(skin, widgets, updateDynamicInputValue)}
        />
      ),
      disabled: false,
      shouldCloseDropdown: false,
    });
  }
  return [
    ...options,
    {
      content: createMessage(LIGHTNING_MENU_OPTION_JS),
      disabled: false,
      shouldCloseDropdown: true,
      onSelect: () => {
        updateDynamicInputValue("{{}}");
      },
    },
    {
      content: createMessage(LIGHTNING_MENU_OPTION_HTML),
      disabled: false,
      shouldCloseDropdown: true,
      onSelect: () => {
        updateDynamicInputValue("<p></p>", 3);
      },
    },
  ];
};
