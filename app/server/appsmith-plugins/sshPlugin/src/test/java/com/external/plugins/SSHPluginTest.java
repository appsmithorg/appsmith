package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.SSHAuth;
import com.appsmith.external.models.SSHPrivateKey;
import com.appsmith.external.models.UploadedFile;
import com.jcraft.jsch.Session;
import org.bson.internal.Base64;
import org.junit.Assert;
import org.junit.BeforeClass;
import org.junit.ClassRule;
import org.junit.Test;
import org.testcontainers.containers.BindMode;
import org.testcontainers.containers.GenericContainer;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.io.InputStream;
import java.util.Collections;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

public class SSHPluginTest {
    private static String host;
    private static Integer port;
    private static final String USERNAME = "root";
    private static final String PASSWORD = "root";

    @ClassRule
    public static final GenericContainer sshServer = new GenericContainer(CompletableFuture.completedFuture("sickp/alpine-sshd:7.9-r1"))
            .withEnv(Map.of("CNTUSER", "root", "CNTPASS", "root"))
            .withClasspathResourceMapping("ssh-test-key.pub", "/root/.ssh/authorized_keys", BindMode.READ_ONLY)
            .withExposedPorts(22);

    private SSHPlugin.SSHPluginExecutor pluginExecutor = new SSHPlugin.SSHPluginExecutor();

    @BeforeClass
    public static void setup() {
        host = sshServer.getContainerIpAddress();
        port = sshServer.getFirstMappedPort();
    }

    private DatasourceConfiguration createDSConfigurationForPasswordLogin() {
        Endpoint endpoint = new Endpoint();
        endpoint.setHost(host);
        endpoint.setPort(Long.valueOf(port));

        SSHAuth sshAuth = new SSHAuth();
        sshAuth.setUsername(USERNAME);
        sshAuth.setPassword(PASSWORD);
        sshAuth.setAuthType(SSHAuth.AuthType.PASSWORD);
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setEndpoints(Collections.singletonList(endpoint));
        datasourceConfiguration.setAuthentication(sshAuth);

        return datasourceConfiguration;
    }

    private DatasourceConfiguration createDSConfigurationForKeyLogin() throws IOException {
        Endpoint endpoint = new Endpoint();
        endpoint.setHost(host);
        endpoint.setPort(Long.valueOf(port));

        SSHAuth sshAuth = new SSHAuth();
        sshAuth.setUsername(USERNAME);
        sshAuth.setAuthType(SSHAuth.AuthType.IDENTITY_FILE);
        // Read the private key from src/test/resources. The private key has been generated with passphrase: `password`
        InputStream is = getClass().getClassLoader().getResourceAsStream("ssh-test-key");
        String privateKey = new String(is.readAllBytes());
        // We append data:<mime type>;base64, because the client uses Uppy for file uploads and this is how we get
        // the data from the client
        String encodedPrivateKey = "data:application/octet-stream;base64," + Base64.encode(privateKey.getBytes());
        sshAuth.setPrivateKey(new SSHPrivateKey(new UploadedFile("privateKey", encodedPrivateKey), "password"));
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setAuthentication(sshAuth);
        datasourceConfiguration.setEndpoints(Collections.singletonList(endpoint));

        return datasourceConfiguration;
    }

    @Test
    public void itShouldCreateDatasource() {
        DatasourceConfiguration datasourceConfiguration = createDSConfigurationForPasswordLogin();
        Mono<Session> dsMono = pluginExecutor.datasourceCreate(datasourceConfiguration).cache();

        StepVerifier.create(dsMono)
                .assertNext(session -> {
                    assertNotNull(session);
                    assertTrue(session.isConnected());
                })
                .verifyComplete();

        pluginExecutor.datasourceDestroy(dsMono.block());
    }

    @Test
    public void executeTestForPasswordLogin() {
        DatasourceConfiguration datasourceConfiguration = createDSConfigurationForPasswordLogin();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setTimeoutInMillisecond("50000");
        actionConfiguration.setBody("echo 'hello world'");
        Mono<Session> dsMono = pluginExecutor.datasourceCreate(datasourceConfiguration).cache();
        Mono<ActionExecutionResult> resultMono =
                dsMono.flatMap(session -> pluginExecutor.execute(session, datasourceConfiguration, actionConfiguration));
        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    System.out.println(result.toString());
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                })
                .verifyComplete();

        pluginExecutor.datasourceDestroy(dsMono.block());
    }

    @Test
    public void executeInvalidCommandForPasswordLogin() {
        DatasourceConfiguration datasourceConfiguration = createDSConfigurationForPasswordLogin();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setTimeoutInMillisecond("50000");
        actionConfiguration.setBody("kjsdhf");
        Mono<Session> dsMono = pluginExecutor.datasourceCreate(datasourceConfiguration).cache();
        Mono<ActionExecutionResult> resultMono =
                dsMono.flatMap(session -> pluginExecutor.execute(session, datasourceConfiguration, actionConfiguration));
        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    System.out.println(result.toString());
                    assertNotNull(result);
                    assertFalse(result.getIsExecutionSuccess());
                    assertTrue(String.valueOf(result.getBody()).contains("not found"));
                })
                .verifyComplete();

        pluginExecutor.datasourceDestroy(dsMono.block());
    }

    @Test
    public void executeTestForKeyLogin() throws IOException {
        DatasourceConfiguration datasourceConfiguration = createDSConfigurationForKeyLogin();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setTimeoutInMillisecond("50000");
        actionConfiguration.setBody("ls -al");
        Mono<Session> dsMono = pluginExecutor.datasourceCreate(datasourceConfiguration).cache();
        Mono<ActionExecutionResult> resultMono =
                dsMono.flatMap(session -> pluginExecutor.execute(session, datasourceConfiguration, actionConfiguration));
        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    System.out.println(result.toString());
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                })
                .verifyComplete();

        pluginExecutor.datasourceDestroy(dsMono.block());
    }

    @Test
    public void testNullAuthentication() {
        DatasourceConfiguration datasourceConfiguration = createDSConfigurationForPasswordLogin();
        datasourceConfiguration.setAuthentication(null);
        Assert.assertEquals(Set.of("Mandatory SSH authentication missing. Please check your configuration"),
                pluginExecutor.validateDatasource(datasourceConfiguration));
    }

    @Test
    public void testEmptyUsername() {
        DatasourceConfiguration datasourceConfiguration = createDSConfigurationForPasswordLogin();
        ((SSHAuth) datasourceConfiguration.getAuthentication()).setUsername("");
        Assert.assertEquals(Set.of("Mandatory parameter username is missing or empty"),
                pluginExecutor.validateDatasource(datasourceConfiguration));
    }

    @Test
    public void testEmptyPassword() {
        DatasourceConfiguration datasourceConfiguration = createDSConfigurationForPasswordLogin();
        ((SSHAuth) datasourceConfiguration.getAuthentication()).setPassword("");
        Assert.assertEquals(Set.of("Mandatory parameter password is missing"),
                pluginExecutor.validateDatasource(datasourceConfiguration));
    }

    @Test
    public void testInvalidPrivateKey() throws IOException {
        DatasourceConfiguration datasourceConfiguration = createDSConfigurationForKeyLogin();
        ((SSHAuth) datasourceConfiguration.getAuthentication()).setPrivateKey(null);
        Assert.assertEquals(Set.of("Mandatory parameter private key file is missing"),
                pluginExecutor.validateDatasource(datasourceConfiguration));
    }
}
