package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.helpers.PluginUtils;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Endpoint;
import com.appsmith.util.RestrictedHostFilter;
import com.external.plugins.exceptions.SMTPErrorMessages;
import com.external.plugins.exceptions.SMTPPluginError;
import jakarta.mail.MessagingException;
import jakarta.mail.Session;
import jakarta.mail.Transport;
import jakarta.mail.internet.MimeBodyPart;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;
import reactor.test.StepVerifier;

import javax.net.SocketFactory;
import java.io.IOException;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.UnknownHostException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Queue;
import java.util.Set;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@Testcontainers
public class SmtpPluginTest {
    static final String username = "smtpUser";
    static final String password = "smtpPass";
    private static String host = "localhost";
    private static Long port = 25L;

    @Container
    public static final GenericContainer smtp = new GenericContainer(DockerImageName.parse("maildev/maildev:2.2.1"))
            .withExposedPorts(25)
            .withCommand("bin/maildev --base-pathname /maildev --incoming-user " + username + " --incoming-pass "
                    + password + " -s 25");

    @Container
    public static final GenericContainer smtpWithoutAuth = new GenericContainer(
                    DockerImageName.parse("maildev/maildev:2.2.1"))
            .withExposedPorts(1025)
            .withCommand("bin/maildev --base-pathname /maildev --smtp-port 1025 --incoming-user '' --incoming-pass ''");

    private final SmtpPlugin.SmtpPluginExecutor pluginExecutor = new SmtpPlugin.SmtpPluginExecutor();

    @BeforeAll
    public static void setup() {
        // Initialize SMTP connection with default configuration (can be changed per test)
        configureSmtpConnection(smtp); // Default
        // Testcontainers exposes maildev on loopback, which the production host filter rejects. Allow
        // the container hosts for the duration of the class so the tests that switch the filter on can
        // still reach the real server. Cleared in @AfterAll.
        allowTestContainerHosts();
    }

    @AfterAll
    public static void teardown() {
        RestrictedHostFilter.clearAlwaysAllowedHostsForTesting();
    }

    private static void allowTestContainerHosts(String... extraHosts) {
        List<String> allowed =
                new ArrayList<>(List.of(smtp.getContainerIpAddress(), smtpWithoutAuth.getContainerIpAddress()));
        allowed.addAll(Arrays.asList(extraHosts));
        RestrictedHostFilter.setAlwaysAllowedHostsForTesting(allowed.toArray(new String[0]));
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

        // First create the session and verify its properties
        Session session =
                pluginExecutor.datasourceCreate(noAuthDatasourceConfiguration).block();
        assertNotNull(session);
        assertEquals("false", session.getProperties().getProperty("mail.smtp.auth"));
        // Verify STARTTLS is not enabled when there's no authentication
        assertNull(session.getProperties().getProperty("mail.smtp.starttls.enable"));

        // Then test the datasource connection
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
        // cache() so both sends share the one Session this test is about, as the datasource context does.
        Mono<Session> sessionMono = pluginExecutor.datasourceCreate(dsConfig).cache();

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

        Session session =
                pluginExecutor.datasourceCreate(datasourceConfiguration).block();

        when(spySmtp.getMimeMessage(session)).thenReturn(mockMimeMessage);
        when(spySmtp.getMimeBodyPart()).thenReturn(mockMimeBodyPart);
        doNothing().when(spySmtp).sendMessage(any(MimeMessage.class));

        spySmtp.execute(session, datasourceConfiguration, actionConfiguration).block();
        String ENCODING = "UTF-8";

        verify(mockMimeMessage).setSubject("This is a test subject", ENCODING);
        verify(mockMimeBodyPart).setContent(actionConfiguration.getBody(), "text/html; charset=" + ENCODING);
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

        Session session =
                pluginExecutor.datasourceCreate(datasourceConfiguration).block();

        when(spySmtp.getMimeMessage(session)).thenReturn(mockMimeMessage);
        when(spySmtp.getMimeBodyPart()).thenReturn(mockMimeBodyPart);
        doNothing().when(spySmtp).sendMessage(any(MimeMessage.class));

        spySmtp.execute(session, datasourceConfiguration, actionConfiguration).block();
        String ENCODING = "UTF-8";

        verify(mockMimeMessage).setSubject("This is a test subject", ENCODING);
        verify(mockMimeBodyPart).setContent(actionConfiguration.getBody(), "text/plain; charset=" + ENCODING);
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

    /**
     * Plugin execution is invoked from the continuation of Redis-backed lookups in the server, i.e. on a Lettuce
     * event-loop thread. The blocking SMTP send must therefore never complete on the thread that subscribed.
     */
    @Test
    public void testExecute_doesNotRunOnTheSubscribingThread() throws MessagingException {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        ActionConfiguration actionConfiguration = createActionConfiguration();
        SmtpPlugin.SmtpPluginExecutor spySmtp = spy(pluginExecutor);
        AtomicReference<String> sendThread = new AtomicReference<>();
        doAnswer(invocation -> {
                    sendThread.set(Thread.currentThread().getName());
                    return invocation.callRealMethod();
                })
                .when(spySmtp)
                .sendMessage(any(MimeMessage.class));
        Scheduler caller = Schedulers.newSingle("caller-event-loop");
        try {
            Mono<ActionExecutionResult> resultMono = spySmtp.datasourceCreate(dsConfig)
                    .flatMap(session -> spySmtp.execute(session, dsConfig, actionConfiguration))
                    .subscribeOn(caller);

            StepVerifier.create(resultMono)
                    .assertNext(result -> assertTrue(result.getIsExecutionSuccess()))
                    .verifyComplete();
        } finally {
            caller.dispose();
        }
        assertNotNull(sendThread.get(), "the email was never sent");
        assertFalse(
                sendThread.get().startsWith("caller-event-loop"),
                "SMTP send ran on the subscribing thread: " + sendThread.get());
    }

    @Test
    public void testTestDatasource_doesNotRunOnTheSubscribingThread() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Scheduler caller = Schedulers.newSingle("caller-event-loop");
        try {
            // Target the Session overload directly: the DatasourceConfiguration overload's default wrapper in
            // PluginExecutor already subscribes on boundedElastic, which would mask a regression here.
            Mono<DatasourceTestResult> testDatasourceMono = pluginExecutor
                    .datasourceCreate(dsConfig)
                    .flatMap(pluginExecutor::testDatasource)
                    .subscribeOn(caller);

            StepVerifier.create(testDatasourceMono)
                    .assertNext(result -> {
                        assertTrue(result.isSuccess());
                        String thread = Thread.currentThread().getName();
                        assertFalse(
                                thread.startsWith("caller-event-loop"),
                                "SMTP connect completed on the subscribing thread: " + thread);
                    })
                    .verifyComplete();
        } finally {
            caller.dispose();
        }
    }

