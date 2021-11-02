import { Action, PluginType } from "entities/Action";
import _ from "lodash";
import { getDynamicBindingsChangesSaga } from "utils/DynamicBindingUtils";

describe("getDynamicBindingsChangesSaga", () => {
  it("Properly updates the dynamicBindingPathlist", () => {
    const action: Action = {
      cacheResponse: "",
      id: "61810f59a0f5113e30ba72ac",
      organizationId: "61800c6bd504bf710747bf9a",
      pluginType: PluginType.API,
      pluginId: "5ca385dc81b37f0004b4db85",
      name: "Api1",
      datasource: {
        // userPermissions: [],
        name: "DEFAULT_REST_DATASOURCE",
        pluginId: "5ca385dc81b37f0004b4db85",
        organizationId: "61800c6bd504bf710747bf9a",
        datasourceConfiguration: {
          url: "https://thatcopy.pw",
        },
        invalids: [],
        messages: [],
        isValid: true,
        // new: true,
      },
      pageId: "61800cecd504bf710747bf9d",
      actionConfiguration: {
        // timeoutInMillisecond: 10000,
        // paginationType: "NONE",
        path: "/catapi/rest/",
        headers: [
          {
            key: "content-type",
            value: "application/json",
          },
        ],
        encodeParamsToggle: true,
        queryParameters: [
          {
            key: "{{Button1.text}}",
            value: "",
          },
          {
            key: "",
            value: "",
          },
        ],
        body: "{{Create_users.data}}",
        httpMethod: "POST",
        pluginSpecifiedTemplates: [
          {
            value: true,
          },
        ],
      },
      executeOnLoad: false,
      dynamicBindingPathList: [
        {
          key: "body",
        },
        {
          key: "queryParameters[0].key",
        },
      ],
      isValid: true,
      invalids: [],
      // messages: [],
      jsonPathKeys: ["Create_users.data", "Button1.text"],
      confirmBeforeExecute: false,
      // userPermissions: ["read:actions", "execute:actions", "manage:actions"],
      // validName: "Api1",
    };

    const value = [
      {
        key: "{{Button1.text}}",
        value: "",
      },
      {
        key: "",
        value: "",
      },
    ];
    const field = "actionConfiguration.queryParameters";

    const expectedResult = [
      {
        key: "body",
      },
      {
        key: "queryParameters[0].key",
      },
    ];

    const actualResult = getDynamicBindingsChangesSaga(action, value, field);

    expect(_.isEqual(expectedResult, actualResult)).toBeTruthy();
  });
});
