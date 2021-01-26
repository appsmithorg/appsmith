package com.external.plugins;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.ListObjectsV2Result;
import com.amazonaws.services.s3.model.S3ObjectSummary;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.Property;
import lombok.extern.slf4j.Slf4j;
import org.junit.BeforeClass;
import org.junit.Test;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;

@Slf4j
public class S3PluginTest {
    private static String address;
    private static Integer port;
    private static String username;
    private static String password;
    private  static String dbName;

    S3Plugin.S3PluginExecutor pluginExecutor = new S3Plugin.S3PluginExecutor();

    @BeforeClass
    public static void setUp() {
        username = "AKIAVWHAAGIQE7N62Y36";
        password = "zJHTV4wsQVWW3iT5rDGLhnicy3y9rqkizdsk9MuE";
    }

    private DatasourceConfiguration createDatasourceConfiguration() {
        DBAuth authDTO = new DBAuth();
        authDTO.setAuthType(DBAuth.Type.USERNAME_PASSWORD);
        authDTO.setUsername(username);
        authDTO.setPassword(password);

        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setAuthentication(authDTO);
        return dsConfig;
    }

    @Test
    public void sampleTest() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<AmazonS3> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        AmazonS3 conn = dsConnectionMono.block();
        String bucket_name = "testbucketforappsmithinternaltesting";

        ListObjectsV2Result result = conn.listObjectsV2(bucket_name);
        List<S3ObjectSummary> objects = result.getObjectSummaries();
        System.out.println("devtest: printing bucket objects");
        for (S3ObjectSummary os : objects) {
            System.out.println("* " + os.getKey());
        }
    }

    @Test
    public void testExecuteUploadFileFromBody() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<AmazonS3> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        AmazonS3 conn = dsConnectionMono.block();
        String bucket_name = "testbucketforappsmithinternaltesting";

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setPath("test_upload_from_file.txt");
        List<Property> pluginSpecifiedTemplates = new ArrayList<>();
        pluginSpecifiedTemplates.add(new Property("action", "UPLOAD_FILE_FROM_BODY"));
        actionConfiguration.setPluginSpecifiedTemplates(pluginSpecifiedTemplates);
        actionConfiguration.setBody("{key: test, value: test}");

        pluginExecutor.execute(conn, dsConfig, actionConfiguration).block();
    }

}