    @Test
    public void testDatasourceCreate_setsBoundedSocketTimeouts() {
        Session session =
                pluginExecutor.datasourceCreate(createDatasourceConfiguration()).block();
        assertNotNull(session);
        Properties props = session.getProperties();

        for (String key : List.of("mail.smtp.connectiontimeout", "mail.smtp.timeout", "mail.smtp.writetimeout")) {
            String value = props.getProperty(key);
            assertNotNull(value, key + " must be set so a stalled SMTP server cannot block forever");
            assertTrue(Integer.parseInt(value) > 0, key + " must be a positive bound, was " + value);
        }
    }

    /**
     * An SMTP server that accepts the TCP connection but never sends a greeting. Without socket timeouts the
     * send would block indefinitely; with them it must fail with a plugin error within the configured bound.
     */
    @Test
    public void testExecute_againstUnresponsiveServer_failsWithinTimeout() throws IOException {
        Queue<Socket> heldConnections = new ConcurrentLinkedQueue<>();
        try (ServerSocket silentServer = new ServerSocket(0, 1, InetAddress.getLoopbackAddress())) {
            Thread acceptor = new Thread(() -> {
                try {
                    while (!silentServer.isClosed()) {
                        heldConnections.add(silentServer.accept());
                    }
                } catch (IOException ignored) {
                    // server closed, stop accepting
                }
            });
            acceptor.setDaemon(true);
            acceptor.start();

            DatasourceConfiguration dsConfig = createDatasourceConfiguration();
            dsConfig.setAuthentication(null);
            dsConfig.setEndpoints(List.of(
                    new Endpoint(silentServer.getInetAddress().getHostAddress(), (long) silentServer.getLocalPort())));
            ActionConfiguration actionConfiguration = createActionConfiguration();

            // Subscribe off the test thread so that a regression (blocking the subscriber forever) shows up as a
            // StepVerifier timeout instead of hanging the whole test JVM.
            Mono<ActionExecutionResult> resultMono = pluginExecutor
                    .datasourceCreate(dsConfig)
                    .map(session -> {
                        // The production defaults are asserted separately; shrink them here so this test
                        // exercises the same timeout path in ~2 s instead of 30.
                        session.getProperties().setProperty("mail.smtp.connectiontimeout", "2000");
                        session.getProperties().setProperty("mail.smtp.timeout", "2000");
                        session.getProperties().setProperty("mail.smtp.writetimeout", "2000");
                        return session;
                    })
                    .flatMap(session -> pluginExecutor.execute(session, dsConfig, actionConfiguration))
                    .subscribeOn(Schedulers.boundedElastic());

            StepVerifier.create(resultMono)
                    .expectErrorMatches(e -> e instanceof AppsmithPluginException
                            && SMTPErrorMessages.MAIL_SENDING_FAILED_ERROR_MSG.equals(e.getMessage()))
                    .verify(Duration.ofSeconds(15));
        } finally {
            for (Socket socket : heldConnections) {
                socket.close();
            }
        }
    }

