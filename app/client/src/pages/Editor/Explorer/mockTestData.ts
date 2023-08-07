export const mockDatasources = [
  {
    id: "61e0f447cd5225210fa81dd8",
    name: "09bd6b2f",
    pluginId: "5c9f512f96c1a50004819786",
    workspaceId: "607d2c9c1a5f642a171ebd9b",
    datasourceConfiguration: {
      connection: {
        mode: "READ_WRITE",
        ssl: {
          authType: "DEFAULT",
        },
      },
      endpoints: [
        {
          host: "localhost",
          port: 5432,
        },
      ],
      authentication: {
        authenticationType: "dbAuth",
        username: "postgres",
        databaseName: "fakeapi",
      },
      sshProxyEnabled: false,
    },
    invalids: [],
    messages: [
      "You may not be able to access your localhost if Appsmith is running inside a docker container or on the cloud. To enable access to your localhost you may use ngrok to expose your local endpoint to the internet. Please check out Appsmith's documentation to understand more.",
    ],
    isConfigured: false,
    isValid: true,
    new: false,
  },
  {
    id: "61e0e47bcd5225210fa81d59",
    name: "2dcc265f",
    pluginId: "5c9f512f96c1a50004819786",
    workspaceId: "607d2c9c1a5f642a171ebd9b",
    datasourceConfiguration: {
      connection: {
        mode: "READ_WRITE",
        ssl: {
          authType: "DEFAULT",
        },
      },
      endpoints: [
        {
          host: "localhost",
          port: 5432,
        },
      ],
      authentication: {
        authenticationType: "dbAuth",
        username: "postgres",
        databaseName: "fakeapi",
      },
      sshProxyEnabled: false,
    },
  },
  {
    id: "61e0f171cd5225210fa81dad",
    name: "f688c404",
    pluginId: "5c9f512f96c1a50004819786",
    workspaceId: "607d2c9c1a5f642a171ebd9b",
    datasourceConfiguration: {
      connection: {
        mode: "READ_WRITE",
        ssl: {
          authType: "DEFAULT",
        },
      },
      endpoints: [
        {
          host: "localhost",
          port: 5432,
        },
      ],
      authentication: {
        authenticationType: "dbAuth",
        username: "postgres",
        databaseName: "fakeapi",
      },
      sshProxyEnabled: false,
    },
  },
  {
    id: "61e0e47bcd5225210fa81d59",
    name: "2dcc265f",
    pluginId: "5c9f512f96c1a50004819786",
    workspaceId: "607d2c9c1a5f642a171ebd9b",
    datasourceConfiguration: {
      connection: {
        mode: "READ_WRITE",
        ssl: {
          authType: "DEFAULT",
        },
      },
      endpoints: [
        {
          host: "localhost",
          port: 5432,
        },
      ],
      authentication: {
        authenticationType: "dbAuth",
        username: "postgres",
        databaseName: "fakeapi",
      },
      sshProxyEnabled: false,
    },
  },
  {
    id: "61e0f171cd5225210fa81dad",
    name: "f688c404",
    pluginId: "5c9f512f96c1a50004819786",
    workspaceId: "607d2c9c1a5f642a171ebd9b",
    datasourceConfiguration: {
      connection: {
        mode: "READ_WRITE",
        ssl: {
          authType: "DEFAULT",
        },
      },
      endpoints: [
        {
          host: "localhost",
          port: 5432,
        },
      ],
      authentication: {
        authenticationType: "dbAuth",
        username: "postgres",
        databaseName: "fakeapi",
      },
      sshProxyEnabled: false,
    },
  },
  {
    id: "61e0e47bcd5225210fa81d59",
    name: "qwerty12",
    pluginId: "5c9f512f96c1a50004819786",
    workspaceId: "607d2c9c1a5f642a171ebd9b",
    datasourceConfiguration: {
      connection: {
        mode: "READ_WRITE",
        ssl: {
          authType: "DEFAULT",
        },
      },
      endpoints: [
        {
          host: "localhost",
          port: 5432,
        },
      ],
      authentication: {
        authenticationType: "dbAuth",
        username: "postgres",
        databaseName: "fakeapi",
      },
      sshProxyEnabled: false,
    },
  },
  {
    id: "61e0f171cd5225210f121dad",
    name: "poiuyt09",
    pluginId: "5c9f512f96c1a50004819786",
    workspaceId: "607d2c9c1a5f642a171ebd9b",
    datasourceConfiguration: {
      connection: {
        mode: "READ_WRITE",
        ssl: {
          authType: "DEFAULT",
        },
      },
      endpoints: [
        {
          host: "localhost",
          port: 5432,
        },
      ],
      authentication: {
        authenticationType: "dbAuth",
        username: "postgres",
        databaseName: "fakeapi",
      },
      sshProxyEnabled: false,
    },
  },
];

