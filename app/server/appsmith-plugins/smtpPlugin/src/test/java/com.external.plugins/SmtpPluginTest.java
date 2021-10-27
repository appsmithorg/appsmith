package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
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
            .withCommand("bin/maildev --base-pathname /maildev --incoming-user " + username + " --incoming-pass " + password + " -s 25");

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

    private ActionConfiguration createActionConfiguration() {
        return createActionConfiguration(
                "from@test.com",
                "to@test.com",
                "cc@test.com",
                "bcc@test.com",
                "replyTo@test.com");
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
        PluginUtils.setValueSafelyInFormData(formData, "subject", "This is a test subject");
        actionConfiguration.setBody("This is a body");

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
    public void testNullAuthentication() {
        DatasourceConfiguration invalidDatasourceConfiguration = createDatasourceConfiguraion();
        invalidDatasourceConfiguration.setAuthentication(null);

        Assert.assertEquals(Set.of("Invalid authentication credentials. Please check datasource configuration."),
                pluginExecutor.validateDatasource(invalidDatasourceConfiguration));
    }

    @Test
    public void testInvalidAuthentication() {
        DatasourceConfiguration invalidDatasourceConfiguration = createDatasourceConfiguraion();
        invalidDatasourceConfiguration.setAuthentication(new BasicAuth("randomUser", "randomPass"));

        ActionConfiguration actionConfiguration = createActionConfiguration();

        Mono<ActionExecutionResult> resultMono = pluginExecutor.datasourceCreate(invalidDatasourceConfiguration)
                .flatMap(session -> pluginExecutor.execute(session, invalidDatasourceConfiguration, actionConfiguration));

        StepVerifier.create(resultMono)
                .expectErrorMatches(e -> e instanceof AppsmithPluginException &&
                        e.getMessage().contains(AppsmithPluginError.PLUGIN_ERROR.getMessage("Unable to send email because of error: 535 Invalid username or password")))
                .verify();
    }

    @Test
    public void testBlankFromAddress() {
        DatasourceConfiguration datasourceConfiguraion = createDatasourceConfiguraion();

        ActionConfiguration actionConfiguration = createActionConfiguration();
        PluginUtils.setValueSafelyInFormData(actionConfiguration.getFormData(),
                "from", "   ");
        Mono<ActionExecutionResult> resultMono = pluginExecutor.datasourceCreate(datasourceConfiguraion)
                .flatMap(session -> pluginExecutor.execute(session, datasourceConfiguraion, actionConfiguration));

        StepVerifier.create(resultMono)
                .expectErrorMatches(e ->
                    e instanceof AppsmithPluginException &&
                    e.getMessage().equals(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR.getMessage("Couldn't find a valid sender address. Please check your action configuration."))
                )
                .verify();
    }

    @Test
    public void testBlankToAddress() {
        DatasourceConfiguration datasourceConfiguraion = createDatasourceConfiguraion();

        ActionConfiguration actionConfiguration = createActionConfiguration();
        PluginUtils.setValueSafelyInFormData(actionConfiguration.getFormData(),
                "to", "   ");
        Mono<ActionExecutionResult> resultMono = pluginExecutor.datasourceCreate(datasourceConfiguraion)
                .flatMap(session -> pluginExecutor.execute(session, datasourceConfiguraion, actionConfiguration));

        StepVerifier.create(resultMono)
                .expectErrorMatches(e ->
                        e instanceof AppsmithPluginException &&
                                e.getMessage().equals(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR.getMessage("Couldn't find a valid recipient address. Please check your action configuration."))
                )
                .verify();
    }

    @Test
    public void testInvalidFromAddress() {
        DatasourceConfiguration datasourceConfiguraion = createDatasourceConfiguraion();

        ActionConfiguration actionConfiguration = createActionConfiguration();
        PluginUtils.setValueSafelyInFormData(actionConfiguration.getFormData(),
                "from", "invalid");
        Mono<ActionExecutionResult> resultMono = pluginExecutor.datasourceCreate(datasourceConfiguraion)
                .flatMap(session -> pluginExecutor.execute(session, datasourceConfiguraion, actionConfiguration));

        StepVerifier.create(resultMono)
                .expectErrorMatches(e -> e instanceof AppsmithPluginException)
                .verify();
    }

    @Test
    public void testInvalidToAddress() {
        DatasourceConfiguration datasourceConfiguraion = createDatasourceConfiguraion();

        ActionConfiguration actionConfiguration = createActionConfiguration();
        PluginUtils.setValueSafelyInFormData(actionConfiguration.getFormData(),
                "to", "invalidEmail");
        Mono<ActionExecutionResult> resultMono = pluginExecutor.datasourceCreate(datasourceConfiguraion)
                .flatMap(session -> pluginExecutor.execute(session, datasourceConfiguraion, actionConfiguration));

        StepVerifier.create(resultMono)
                .expectErrorMatches(e -> e instanceof AppsmithPluginException)
                .verify();
    }

    @Test
    public void testNullSubject() {
        DatasourceConfiguration datasourceConfiguraion = createDatasourceConfiguraion();

        ActionConfiguration actionConfiguration = createActionConfiguration();
        PluginUtils.setValueSafelyInFormData(actionConfiguration.getFormData(),
                "subject", null);
        Mono<ActionExecutionResult> resultMono = pluginExecutor.datasourceCreate(datasourceConfiguraion)
                .flatMap(session -> pluginExecutor.execute(session, datasourceConfiguraion, actionConfiguration));

        StepVerifier.create(resultMono)
                .assertNext(result -> assertTrue(result.getIsExecutionSuccess()))
                .verifyComplete();
    }

    @Test
    public void testBlankBody() {
        DatasourceConfiguration datasourceConfiguraion = createDatasourceConfiguraion();

        ActionConfiguration actionConfiguration = createActionConfiguration();
        actionConfiguration.setBody(null);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.datasourceCreate(datasourceConfiguraion)
                .flatMap(session -> pluginExecutor.execute(session, datasourceConfiguraion, actionConfiguration));

        StepVerifier.create(resultMono)
                .assertNext(result -> assertTrue(result.getIsExecutionSuccess()))
                .verifyComplete();
    }


    @Test
    public void testSendEmailValid() {

        DatasourceConfiguration dsConfig = createDatasourceConfiguraion();
        Mono<Session> sessionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = createActionConfiguration();

        Mono<ActionExecutionResult> resultMono = sessionMono.flatMap(session -> pluginExecutor.execute(session, dsConfig, actionConfiguration));

        StepVerifier.create(resultMono)
                .assertNext(result -> assertTrue(result.getIsExecutionSuccess()))
                .verifyComplete();
    }
}