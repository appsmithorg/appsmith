import React from "react";
import { RestAction } from "entities/Action";
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
  LIGHTNING_MENU_OPTION_TEXT,
  LIGHTNING_MENU_QUERY_CREATE_NEW,
  LIGHTNING_MENU_API_CREATE_NEW,
} from "constants/messages";
import { Skin } from "constants/DefaultTheme";

export const getApiOptions = (
  skin: Skin,
  apis: RestAction[],
  pageId: string,
  dispatch: Function,
  updateDynamicInputValue: (value: string, cursor?: number) => void,
) => ({
  sections: [
    {
      isSticky: true,
      options: [
        {
          content: (
            <Button
              text={LIGHTNING_MENU_API_CREATE_NEW}
              icon="plus"
              iconAlignment="left"
              skin={skin}
              type="button"
            />
          ),
          onSelect: () => {
            dispatch(createNewApiAction(pageId));
          },
        },
      ],
    },
    {
      options: apis.map(api => ({
        content: api.name,
        onSelect: () => {
          updateDynamicInputValue(`{{${api.name}.data}}`);
        },
      })),
    },
  ],
  trigger: {
    text: LIGHTNING_MENU_DATA_API,
  },
  openDirection: Directions.RIGHT,
  openOnHover: false,
  skin: skin,
  modifiers: {
    offset: {
      offset: "0, 16px",
    },
  },
});

export const getQueryOptions = (
  skin: Skin,
  queries: RestAction[],
  pageId: string,
  dispatch: Function,
  updateDynamicInputValue: (value: string, cursor?: number) => void,
) => ({
  sections: [
    {
      isSticky: true,
      options: [
        {
          content: (
            <Button
              text={LIGHTNING_MENU_QUERY_CREATE_NEW}
              icon="plus"
              iconAlignment="left"
              skin={skin}
              type="button"
            />
          ),
          onSelect: () => {
            dispatch(createNewQueryAction(pageId));
          },
        },
      ],
    },
    {
      options: queries.map(query => ({
        content: query.name,
        onSelect: () => {
          updateDynamicInputValue(`{{${query.name}.data}}`);
        },
      })),
    },
  ],
  trigger: {
    text: LIGHTNING_MENU_DATA_QUERY,
  },
  openDirection: Directions.RIGHT,
  openOnHover: false,
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
      options: widgets.map(widget => ({
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
    text: LIGHTNING_MENU_DATA_WIDGET,
  },
  openDirection: Directions.RIGHT,
  openOnHover: false,
  skin: skin,
  modifiers: {
    offset: {
      offset: "0, 16px",
    },
  },
});

export const getLightningMenuOptions = (
  apis: RestAction[],
  queries: RestAction[],
  widgets: WidgetProps[],
  pageId: string,
  dispatch: Function,
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
      content: LIGHTNING_MENU_OPTION_JS,
      disabled: false,
      shouldCloseDropdown: true,
      onSelect: () => {
        updateDynamicInputValue("{{}}");
      },
    },
    {
      content: LIGHTNING_MENU_OPTION_HTML,
      disabled: false,
      shouldCloseDropdown: true,
      onSelect: () => {
        updateDynamicInputValue("<p></p>", 3);
      },
    },
  ];
};
