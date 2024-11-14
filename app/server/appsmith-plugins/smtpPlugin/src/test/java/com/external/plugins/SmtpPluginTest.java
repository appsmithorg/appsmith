package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.helpers.PluginUtils;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Endpoint;
import com.external.plugins.exceptions.SMTPErrorMessages;
import com.external.plugins.exceptions.SMTPPluginError;
import jakarta.mail.MessagingException;
import jakarta.mail.Session;
import jakarta.mail.Transport;
import jakarta.mail.internet.MimeBodyPart;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.stubbing.Answer;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;


import java.util.List;
import java.util.Map;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Set;
import java.util.ArrayList;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@Testcontainers
public class SmtpPluginTest {
    static final String username = "smtpUser";
    static final String password = "smtpPass";
    private static String host = "localhost";
    private static Long port = 25L;

    @Container
    public static final GenericContainer smtp = new GenericContainer(DockerImageName.parse("maildev/maildev"))
            .withExposedPorts(25)
            .withCommand("bin/maildev --base-pathname /maildev --incoming-user " + username + " --incoming-pass "
                    + password + " -s 25");

    @Container
    public static final GenericContainer smtpWithoutAuth = new GenericContainer(DockerImageName.parse("maildev/maildev"))
        .withExposedPorts(1025)
        .withCommand("bin/maildev --base-pathname /maildev --smtp-port 1025 --incoming-user '' --incoming-pass ''");

    private final SmtpPlugin.SmtpPluginExecutor pluginExecutor = new SmtpPlugin.SmtpPluginExecutor();

    @BeforeAll
    public static void setup() {
        //Initialize SMTP connection with default configuration (can be changed per test)
        configureSmtpConnection(smtp); //Default
    }

