package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.helpers.PluginUtils;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
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

    private DatasourceConfiguration createDatasourceConfiguration() {

        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        DBAuth auth = new DBAuth();
        auth.setUsername(username);
        auth.setPassword(password);
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
        PluginUtils.setValueSafelyInFormData(formData, "send.from", fromAddress);
        PluginUtils.setValueSafelyInFormData(formData, "send.to", toAddress);
        PluginUtils.setValueSafelyInFormData(formData, "send.cc", ccAddress);
        PluginUtils.setValueSafelyInFormData(formData, "send.bcc", bccAddress);
        PluginUtils.setValueSafelyInFormData(formData, "send.isReplyTo", true);
        PluginUtils.setValueSafelyInFormData(formData, "send.replyTo", replyTo);
        PluginUtils.setValueSafelyInFormData(formData, "send.subject", "This is a test subject");
        actionConfiguration.setBody("This is a body");

        actionConfiguration.setFormData(formData);
        return actionConfiguration;
    }

    @Test
    public void testInvalidHostname() {
        DatasourceConfiguration invalidDatasourceConfiguration = createDatasourceConfiguration();
        invalidDatasourceConfiguration.setEndpoints(List.of(new Endpoint("", 25l)));

        Assert.assertEquals(Set.of("Could not find host address. Please edit the 'Hostname' field to provide the " +
                        "desired endpoint."),
                pluginExecutor.validateDatasource(invalidDatasourceConfiguration));
    }

    @Test
    public void testInvalidPort() {
        DatasourceConfiguration invalidDatasourceConfiguration = createDatasourceConfiguration();
        invalidDatasourceConfiguration.setEndpoints(List.of(new Endpoint(host, null)));

        Assert.assertEquals(Set.of(), pluginExecutor.validateDatasource(invalidDatasourceConfiguration));
    }

    @Test
    public void testNullAuthentication() {
        DatasourceConfiguration invalidDatasourceConfiguration = createDatasourceConfiguration();
        invalidDatasourceConfiguration.setAuthentication(null);

        Assert.assertEquals(Set.of("Invalid authentication credentials. Please check datasource configuration."),
                pluginExecutor.validateDatasource(invalidDatasourceConfiguration));
    }

    @Test
    public void testInvalidAuthentication() {
        DatasourceConfiguration invalidDatasourceConfiguration = createDatasourceConfiguration();
        DBAuth auth = new DBAuth();
        auth.setUsername("randomUser");
        auth.setPassword("randomPass");
        invalidDatasourceConfiguration.setAuthentication(auth);

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
        DatasourceConfiguration datasourceConfiguraion = createDatasourceConfiguration();

        ActionConfiguration actionConfiguration = createActionConfiguration();
        PluginUtils.setValueSafelyInFormData(actionConfiguration.getFormData(),
                "send.from", "   ");
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
        DatasourceConfiguration datasourceConfiguraion = createDatasourceConfiguration();

        ActionConfiguration actionConfiguration = createActionConfiguration();
        PluginUtils.setValueSafelyInFormData(actionConfiguration.getFormData(),
                "send.to", "   ");
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
        DatasourceConfiguration datasourceConfiguraion = createDatasourceConfiguration();

        ActionConfiguration actionConfiguration = createActionConfiguration();
        PluginUtils.setValueSafelyInFormData(actionConfiguration.getFormData(),
                "send.from", "invalid");
        Mono<ActionExecutionResult> resultMono = pluginExecutor.datasourceCreate(datasourceConfiguraion)
                .flatMap(session -> pluginExecutor.execute(session, datasourceConfiguraion, actionConfiguration));

        StepVerifier.create(resultMono)
                .expectErrorMatches(e -> e instanceof AppsmithPluginException)
                .verify();
    }

    @Test
    public void testInvalidToAddress() {
        DatasourceConfiguration datasourceConfiguraion = createDatasourceConfiguration();

        ActionConfiguration actionConfiguration = createActionConfiguration();
        PluginUtils.setValueSafelyInFormData(actionConfiguration.getFormData(),
                "send.to", "invalidEmail");
        Mono<ActionExecutionResult> resultMono = pluginExecutor.datasourceCreate(datasourceConfiguraion)
                .flatMap(session -> pluginExecutor.execute(session, datasourceConfiguraion, actionConfiguration));

        StepVerifier.create(resultMono)
                .expectErrorMatches(e -> e instanceof AppsmithPluginException)
                .verify();
    }

    @Test
    public void testNullSubject() {
        DatasourceConfiguration datasourceConfiguraion = createDatasourceConfiguration();

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
        DatasourceConfiguration datasourceConfiguraion = createDatasourceConfiguration();

        ActionConfiguration actionConfiguration = createActionConfiguration();
        actionConfiguration.setBody(null);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.datasourceCreate(datasourceConfiguraion)
                .flatMap(session -> pluginExecutor.execute(session, datasourceConfiguraion, actionConfiguration));

        StepVerifier.create(resultMono)
                .assertNext(result -> assertTrue(result.getIsExecutionSuccess()))
                .verifyComplete();
    }

    /**
     * The email should be sent without the attachments if the attachment object is null or empty
     */
    @Test
    public void testEmptyAttachments() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();

        ActionConfiguration actionConfiguration = createActionConfiguration();
        PluginUtils.setValueSafelyInFormData(actionConfiguration.getFormData(), "send.attachments", "");

        Mono<ActionExecutionResult> resultMono = pluginExecutor.datasourceCreate(datasourceConfiguration)
                .flatMap(session -> pluginExecutor.execute(session, datasourceConfiguration, actionConfiguration));

        StepVerifier.create(resultMono)
                .assertNext(result -> assertTrue(result.getIsExecutionSuccess()))
                .verifyComplete();
    }

    @Test
    public void testNullAttachment() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();

        ActionConfiguration actionConfiguration = createActionConfiguration();
        PluginUtils.setValueSafelyInFormData(actionConfiguration.getFormData(), "send.attachments", null);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.datasourceCreate(datasourceConfiguration)
                .flatMap(session -> pluginExecutor.execute(session, datasourceConfiguration, actionConfiguration));

        StepVerifier.create(resultMono)
                .assertNext(result -> assertTrue(result.getIsExecutionSuccess()))
                .verifyComplete();
    }

    @Test
    public void testInvalidAttachmentJSON() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();

        ActionConfiguration actionConfiguration = createActionConfiguration();
        PluginUtils.setValueSafelyInFormData(actionConfiguration.getFormData(), "send.attachments", "randomValue");

        Mono<ActionExecutionResult> resultMono = pluginExecutor.datasourceCreate(datasourceConfiguration)
                .flatMap(session -> pluginExecutor.execute(session, datasourceConfiguration, actionConfiguration));

        StepVerifier.create(resultMono)
                .expectErrorMatches(e -> e instanceof AppsmithPluginException)
                .verify();
    }

    @Test
    public void testInvalidAttachmentFiledata() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();

        ActionConfiguration actionConfiguration = createActionConfiguration();
        String attachmentJson = "[{\n" +
                "        \"type\": \"image/png\",\n" +
                "        \"id\": \"uppy-smtp/icon/png-1d-1e-image/png-2854-1635400419555\",\n" +
                "        \"data\": \"data:image/png;randomValueHere\",\n" +
                "        \"name\": \"test-icon-file.png\",\n" +
                "        \"size\": 2854\n" +
                "    }]";
        PluginUtils.setValueSafelyInFormData(actionConfiguration.getFormData(), "send.attachments", attachmentJson);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.datasourceCreate(datasourceConfiguration)
                .flatMap(session -> pluginExecutor.execute(session, datasourceConfiguration, actionConfiguration));

        StepVerifier.create(resultMono)
                .expectErrorMatches(e -> e instanceof AppsmithPluginException && e.getMessage().equals("Attachment test-icon-file.png contains invalid data. Unable to send email."))
                .verify();
    }

    @Test
    public void testSendEmailValidWithAttachment() {

        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<Session> sessionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = createActionConfiguration();
        PluginUtils.setValueSafelyInFormData(actionConfiguration.getFormData(), "send.attachments", "");

        Mono<ActionExecutionResult> resultMono = sessionMono.flatMap(session -> pluginExecutor.execute(session, dsConfig, actionConfiguration));

        StepVerifier.create(resultMono)
                .assertNext(result -> assertTrue(result.getIsExecutionSuccess()))
                .verifyComplete();
    }

    /**
     * This test case asserts that we can send multiple emails concurrently using the same email Session
     */
    @Test
    public void testSendMultipleEmailsConcurrently() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<Session> sessionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration1 = createActionConfiguration();
        ActionConfiguration actionConfiguration2 = createActionConfiguration();
        PluginUtils.setValueSafelyInFormData(actionConfiguration2.getFormData(), "send.from", "from2@example.com");

        Mono<ActionExecutionResult> email1Mono = sessionMono.flatMap(session -> pluginExecutor.execute(session, dsConfig, actionConfiguration1));
        Mono<ActionExecutionResult> email2Mono = sessionMono.flatMap(session -> pluginExecutor.execute(session, dsConfig, actionConfiguration2));

        StepVerifier.create(Mono.zip(email1Mono, email2Mono))
                .assertNext(tuple -> {
                    ActionExecutionResult result1 = tuple.getT1();
                    ActionExecutionResult result2 = tuple.getT2();
                    assertTrue(result1.getIsExecutionSuccess());
                    assertTrue(result2.getIsExecutionSuccess());
                })
                .verifyComplete();

    }
}