export const jsData = [
  {
    id: "1",
    pageId: "60af589ae46b4f17edc130fe",
    name: "function1",
    organizationId: "606596fa6e42981cc3204bfe",
    pluginId: "5678",
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
    pageId: "60af589ae46b4f17edc130fe",
    name: "function2",
    organizationId: "606596fa6e42981cc3204bfe",
    pluginId: "5678",
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
  pageId: "60af589ae46b4f17edc130fe",
  organizationId: "606596fa6e42981cc3204bfe",
  pluginId: "5678",
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
