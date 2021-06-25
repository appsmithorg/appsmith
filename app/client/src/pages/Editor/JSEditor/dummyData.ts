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
        name: "function1.data",
        initialValue: "undefined",
      },
    ],
    body: `{ data: [], run1: function() { console.log(\"this is function 1 body\")}}`,
    actionConfiguration: {
      body: `{ data: [], run1: function() { console.log(\"this is function 1 body\") }}`,
    },
    actions: [
      {
        actionId: "11",
        name: "function1.all",
        parentObjectId: "unknown_collection_parent_id",
        executeOnLoad: false,
        actionConfiguration: {
          body: "function all(){...}",
          isAsync: true,
          arguments: [],
          timeoutInMilliseconds: 3000,
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
        name: "function2.data",
        initialValue: "undefined",
      },
    ],
    body: `{data: [], run2: function() { console.log(\"this is function 2 body\")}}`,
    actionConfiguration: {
      body: `{data: [], run2: function() { console.log(\"this is function 2 body\")}}`,
    },
    actions: [
      {
        actionId: "21",
        name: "function2.all",
        parentObjectId: "unknown_collection_parent_id",
        executeOnLoad: false,
        actionConfiguration: {
          body: "function all(){...}",
          isAsync: true,
          arguments: [],
          timeoutInMilliseconds: 3000,
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
  body: `{data: [], run100: function() { console.log(\"this is function 100 body\")}}`,
  actionConfiguration: {
    body: `{data: [], run100: function() { console.log(\"this is function 100 body\")}}`,
  },
  actions: [
    {
      actionId: "21",
      name: "function2.all",
      parentObjectId: "unknown_collection_parent_id",
      executeOnLoad: false,
      actionConfiguration: {
        body: "function all(){...}",
        isAsync: true,
        arguments: [],
        timeoutInMilliseconds: 3000,
      },
    },
  ],
};
