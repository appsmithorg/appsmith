package com.external.plugins;

import com.appsmith.external.helpers.PluginUtils;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.BasicAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import org.junit.Assert;
import org.junit.BeforeClass;
import org.junit.ClassRule;
import org.junit.Test;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.utility.DockerImageName;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import javax.mail.Session;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.Assert.assertTrue;

public class SmtpPluginTest {
    final static String username = "smtpUser";
    final static String password = "smtpPass";
    private static String host = "localhost";
    private static Long port = 25l;

    @ClassRule
    public static final GenericContainer smtp = new GenericContainer(DockerImageName.parse("maildev/maildev"))
            .withExposedPorts(25)
            .withEnv("MAILDEV_INCOMING_USER", username)
            .withEnv("MAILDEV_INCOMING_PASS", password);

    private SmtpPlugin.SmtpPluginExecutor pluginExecutor = new SmtpPlugin.SmtpPluginExecutor();


    @BeforeClass
    public static void setup() {
        host = smtp.getContainerIpAddress();
        port = Long.valueOf(smtp.getFirstMappedPort());
    }

    private DatasourceConfiguration createDatasourceConfiguraion() {

        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        BasicAuth auth = new BasicAuth(username, password);
        dsConfig.setAuthentication(auth);
        dsConfig.setEndpoints(List.of(new Endpoint(host, port)));
        return dsConfig;
    }

    private ActionConfiguration createActionConfiguration(String fromAddress,
                                                          String toAddress,
                                                          String ccAddress,
                                                          String bccAddress,
                                                          String replyTo) {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        Map<String, Object> formData = new HashMap<>();
        PluginUtils.setValueSafelyInFormData(formData, "from", fromAddress);
        PluginUtils.setValueSafelyInFormData(formData, "to", toAddress);
        PluginUtils.setValueSafelyInFormData(formData, "cc", ccAddress);
        PluginUtils.setValueSafelyInFormData(formData, "bcc", bccAddress);
        PluginUtils.setValueSafelyInFormData(formData, "isReplyTo", true);
        PluginUtils.setValueSafelyInFormData(formData, "replyTo", replyTo);

        actionConfiguration.setFormData(formData);
        return actionConfiguration;
    }

    @Test
    public void testInvalidHostname() {
        DatasourceConfiguration invalidDatasourceConfiguration = createDatasourceConfiguraion();
        invalidDatasourceConfiguration.setEndpoints(List.of(new Endpoint("", 25l)));
        Assert.assertEquals(Set.of("Could not find host address. Please edit the 'Hostname' field to provide the " +
                        "desired endpoint."),
                pluginExecutor.validateDatasource(invalidDatasourceConfiguration));
    }

    @Test
    public void testInvalidPort() {
        DatasourceConfiguration invalidDatasourceConfiguration = createDatasourceConfiguraion();
        invalidDatasourceConfiguration.setEndpoints(List.of(new Endpoint(host, null)));
        Assert.assertEquals(Set.of("Could not find port. Please edit the 'Port' field to provide the " +
                        "desired endpoint."),
                pluginExecutor.validateDatasource(invalidDatasourceConfiguration));
    }

    @Test
    public void testSendEmailValid() {

        DatasourceConfiguration dsConfig = createDatasourceConfiguraion();
        Mono<Session> sessionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = createActionConfiguration(
                "fromAddress@gmail.com",
                "toAddress@gmail.com",
                "ccAddress@gmail.com",
                "bccAddress@gmail.com",
                "replyTo@gmail.com");
        PluginUtils.setValueSafelyInFormData(actionConfiguration.getFormData(), "subject", "This is a test subject");
        actionConfiguration.setBody("This is a body");

        Mono<ActionExecutionResult> resultMono = sessionMono.flatMap(session -> pluginExecutor.execute(session, dsConfig, actionConfiguration));

        StepVerifier.create(resultMono)
                .assertNext(result -> assertTrue(result.getIsExecutionSuccess()))
                .verifyComplete();
    }
}