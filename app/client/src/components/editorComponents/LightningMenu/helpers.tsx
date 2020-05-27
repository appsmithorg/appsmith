import React from "react";
import { RestAction } from "api/ActionAPI";
import { Directions } from "utils/helpers";
import { WidgetProps } from "widgets/BaseWidget";
import CustomizedDropdown, {
  CustomizedDropdownOption,
} from "pages/common/CustomizedDropdown";
import Button from "components/editorComponents/Button";
import { getNextEntityName } from "utils/AppsmithUtils";
import { ActionData } from "reducers/entityReducers/actionsReducer";
import { Datasource } from "api/DatasourcesApi";
import history from "utils/history";
import {
  QUERY_EDITOR_URL_WITH_SELECTED_PAGE_ID,
  DATA_SOURCES_EDITOR_URL,
} from "constants/routes";

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
  themeType: string,
  apis: RestAction[],
  pageId: string,
  createNewApiAction: (pageId: string) => void,
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
              themeType={themeType}
              type="button"
            />
          ),
          onSelect: () => {
            createNewApiAction(pageId);
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
  themeType: themeType,
});

export const getQueryOptions = (
  themeType: string,
  queries: RestAction[],
  pageId: string,
  applicationId: string,
  actions: ActionData[],
  pluginIds: string[],
  dataSources: Datasource[],
  createAction: (data: Partial<RestAction>) => void,
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
              themeType={themeType}
              type="button"
            />
          ),
          onSelect: () => {
            const pageApiNames = actions
              .filter(a => a.config.pageId === pageId)
              .map(a => a.config.name);
            const validDataSources: Array<Datasource> = [];
            dataSources.forEach(dataSource => {
              if (pluginIds?.includes(dataSource.pluginId)) {
                validDataSources.push(dataSource);
              }
            });
            if (validDataSources.length) {
              const newQueryName = getNextEntityName("Query", pageApiNames);
              const dataSourceId = validDataSources[0].id;
              createAction({
                name: newQueryName,
                pageId,
                datasource: {
                  id: dataSourceId,
                },
                actionConfiguration: {},
              });
              history.push(
                QUERY_EDITOR_URL_WITH_SELECTED_PAGE_ID(
                  applicationId,
                  pageId,
                  pageId,
                ),
              );
            } else {
              history.push(DATA_SOURCES_EDITOR_URL(applicationId, pageId));
            }
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
  themeType: themeType,
});

export const getWidgetOptions = (
  themeType: string,
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
  themeType: themeType,
});

export const getLightningMenuOptions = (
  apis: RestAction[],
  queries: RestAction[],
  widgets: WidgetProps[],
  pageId: string,
  applicationId: string,
  actions: ActionData[],
  pluginIds: string[],
  dataSources: Datasource[],
  createNewApiAction: (pageId: string) => void,
  createAction: (data: Partial<RestAction>) => void,
  themeType: string,
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
          {...getApiOptions(
            themeType,
            apis,
            pageId,
            createNewApiAction,
            updatePropertyValue,
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
            themeType,
            queries,
            pageId,
            applicationId,
            actions,
            pluginIds,
            dataSources,
            createAction,
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
          {...getWidgetOptions(themeType, widgets, updatePropertyValue)}
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
