const MongoConfigResponse = [
  {
    sectionName: "General",
    children: [
      {
        label: "Connection Mode",
        configProperty: "datasourceConfiguration.connection.mode",
        controlType: "DROP_DOWN",
        initialValue: "READ_WRITE",
        options: [
          {
            label: "Read Only",
            value: "READ_ONLY",
          },
          {
            label: "Read / Write",
            value: "READ_WRITE",
          },
        ],
      },
    ],
  },
  {
    sectionName: "Connection",
    children: [
      {
        label: "Connection Type",
        configProperty: "datasourceConfiguration.connection.type",
        initialValue: "DIRECT",
        controlType: "DROP_DOWN",
        options: [
          {
            label: "Direct Connection",
            value: "DIRECT",
          },
          {
            label: "Replica set",
            value: "REPLICA_SET",
          },
        ],
      },
      {
        sectionName: null,
        children: [
          {
            label: "Host Address",
            configProperty: "datasourceConfiguration.endpoints[*].host",
            controlType: "KEYVALUE_ARRAY",
            validationMessage: "Please enter a valid host",
            validationRegex: "^((?![/:]).)*$",
          },
          {
            label: "Port",
            configProperty: "datasourceConfiguration.endpoints[*].port",
            dataType: "NUMBER",
            controlType: "KEYVALUE_ARRAY",
          },
        ],
      },
      {
        label: "Database Name",
        configProperty: "datasourceConfiguration.authentication.databaseName",
        controlType: "INPUT_TEXT",
        placeholderText: "Database name",
        initialValue: "admin",
      },
      {
        label: "Authentication Type",
        configProperty: "datasourceConfiguration.authentication.authType",
        controlType: "DROP_DOWN",
        initialValue: "SCRAM_SHA_1",
        options: [
          {
            label: "SCRAM-SHA-1",
            value: "SCRAM_SHA_1",
          },
          {
            label: "SCRAM-SHA-256",
            value: "SCRAM_SHA_256",
          },
          {
            label: "MONGODB-CR",
            value: "MONGODB_CR",
          },
        ],
      },
      {
        sectionName: null,
        children: [
          {
            label: "Username",
            configProperty: "datasourceConfiguration.authentication.username",
            controlType: "INPUT_TEXT",
            placeholderText: "Username",
          },
          {
            label: "Password",
            configProperty: "datasourceConfiguration.authentication.password",
            dataType: "PASSWORD",
            controlType: "INPUT_TEXT",
            placeholderText: "Password",
          },
        ],
      },
    ],
  },
  {
    sectionName: "SSL (optional)",
    children: [
      {
        label: "Authentication Mechanism",
        configProperty: "datasourceConfiguration.connection.ssl.authType",
        controlType: "DROP_DOWN",
        initialValue: "SELF_SIGNED_CERTIFICATE",
        options: [
          {
            label: "CA Certificate",
            value: "CA_CERTIFICATE",
          },
          {
            label: "Self Signed Certificate",
            value: "SELF_SIGNED_CERTIFICATE",
          },
          {
            label: "No SSL",
            value: "NO_SSL",
          },
        ],
      },
      {
        label: "CA Certificate",
        configProperty: "datasourceConfiguration.connection.ssl.caCertificate",
        controlType: "FILE_PICKER",
      },
      {
        label: "PEM Certificate",
        configProperty: "datasourceConfiguration.connection.ssl.pemCertificate",
        controlType: "FILE_PICKER",
      },
    ],
  },
  {
    sectionName: "SSH Tunnel (optional)",
    children: [
      {
        label: "Enable SSH Tunneling",
        configProperty: "sshTunneling",
        controlType: "SWITCH",
      },
      {
        sectionName: null,
        children: [
          {
            label: "SSH Address",
            configProperty: "datasourceConfiguration.sshProxy.host",
            controlType: "INPUT_TEXT",
            placeholderText: "0.0.0.0",
          },
          {
            label: "Port",
            configProperty: "datasourceConfiguration.sshProxy.port",
            controlType: "INPUT_TEXT",
            placeholderText: "8080",
          },
        ],
      },
      {
        label: "Username",
        configProperty: "datasourceConfiguration.sshProxy.username",
        controlType: "INPUT_TEXT",
        placeholderText: "SSH Proxy Username",
      },
      {
        label: "Authentication Type",
        configProperty: "datasourceConfiguration.authenticationType",
        controlType: "DROP_DOWN",
        options: [
          {
            label: "Password",
            value: "PASSWORD",
          },
          {
            label: "Identity File",
            value: "IDENTITY_FILE",
          },
        ],
      },
      {
        label: "Password",
        configProperty: "datasourceConfiguration.ssh.tunnelPassword",
        dataType: "PASSWORD",
        controlType: "INPUT_TEXT",
        placeholderText: "SSH Tunnel password",
      },
      {
        label: "Passphrase",
        configProperty: "datasourceConfiguration.ssh.tunnelPassphrase",
        dataType: "PASSWORD",
        controlType: "INPUT_TEXT",
        placeholderText: "SSH Tunnel passphrase",
      },
    ],
  },
];

export default MongoConfigResponse;
