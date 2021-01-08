package com.external.plugins;

@Slf4j
public class S3PluginTest {
    private static String address;
    private static Integer port;
    private static String username;
    private static String password;
    private  static String dbName;

    @BeforeClass
    public static void setUp() {
        address = "address";
        port = 5439;
        username = "username";
        password = "password";
        dbName = "dbName";
    }

    private DatasourceConfiguration createDatasourceConfiguration() {
        DBAuth authDTO = new DBAuth();
        authDTO.setAuthType(DBAuth.Type.USERNAME_PASSWORD);
        authDTO.setUsername(username);
        authDTO.setPassword(password);
        authDTO.setDatabaseName(dbName);

        Endpoint endpoint = new Endpoint();
        endpoint.setHost(address);
        endpoint.setPort(port.longValue());

        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setAuthentication(authDTO);
        dsConfig.setEndpoints(List.of(endpoint));
        return dsConfig;
    }

    @Test
    public void sampleTest() {

    }

}