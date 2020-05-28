import React from "react";
import { RestAction } from "api/ActionAPI";
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

export const getApiOptions = (
  skin: string,
  apis: RestAction[],
  pageId: string,
  dispatch: Function,
  updatePropertyValue: (value: string, cursor?: number) => void,
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
          updatePropertyValue(`{{${api.name}.data}}`);
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
});

export const getQueryOptions = (
  skin: string,
  queries: RestAction[],
  pageId: string,
  dispatch: Function,
  updatePropertyValue: (value: string, cursor?: number) => void,
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
          updatePropertyValue(`{{${query.name}.data}}`);
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
});

export const getWidgetOptions = (
  skin: string,
  widgets: WidgetProps[],
  updatePropertyValue: (value: string, cursor?: number) => void,
) => ({
  sections: [
    {
      options: widgets.map(widget => ({
        content: widget.widgetName,
        disabled: false,
        shouldCloseDropdown: true,
        onSelect: () => {
          updatePropertyValue(`{{${widget.widgetName}.}}`);
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
});

export const getLightningMenuOptions = (
  apis: RestAction[],
  queries: RestAction[],
  widgets: WidgetProps[],
  pageId: string,
  dispatch: Function,
  skin: string,
  updatePropertyValue: (value: string, cursor?: number) => void,
) => {
  const options: CustomizedDropdownOption[] = [
    {
      content: LIGHTNING_MENU_OPTION_TEXT,
      disabled: false,
      shouldCloseDropdown: true,
      onSelect: () => {
        updatePropertyValue("");
      },
    },
    {
      content: (
        <CustomizedDropdown
          {...getApiOptions(skin, apis, pageId, dispatch, updatePropertyValue)}
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
            updatePropertyValue,
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
          {...getWidgetOptions(skin, widgets, updatePropertyValue)}
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
        updatePropertyValue("{{}}");
      },
    },
    {
      content: LIGHTNING_MENU_OPTION_HTML,
      disabled: false,
      shouldCloseDropdown: true,
      onSelect: () => {
        updatePropertyValue("<p></p>", 3);
      },
    },
  ];
};
