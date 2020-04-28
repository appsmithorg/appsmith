const DataSourceConfigResponse = [
  {
    sectionName: "General",
    id: 1,
    children: [
      {
        label: "Connection Name",
        configProperty: "connectionName",
        controlType: "INPUT_TEXT",
      },
      {
        label: "Connection Mode",
        configProperty: "connectionMode",
        controlType: "DROP_DOWN",
        options: [
          {
            label: "Read Only",
            value: "READ_MODE",
          },
          {
            label: "Read / Write",
            value: "WRITE_MODE",
          },
        ],
      },
      {
        label: "Connection String",
        controlType: "CONNECTION_PARSER",
      },
    ],
  },
  {
    sectionName: "Connection",
    id: 2,
    children: [
      {
        sectionName: null,
        children: [
          {
            label: "Host Address",
            configProperty: "connectionHost",
            controlType: "INPUT_TEXT",
          },
          {
            label: "Port",
            configProperty: "connectionPort",
            dataType: "NUMBER",
            controlType: "INPUT_TEXT",
          },
        ],
      },
      {
        label: "Database Name",
        configProperty: "databaseName",
        controlType: "INPUT_TEXT",
      },
      {
        sectionName: null,
        children: [
          {
            label: "Username",
            configProperty: "username",
            controlType: "INPUT_TEXT",
          },
          {
            label: "Password",
            configProperty: "password",
            dataType: "PASSWORD",
            controlType: "INPUT_TEXT",
          },
        ],
      },
    ],
  },
  {
    id: 3,
    sectionName: "SSL (optional)",
    children: [
      {
        label: "SSL Mode",
        configProperty: "sslMode",
        controlType: "DROP_DOWN",
        options: [
          {
            label: "Allow",
            value: "ALLOW",
          },
          {
            label: "Prefer",
            value: "PREFER",
          },
          {
            label: "Require",
            value: "Require",
          },
          {
            label: "Disable",
            value: "DISABLE",
          },
          {
            label: "Verify-CA",
            value: "VERIFY_CA",
          },
          {
            label: "Verify-Full",
            value: "VERIFY_FULL",
          },
        ],
      },
      {
        sectionName: null,
        children: [
          {
            label: "Client Certificate",
            configProperty: "clientCertificate",
            controlType: "FILE_PICKER",
          },
          {
            label: "Client Certificate Key",
            configProperty: "clientCertificateKey",
            controlType: "FILE_PICKER",
          },
        ],
      },
      {
        sectionName: null,
        children: [
          {
            label: "Root Certificate",
            configProperty: "rootCertificate",
            controlType: "FILE_PICKER",
          },
          {
            label: "Certificate Revocation List",
            configProperty: "certificateRevocationList",
            controlType: "FILE_PICKER",
          },
        ],
      },
      {
        label: "Enable SSL Compression",
        configProperty: "sslCompression",
        controlType: "SWITCH",
      },
    ],
  },
  {
    sectionName: "SSH (optional)",
    id: 4,
    children: [
      {
        label: "Enable SSH",
        configProperty: "enableSSH",
        controlType: "SWITCH",
      },
      {
        sectionName: null,
        children: [
          {
            label: "Tunnel Host",
            configProperty: "tunnelHost",
            controlType: "INPUT_TEXT",
          },
          {
            label: "Tunnel Port",
            configProperty: "tunnelPort",
            controlType: "INPUT_TEXT",
          },
        ],
      },
      {
        label: "Username",
        configProperty: "tunnelUsername",
        controlType: "INPUT_TEXT",
      },
      {
        label: "Authentication Type",
        configProperty: "authenticationType",
        controlType: "DROP_DOWN",
        options: [
          {
            label: "Password",
            value: "PASSWORD",
          },
          {
            label: "Identity File",
            value: "identityFile",
          },
        ],
      },
      {
        label: "Password",
        configProperty: "tunnelPassword",
        dataType: "PASSWORD",
        controlType: "INPUT_TEXT",
      },
    ],
  },
];

export default DataSourceConfigResponse;
