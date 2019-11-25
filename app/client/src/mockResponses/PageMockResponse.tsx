import { FetchPageResponse } from "api/PageApi";
import { generateReactKey } from "utils/generators";
import { WidgetType } from "constants/WidgetConstants";
import { ActionType } from "constants/ActionConstants";

const PageMockResponse: FetchPageResponse = {
  responseMeta: {
    status: 200,
    success: true,
  },
  data: {
    id: generateReactKey(),
    applicationId: generateReactKey(),
    name: "Mock Page",
    layouts: [
      {
        id: generateReactKey(),
        dsl: {
          widgetId: "0",
          type: "CONTAINER_WIDGET" as WidgetType,
          topRow: 2,
          leftColumn: 2,
          rightColumn: 10,
          bottomRow: 10,
          children: [
            {
              widgetId: "1",
              type: "BUTTON_WIDGET" as WidgetType,
              topRow: 2,
              leftColumn: 2,
              text: "submit",
              rightColumn: 10,
              bottomRow: 10,
              onClick: [
                {
                  actionId: "5d8082e2795dc6000482bc84",
                  actionType: "API",
                },
              ],
            },
          ],
        },
        actions: [
          {
            id: "5d8082e2795dc6000482bc84",
            actionType: "API" as ActionType,
            name: "getUsers",
            jsonPathKeys: ["$.apiData.0.name"],
          },
        ],
      },
    ],
  },
};

export default PageMockResponse;