    @Test
    public void testDatasource_connection_closesTheTransportItConnects() throws MessagingException {
        Session mockSession = mock(Session.class);
        Transport mockTransport = mock(Transport.class);
        when(mockSession.getTransport()).thenReturn(mockTransport);
        AtomicReference<String> connectThread = new AtomicReference<>();
        doAnswer(invocation -> {
                    connectThread.set(Thread.currentThread().getName());
                    return null;
                })
                .when(mockTransport)
                .connect();

        Scheduler caller = Schedulers.newSingle("caller-event-loop");
        try {
            StepVerifier.create(pluginExecutor.testDatasource(mockSession).subscribeOn(caller))
                    .assertNext(result -> assertTrue(result.isSuccess()))
                    .verifyComplete();
        } finally {
            caller.dispose();
        }
        verify(mockTransport, times(1)).connect();
        verify(mockTransport, times(1)).close();
        assertNotNull(connectThread.get(), "connect was never called");
        assertFalse(
                connectThread.get().startsWith("caller-event-loop"),
                "connect ran on the subscribing thread: " + connectThread.get());
    }

    // ---------- Restricted host policy on SMTP datasource connections ----------

    @Test
    @DisplayName("GHSA-72m2-f9xp-wg9h")
    void should_rejectDatasource_when_hostIsBlockedAtCreate() {
        // Given: surefire bypasses the host filter JVM-wide (see root pom); switch it on for this body.
        RestrictedHostFilter.setSsrfFilterDisabledForTesting(false);
        try {
            DatasourceConfiguration blockedConfig = createDatasourceConfiguration();
            blockedConfig.setEndpoints(List.of(new Endpoint("169.254.169.254", 25L)));

            // When
            Mono<Session> sessionMono = pluginExecutor.datasourceCreate(blockedConfig);

            // Then
            StepVerifier.create(sessionMono)
                    .expectErrorSatisfies(error -> assertThat(error)
                            .isInstanceOf(AppsmithPluginException.class)
                            .hasMessageContaining(RestrictedHostFilter.HOST_NOT_ALLOWED))
                    .verify();
        } finally {
            RestrictedHostFilter.resetSsrfFilterDisabledForTesting();
        }
    }

    @Test
    @DisplayName("GHSA-72m2-f9xp-wg9h")
    void should_rejectConnection_when_testDatasourceTargetsBlockedHost() {
        RestrictedHostFilter.setSsrfFilterDisabledForTesting(false);
        try {
            // Given: the Session is created while the container host is allowed, as a cached datasource
            // context would be; the policy is then re-evaluated at connect time, where loopback is blocked.
            Session session = pluginExecutor
                    .datasourceCreate(createDatasourceConfiguration())
                    .block();
            assertThat(session).isNotNull();
            RestrictedHostFilter.clearAlwaysAllowedHostsForTesting();
            assertThat(RestrictedHostFilter.isHostBlocked(host))
                    .as("precondition: the container host must be policy-blocked once the allow-list is cleared")
                    .isTrue();

            // When
            Mono<DatasourceTestResult> testResult = pluginExecutor.testDatasource(session);

            // Then
            StepVerifier.create(testResult)
                    .assertNext(result -> {
                        assertThat(result.isSuccess()).isFalse();
                        assertThat(result.getInvalids())
                                .containsExactly(SMTPErrorMessages.DS_CONNECTION_FAILED_TO_SMTP_SERVER_ERROR_MSG);
                    })
                    .verifyComplete();
        } finally {
            allowTestContainerHosts();
            RestrictedHostFilter.resetSsrfFilterDisabledForTesting();
        }
    }

    @Test
    @DisplayName("GHSA-72m2-f9xp-wg9h")
    void should_rejectSend_when_executeTargetsBlockedHost() {
        RestrictedHostFilter.setSsrfFilterDisabledForTesting(false);
        try {
            // Given
            DatasourceConfiguration dsConfig = createDatasourceConfiguration();
            Session session = pluginExecutor.datasourceCreate(dsConfig).block();
            assertThat(session).isNotNull();
            RestrictedHostFilter.clearAlwaysAllowedHostsForTesting();
            assertThat(RestrictedHostFilter.isHostBlocked(host))
                    .as("precondition: the container host must be policy-blocked once the allow-list is cleared")
                    .isTrue();

            // When
            Mono<ActionExecutionResult> resultMono =
                    pluginExecutor.execute(session, dsConfig, createActionConfiguration());

            // Then
            StepVerifier.create(resultMono)
                    .expectErrorSatisfies(error -> assertThat(error)
                            .isInstanceOf(AppsmithPluginException.class)
                            .hasMessage(SMTPErrorMessages.MAIL_SENDING_FAILED_ERROR_MSG))
                    .verify();
        } finally {
            allowTestContainerHosts();
            RestrictedHostFilter.resetSsrfFilterDisabledForTesting();
        }
    }

