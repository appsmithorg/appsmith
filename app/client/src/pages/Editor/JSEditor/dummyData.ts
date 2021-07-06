import { PluginType } from "../../../entities/JSAction";

export const jsData = [
  {
    id: "1",
    pageId: "606ac1fd76cd1270c173f7d7",
    name: "function1",
    organizationId: "606ac1fd76cd1270c173f7d5",
    pluginId: "60b8c29c59d0193c5bb96328",
    pluginType: PluginType.JS,
    variables: [
      {
        name: "result",
        initialValue: "undefined",
      },
    ],
    body: `{
      results: [],
      run1: function() { console.log('this is function 1 body')}
    }`,
    actions: [
      {
        actionId: "11",
        name: "run1",
        collectionId: "unknown_collection_parent_id",
        executeOnLoad: false,
        actionConfiguration: {
          body: "function() { console.log('this is function 1 body')}",
          isAsync: true,
          timeoutInMilliseconds: 3000,
          jsArguments: [
            {
              name: "arg1",
              initialValue: "undefined",
            },
          ],
        },
      },
    ],
  },
  {
    id: "2",
    pageId: "606ac1fd76cd1270c173f7d7",
    name: "function2",
    organizationId: "606ac1fd76cd1270c173f7d5",
    pluginId: "60b8c29c59d0193c5bb96328",
    pluginType: PluginType.JS,
    variables: [
      {
        name: "result",
        initialValue: "undefined",
      },
    ],
    body: `{
      results: [],
      run2: function() { console.log("this is function 2 body")}
    }`,
    actions: [
      {
        actionId: "21",
        name: "all",
        collectionId: "unknown_collection_parent_id",
        executeOnLoad: false,
        actionConfiguration: {
          body: "function all(){...}",
          isAsync: true,
          timeoutInMilliseconds: 3000,
          jsArguments: [
            {
              name: "arg1",
              initialValue: "undefined",
            },
          ],
        },
      },
    ],
  },
];

export const newFunction = {
  id: "100",
  name: "Function1",
  pageId: "606ac1fd76cd1270c173f7d7",
  organizationId: "606ac1fd76cd1270c173f7d5",
  pluginId: "60b8c29c59d0193c5bb96328",
  pluginType: PluginType.JS,
  variables: [
    {
      name: "function2.data",
      initialValue: "undefined",
    },
  ],
  body: `{results: [], run100: function() { console.log(\"this is function 100 body\")}}`,
  actions: [
    {
      actionId: "21",
      name: "function2.all",
      collectionId: "unknown_collection_parent_id",
      executeOnLoad: false,
      actionConfiguration: {
        body: "function all(){...}",
        isAsync: true,
        timeoutInMilliseconds: 3000,
        jsArguments: [
          {
            name: "arg1",
            initialValue: "undefined",
          },
        ],
      },
    },
  ],
};
