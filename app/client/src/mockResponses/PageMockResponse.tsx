import { PageResponse } from "../api/PageApi";

const PageMockResponse: PageResponse = {
  responseMeta: {
    responseCode: "SUCCESS",
  },
  layout: {
    dsl: {
      widgetId: "0",
      widgetType: "CONTAINER_WIDGET",
      topRow: 2,
      leftColumn: 2,
      rightColumn: 10,
      bottomRow: 10,
      children: [
        {
          widgetId: "1",
          widgetType: "BUTTON_WIDGET",
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
        actionId: "5d8082e2795dc6000482bc84",
        actionType: "API",
        actionName: "getUsers",
        dynamicBindings: ["$.apiData.0.name"],
      },
    ],
  },
};

export default PageMockResponse;