    @Test
    @DisplayName("GHSA-72m2-f9xp-wg9h")
    void should_refuseConnect_when_sessionSocketTargetsBlockedHost() throws IOException {
        RestrictedHostFilter.setSsrfFilterDisabledForTesting(false);
        try {
            // Given: the session's own socket factory, with the configured host blocked at connect time.
            Session session = pluginExecutor
                    .datasourceCreate(createDatasourceConfiguration())
                    .block();
            assertThat(session).isNotNull();
            Object factory = session.getProperties().get("mail.smtp.socketFactory");
            assertThat(factory).isInstanceOf(SocketFactory.class);
            RestrictedHostFilter.clearAlwaysAllowedHostsForTesting();

            try (Socket socket = ((SocketFactory) factory).createSocket()) {
                // When / Then
                assertThatThrownBy(() -> socket.connect(new InetSocketAddress(host, port.intValue()), 2000))
                        .isInstanceOf(UnknownHostException.class)
                        .hasMessage(RestrictedHostFilter.HOST_NOT_ALLOWED);
                assertThat(socket.isConnected()).isFalse();
            }
        } finally {
            allowTestContainerHosts();
            RestrictedHostFilter.resetSsrfFilterDisabledForTesting();
        }
    }

    @Test
    @DisplayName("GHSA-72m2-f9xp-wg9h")
    void should_connectAndSend_when_hostIsAllowedWithFilterOn() {
        RestrictedHostFilter.setSsrfFilterDisabledForTesting(false);
        try {
            // Given
            DatasourceConfiguration dsConfig = createDatasourceConfiguration();
            Session session = pluginExecutor.datasourceCreate(dsConfig).block();
            assertThat(session).isNotNull();
            assertThat(session.getProperties().get("mail.smtp.socketFactory"))
                    .as("the session must open its sockets through the restricted socket factory")
                    .isInstanceOf(SocketFactory.class);
            assertThat(session.getProperties().getProperty("mail.smtp.socketFactory.fallback"))
                    .as("JavaMail must not fall back to an unrestricted socket")
                    .isEqualTo("false");

            // When
            Mono<DatasourceTestResult> testResult = pluginExecutor.testDatasource(session);
            Mono<ActionExecutionResult> sendResult =
                    pluginExecutor.execute(session, dsConfig, createActionConfiguration());

            // Then
            StepVerifier.create(testResult)
                    .assertNext(result -> assertThat(result.isSuccess())
                            .as("invalids: " + result.getInvalids())
                            .isTrue())
                    .verifyComplete();
            StepVerifier.create(sendResult)
                    .assertNext(
                            result -> assertThat(result.getIsExecutionSuccess()).isTrue())
                    .verifyComplete();
        } finally {
            RestrictedHostFilter.resetSsrfFilterDisabledForTesting();
        }
    }

    @Test
    @DisplayName("GHSA-72m2-f9xp-wg9h")
    void should_connectToValidatedAddress_when_endpointPointsElsewhere() throws IOException {
        RestrictedHostFilter.setSsrfFilterDisabledForTesting(false);
        try (ServerSocket listener = new ServerSocket(0, 1, InetAddress.getLoopbackAddress())) {
            // Given: a datasource configured with a local listener as its (allow-listed) host.
            listener.setSoTimeout(5000);
            String listenerHost = listener.getInetAddress().getHostAddress();
            allowTestContainerHosts(listenerHost);
            DatasourceConfiguration dsConfig = createDatasourceConfiguration();
            dsConfig.setAuthentication(null);
            dsConfig.setEndpoints(List.of(new Endpoint(listenerHost, (long) listener.getLocalPort())));
            Session session = pluginExecutor.datasourceCreate(dsConfig).block();
            assertThat(session).isNotNull();
            Object factory = session.getProperties().get("mail.smtp.socketFactory");
            assertThat(factory).isInstanceOf(SocketFactory.class);

            try (Socket socket = ((SocketFactory) factory).createSocket()) {
                // When: the endpoint handed to connect() names a different, unroutable address.
                socket.connect(new InetSocketAddress("192.0.2.1", listener.getLocalPort()), 2000);

                // Then: the socket connected to the address it validated for the configured host.
                try (Socket accepted = listener.accept()) {
                    assertThat(accepted).isNotNull();
                    assertThat(socket.isConnected()).isTrue();
                }
            }
        } finally {
            allowTestContainerHosts();
            RestrictedHostFilter.resetSsrfFilterDisabledForTesting();
        }
    }
}