    private static void configureSmtpConnection(GenericContainer container) {
        host = container.getContainerIpAddress();
        port = Long.valueOf(container.getFirstMappedPort());
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
                "from@test.com", "to@test.com", "cc@test.com", "bcc@test.com", "replyTo@test.com", "text/html");
    }

    private ActionConfiguration createActionConfiguration(String bodyType) {
        return createActionConfiguration(
                "from@test.com", "to@test.com", "cc@test.com", "bcc@test.com", "replyTo@test.com", bodyType);
    }

    private ActionConfiguration createActionConfiguration(
            String fromAddress,
            String toAddress,
            String ccAddress,
            String bccAddress,
            String replyTo,
            String bodyType) {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        Map<String, Object> formData = new HashMap<>();
        PluginUtils.setValueSafelyInFormData(formData, "send.from", fromAddress);
        PluginUtils.setValueSafelyInFormData(formData, "send.to", toAddress);
        PluginUtils.setValueSafelyInFormData(formData, "send.cc", ccAddress);
        PluginUtils.setValueSafelyInFormData(formData, "send.bcc", bccAddress);
        PluginUtils.setValueSafelyInFormData(formData, "send.isReplyTo", true);
        PluginUtils.setValueSafelyInFormData(formData, "send.replyTo", replyTo);
        PluginUtils.setValueSafelyInFormData(formData, "send.subject", "This is a test subject");
        PluginUtils.setValueSafelyInFormData(formData, "send.bodyType", bodyType);
        actionConfiguration.setBody("This is a body");

        actionConfiguration.setFormData(formData);
        return actionConfiguration;
    }

    @Test
    public void testInvalidHostname() {
        DatasourceConfiguration invalidDatasourceConfiguration = createDatasourceConfiguration();
        invalidDatasourceConfiguration.setEndpoints(List.of(new Endpoint("", 25L)));

        assertEquals(
                Set.of(SMTPErrorMessages.DS_MISSING_HOST_ADDRESS_ERROR_MSG),
                pluginExecutor.validateDatasource(invalidDatasourceConfiguration));
    }

    @Test
    public void testInvalidPort() {
        DatasourceConfiguration invalidDatasourceConfiguration = createDatasourceConfiguration();
        invalidDatasourceConfiguration.setEndpoints(List.of(new Endpoint(host, null)));

        assertEquals(Set.of(), pluginExecutor.validateDatasource(invalidDatasourceConfiguration));
    }

    @Test
    public void testConnectionWithoutAuth() {
        configureSmtpConnection(smtpWithoutAuth);
        DatasourceConfiguration noAuthDatasourceConfiguration = createDatasourceConfiguration();
        noAuthDatasourceConfiguration.setAuthentication(null); // No authentication

        Mono<DatasourceTestResult> testDatasourceMono = pluginExecutor.testDatasource(noAuthDatasourceConfiguration);

        StepVerifier.create(testDatasourceMono)
            .assertNext(datasourceTestResult -> {
                assertNotNull(datasourceTestResult);
                assertTrue(datasourceTestResult.isSuccess());
                assertTrue(datasourceTestResult.getInvalids().isEmpty());
            })
            .verifyComplete();
        configureSmtpConnection(smtp);
    }

    @Test
    public void testTestDatasource_withCorrectCredentials_returnsWithoutInvalids() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();

        final Mono<DatasourceTestResult> testDatasourceMono = pluginExecutor.testDatasource(dsConfig);

        StepVerifier.create(testDatasourceMono)
                .assertNext(datasourceTestResult -> {
                    assertNotNull(datasourceTestResult);
                    assertTrue(datasourceTestResult.isSuccess());
                    assertTrue(datasourceTestResult.getInvalids().isEmpty());
                })
                .verifyComplete();
    }

    @Test
    public void testInvalidAuthentication() {
        DatasourceConfiguration invalidDatasourceConfiguration = createDatasourceConfiguration();
        DBAuth auth = new DBAuth();
        auth.setUsername("randomUser");
        auth.setPassword("randomPass");
        invalidDatasourceConfiguration.setAuthentication(auth);

        ActionConfiguration actionConfiguration = createActionConfiguration();

        Mono<ActionExecutionResult> resultMono = pluginExecutor
                .datasourceCreate(invalidDatasourceConfiguration)
                .flatMap(session ->
                        pluginExecutor.execute(session, invalidDatasourceConfiguration, actionConfiguration));

        StepVerifier.create(resultMono)
                .expectErrorMatches(e -> e instanceof AppsmithPluginException
                        && ((AppsmithPluginException) e)
                                .getDownstreamErrorMessage()
                                .contains("535 Invalid username or password"))
                .verify();
    }

    @Test
    public void testBlankFromAddress() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();

        ActionConfiguration actionConfiguration = createActionConfiguration();
        PluginUtils.setValueSafelyInFormData(actionConfiguration.getFormData(), "send.from", "   ");
        Mono<ActionExecutionResult> resultMono = pluginExecutor
                .datasourceCreate(datasourceConfiguration)
                .flatMap(session -> pluginExecutor.execute(session, datasourceConfiguration, actionConfiguration));

        StepVerifier.create(resultMono)
                .expectErrorMatches(e -> e instanceof AppsmithPluginException
                        && e.getMessage().equals(SMTPErrorMessages.SENDER_ADDRESS_NOT_FOUND_ERROR_MSG))
                .verify();
    }

    @Test
    public void testBlankToAddress() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();

        ActionConfiguration actionConfiguration = createActionConfiguration();
        PluginUtils.setValueSafelyInFormData(actionConfiguration.getFormData(), "send.to", "   ");
        Mono<ActionExecutionResult> resultMono = pluginExecutor
                .datasourceCreate(datasourceConfiguration)
                .flatMap(session -> pluginExecutor.execute(session, datasourceConfiguration, actionConfiguration));

        StepVerifier.create(resultMono)
                .expectErrorMatches(e -> e instanceof AppsmithPluginException
                        && e.getMessage().equals(SMTPErrorMessages.RECIPIENT_ADDRESS_NOT_FOUND_ERROR_MSG))
                .verify();
    }

    @Test
    public void testInvalidFromAddress() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();

        ActionConfiguration actionConfiguration = createActionConfiguration();
        PluginUtils.setValueSafelyInFormData(actionConfiguration.getFormData(), "send.from", "invalid");
        Mono<ActionExecutionResult> resultMono = pluginExecutor
                .datasourceCreate(datasourceConfiguration)
                .flatMap(session -> pluginExecutor.execute(session, datasourceConfiguration, actionConfiguration));

        StepVerifier.create(resultMono)
                .expectErrorMatches(e -> e instanceof AppsmithPluginException)
                .verify();
    }

    @Test
    public void testInvalidToAddress() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();

        ActionConfiguration actionConfiguration = createActionConfiguration();
        PluginUtils.setValueSafelyInFormData(actionConfiguration.getFormData(), "send.to", "invalidEmail");
        Mono<ActionExecutionResult> resultMono = pluginExecutor
                .datasourceCreate(datasourceConfiguration)
                .flatMap(session -> pluginExecutor.execute(session, datasourceConfiguration, actionConfiguration));

        StepVerifier.create(resultMono)
                .expectErrorMatches(e -> e instanceof AppsmithPluginException)
                .verify();
    }

    @Test
    public void testNullSubject() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();

        ActionConfiguration actionConfiguration = createActionConfiguration();
        PluginUtils.setValueSafelyInFormData(actionConfiguration.getFormData(), "subject", null);
        Mono<ActionExecutionResult> resultMono = pluginExecutor
                .datasourceCreate(datasourceConfiguration)
                .flatMap(session -> pluginExecutor.execute(session, datasourceConfiguration, actionConfiguration));

        StepVerifier.create(resultMono)
                .assertNext(result -> assertTrue(result.getIsExecutionSuccess()))
                .verifyComplete();
    }

    @Test
    public void testBlankBody() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();

        ActionConfiguration actionConfiguration = createActionConfiguration();
        actionConfiguration.setBody(null);

        Mono<ActionExecutionResult> resultMono = pluginExecutor
                .datasourceCreate(datasourceConfiguration)
                .flatMap(session -> pluginExecutor.execute(session, datasourceConfiguration, actionConfiguration));

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

        Mono<ActionExecutionResult> resultMono = pluginExecutor
                .datasourceCreate(datasourceConfiguration)
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

        Mono<ActionExecutionResult> resultMono = pluginExecutor
                .datasourceCreate(datasourceConfiguration)
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

        Mono<ActionExecutionResult> resultMono = pluginExecutor
                .datasourceCreate(datasourceConfiguration)
                .flatMap(session -> pluginExecutor.execute(session, datasourceConfiguration, actionConfiguration));

        StepVerifier.create(resultMono)
                .expectErrorMatches(e -> e instanceof AppsmithPluginException)
                .verify();
    }

    @Test
    public void testInvalidAttachmentFileData() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();

        ActionConfiguration actionConfiguration = createActionConfiguration();
        String attachmentJson = "[{\n" + "        \"type\": \"image/png\",\n"
                + "        \"id\": \"uppy-smtp/icon/png-1d-1e-image/png-2854-1635400419555\",\n"
                + "        \"data\": \"data:image/png;randomValueHere\",\n"
                + "        \"name\": \"test-icon-file.png\",\n"
                + "        \"size\": 2854\n"
                + "    }]";
        PluginUtils.setValueSafelyInFormData(actionConfiguration.getFormData(), "send.attachments", attachmentJson);

        Mono<ActionExecutionResult> resultMono = pluginExecutor
                .datasourceCreate(datasourceConfiguration)
                .flatMap(session -> pluginExecutor.execute(session, datasourceConfiguration, actionConfiguration));

        StepVerifier.create(resultMono)
                .expectErrorMatches(e -> e instanceof AppsmithPluginException
                        && e.getMessage()
                                .equals(String.format(
                                        SMTPErrorMessages.INVALID_ATTACHMENT_ERROR_MSG, "test-icon-file.png")))
                .verify();
    }

    @Test
    public void testSendEmailValidWithAttachment() {

        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<Session> sessionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = createActionConfiguration();
        PluginUtils.setValueSafelyInFormData(actionConfiguration.getFormData(), "send.attachments", "");

        Mono<ActionExecutionResult> resultMono =
                sessionMono.flatMap(session -> pluginExecutor.execute(session, dsConfig, actionConfiguration));

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

        Mono<ActionExecutionResult> email1Mono =
                sessionMono.flatMap(session -> pluginExecutor.execute(session, dsConfig, actionConfiguration1));
        Mono<ActionExecutionResult> email2Mono =
                sessionMono.flatMap(session -> pluginExecutor.execute(session, dsConfig, actionConfiguration2));

        StepVerifier.create(Mono.zip(email1Mono, email2Mono))
                .assertNext(tuple -> {
                    ActionExecutionResult result1 = tuple.getT1();
                    ActionExecutionResult result2 = tuple.getT2();
                    assertTrue(result1.getIsExecutionSuccess());
                    assertTrue(result2.getIsExecutionSuccess());
                })
                .verifyComplete();
    }

    @Test
    public void testExecuteWithUTFEncoding() throws MessagingException {
        ActionConfiguration actionConfiguration = createActionConfiguration();
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        MimeMessage mockMimeMessage = mock(MimeMessage.class);
        MimeBodyPart mockMimeBodyPart = mock(MimeBodyPart.class);
        doNothing().when(mockMimeMessage).setSubject(anyString(), anyString());
        doNothing().when(mockMimeBodyPart).setContent(anyString(), anyString());

        SmtpPlugin.SmtpPluginExecutor spySmtp = spy(pluginExecutor);

        try (MockedStatic<Transport> transportMock = Mockito.mockStatic(Transport.class)) {
            Session session =
                    pluginExecutor.datasourceCreate(datasourceConfiguration).block();

            when(spySmtp.getMimeMessage(session)).thenReturn(mockMimeMessage);
            when(spySmtp.getMimeBodyPart()).thenReturn(mockMimeBodyPart);

            transportMock.when(() -> Transport.send(mockMimeMessage)).thenAnswer((Answer<Void>) invocation -> null);

            spySmtp.execute(session, datasourceConfiguration, actionConfiguration); // test method call
            String ENCODING = "UTF-8";

            verify(mockMimeMessage).setSubject("This is a test subject", ENCODING);
            verify(mockMimeBodyPart).setContent(actionConfiguration.getBody(), "text/html; charset=" + ENCODING);
        }
    }

    @Test
    public void testExecuteWithBodyTypePlainText() throws MessagingException {
        ActionConfiguration actionConfiguration = createActionConfiguration("text/plain");
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        MimeMessage mockMimeMessage = mock(MimeMessage.class);
        MimeBodyPart mockMimeBodyPart = mock(MimeBodyPart.class);
        doNothing().when(mockMimeMessage).setSubject(anyString(), anyString());
        doNothing().when(mockMimeBodyPart).setContent(anyString(), anyString());

        SmtpPlugin.SmtpPluginExecutor spySmtp = spy(pluginExecutor);

        try (MockedStatic<Transport> transportMock = Mockito.mockStatic(Transport.class)) {
            Session session =
                    pluginExecutor.datasourceCreate(datasourceConfiguration).block();

            when(spySmtp.getMimeMessage(session)).thenReturn(mockMimeMessage);
            when(spySmtp.getMimeBodyPart()).thenReturn(mockMimeBodyPart);

            transportMock.when(() -> Transport.send(mockMimeMessage)).thenAnswer((Answer<Void>) invocation -> null);

            spySmtp.execute(session, datasourceConfiguration, actionConfiguration); // test method call
            String ENCODING = "UTF-8";

            verify(mockMimeMessage).setSubject("This is a test subject", ENCODING);
            verify(mockMimeBodyPart).setContent(actionConfiguration.getBody(), "text/plain; charset=" + ENCODING);
        }
    }

    @Test
    public void verifyUniquenessOfSMTPPluginErrorCode() {
        assert (Arrays.stream(SMTPPluginError.values())
                        .map(SMTPPluginError::getAppErrorCode)
                        .distinct()
                        .count()
                == SMTPPluginError.values().length);

        assert (Arrays.stream(SMTPPluginError.values())
                        .map(SMTPPluginError::getAppErrorCode)
                        .filter(appErrorCode -> appErrorCode.length() != 11 || !appErrorCode.startsWith("PE-SMT"))
                        .collect(Collectors.toList())
                        .size()
                == 0);
    }

    @Test
    public void testGetEndpointIdentifierForRateLimit_endpointNotPresent_ReturnsEmptyString() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        // setting endpoints to empty list
        dsConfig.setEndpoints(new ArrayList());

        final Mono<String> rateLimitIdentifierMono = pluginExecutor.getEndpointIdentifierForRateLimit(dsConfig);

        StepVerifier.create(rateLimitIdentifierMono)
                .assertNext(endpointIdentifier -> {
                    assertEquals("", endpointIdentifier);
                })
                .verifyComplete();
    }

    @Test
    public void testGetEndpointIdentifierForRateLimit_HostAbsent_ReturnsEmptyString() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();

        // Setting hostname and port
        dsConfig.getEndpoints().get(0).setHost("");
        dsConfig.getEndpoints().get(0).setPort(25L);

        final Mono<String> endPointIdentifierMono = pluginExecutor.getEndpointIdentifierForRateLimit(dsConfig);

        StepVerifier.create(endPointIdentifierMono)
                .assertNext(endpointIdentifier -> {
                    assertEquals("", endpointIdentifier);
                })
                .verifyComplete();
    }

    @Test
    public void testGetEndpointIdentifierForRateLimit_HostAndPortPresent_ReturnsCorrectString() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();

        // Setting hostname and port
        dsConfig.getEndpoints().get(0).setHost("localhost");
        dsConfig.getEndpoints().get(0).setPort(2525L);

        final Mono<String> endPointIdentifierMono = pluginExecutor.getEndpointIdentifierForRateLimit(dsConfig);

        StepVerifier.create(endPointIdentifierMono)
                .assertNext(endpointIdentifier -> {
                    assertEquals("localhost_2525", endpointIdentifier);
                })
                .verifyComplete();
    }

    @Test
    public void testGetEndpointIdentifierForRateLimit_HostPresentPortAbsent_ReturnsCorrectString() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();

        // Setting hostname and port
        dsConfig.getEndpoints().get(0).setHost("localhost");
        dsConfig.getEndpoints().get(0).setPort(null);

        final Mono<String> endPointIdentifierMono = pluginExecutor.getEndpointIdentifierForRateLimit(dsConfig);

        StepVerifier.create(endPointIdentifierMono)
                .assertNext(endpointIdentifier -> {
                    assertEquals("localhost_25", endpointIdentifier);
                })
                .verifyComplete();
    }
}