export const mockApiDatas = [
  {
    id: "634929568f35a90ce8a428dc",
    workspaceId: "607d2c9c1a5f642a171ebd9b",
    pluginType: "API",
    pluginId: "5c9f512f96c1a50004819786",
    name: "Api1",
    datasource: {
      userPermissions: [],
      name: "poiuyt09",
      pluginId: "5c9f512f96c1a50004819786",
      workspaceId: "607d2c9c1a5f642a171ebd9b",
      datasourceConfiguration: {
        connection: {
          mode: "READ_WRITE",
          ssl: {
            authType: "DEFAULT",
          },
        },
        endpoints: [
          {
            host: "localhost",
            port: 5432,
          },
        ],
        authentication: {
          authenticationType: "dbAuth",
          username: "postgres",
          databaseName: "fakeapi",
        },
        sshProxyEnabled: false,
      },
    },
    actionConfiguration: {
      timeoutInMillisecond: 10000,
      paginationType: "NONE",
      headers: [],
      encodeParamsToggle: true,
      queryParameters: [],
      bodyFormData: [],
      httpMethod: "GET",
      selfReferencingDataPaths: [],
      pluginSpecifiedTemplates: [
        {
          value: true,
        },
      ],
      formData: {
        apiContentType: "none",
      },
    },
    executeOnLoad: false,
    dynamicBindingPathList: [],
    isValid: true,
    invalids: [],
    messages: [],
    jsonPathKeys: [],
    confirmBeforeExecute: false,
    userPermissions: [
      "read:actions",
      "delete:actions",
      "execute:actions",
      "manage:actions",
    ],
    validName: "Api1",
  },
];

export const mockJsActions = [
  {
    id: "634926dc8f35a90ce8a428d2",
    workspaceId: "607d2c9c1a5f642a171ebd9b",
    name: "JSObject1",
    pluginId: "634925cd8f35a90ce8a42841",
    pluginType: "JS",
    actionIds: [],
    archivedActionIds: [],
    actions: [
      {
        id: "634926dc8f35a90ce8a428d0",
        workspaceId: "607d2c9c1a5f642a171ebd9b",
        pluginType: "JS",
        pluginId: "634925cd8f35a90ce8a42841",
        name: "myFun1",
        fullyQualifiedName: "JSObject1.myFun1",
        datasource: {
          userPermissions: [],
          name: "UNUSED_DATASOURCE",
          pluginId: "634925cd8f35a90ce8a42841",
          workspaceId: "607d2c9c1a5f642a171ebd9b",
          messages: [],
          isValid: true,
          new: true,
        },
        collectionId: "634926dc8f35a90ce8a428d2",
        actionConfiguration: {
          timeoutInMillisecond: 10000,
          paginationType: "NONE",
          encodeParamsToggle: true,
          body: "() => {}",
          selfReferencingDataPaths: [],
          jsArguments: [],
        },
        executeOnLoad: false,
        clientSideExecution: true,
        dynamicBindingPathList: [
          {
            key: "body",
          },
        ],
        isValid: true,
        invalids: [],
        messages: [],
        jsonPathKeys: ["() => {}"],
        confirmBeforeExecute: false,
        userPermissions: [
          "read:actions",
          "delete:actions",
          "execute:actions",
          "manage:actions",
        ],
        validName: "JSObject1.myFun1",
      },
      {
        id: "634926dc8f35a90ce8a428cf",
        workspaceId: "607d2c9c1a5f642a171ebd9b",
        pluginType: "JS",
        pluginId: "634925cd8f35a90ce8a42841",
        name: "myFun2",
        fullyQualifiedName: "JSObject1.myFun2",
        datasource: {
          userPermissions: [],
          name: "UNUSED_DATASOURCE",
          pluginId: "634925cd8f35a90ce8a42841",
          workspaceId: "607d2c9c1a5f642a171ebd9b",
          messages: [],
          isValid: true,
          new: true,
        },
        collectionId: "634926dc8f35a90ce8a428d2",
        actionConfiguration: {
          timeoutInMillisecond: 10000,
          paginationType: "NONE",
          encodeParamsToggle: true,
          body: "async () => {}",
          selfReferencingDataPaths: [],
          jsArguments: [],
        },
        executeOnLoad: false,
        clientSideExecution: true,
        dynamicBindingPathList: [
          {
            key: "body",
          },
        ],
        isValid: true,
        invalids: [],
        messages: [],
        jsonPathKeys: ["async () => {}"],
        confirmBeforeExecute: false,
        userPermissions: [
          "read:actions",
          "delete:actions",
          "execute:actions",
          "manage:actions",
        ],
        validName: "JSObject1.myFun2",
      },
    ],
    archivedActions: [],
    body: "export default {sad\n\tmyVar1: [],\n\tmyVar2: {},\n\tmyFun1: () => {\n\t\t//write code here\n\t},\n\tmyFun2: async () => {\n\t\t//use async-await or promises\n\t}\n}",
    variables: [
      {
        name: "myVar1",
        value: "[]",
      },
      {
        name: "myVar2",
        value: "{}",
      },
    ],
    userPermissions: [
      "read:actions",
      "delete:actions",
      "execute:actions",
      "manage:actions",
    ],
  },
];

export const mockEntitiesFilesSelector = () => [
  {
    type: "group",
    entity: {
      name: "APIs",
    },
  },
  {
    type: "API",
    entity: {
      id: "634929568f35a90ce8a428dc",
      name: "Api1",
    },
    group: "APIs",
  },
  {
    type: "group",
    entity: {
      name: "JS Objects",
    },
  },
  {
    type: "JS",
    entity: {
      id: "634926dc8f35a90ce8a428d2",
      name: "JSObject1",
    },
    group: "JS Objects",
  },
];
