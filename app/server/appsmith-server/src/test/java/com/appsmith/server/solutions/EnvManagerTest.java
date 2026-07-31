package com.appsmith.server.solutions;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.configurations.EmailConfig;
import com.appsmith.server.configurations.GoogleRecaptchaConfig;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.TestEmailConfigRequestDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.BlacklistedEnvVariableHelper;
import com.appsmith.server.helpers.FileUtils;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.notifications.EmailSender;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.AssetService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.EmailService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.solutions.ce.EnvManagerCEImpl;
import com.appsmith.util.RestrictedHostFilter;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mockito;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import javax.net.SocketFactory;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;

@ExtendWith(SpringExtension.class)
@Slf4j
public class EnvManagerTest {
    EnvManager envManager;

    @MockBean
    private SessionUserService sessionUserService;

    @MockBean
    private UserService userService;

    @MockBean
    private AnalyticsService analyticsService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private EmailSender emailSender;

    @MockBean
    private CommonConfig commonConfig;

    @MockBean
    private EmailConfig emailConfig;

    @MockBean
    private JavaMailSender javaMailSender;

    @MockBean
    private GoogleRecaptchaConfig googleRecaptchaConfig;

    @MockBean
    private FileUtils fileUtils;

    @MockBean
    private ConfigService configService;

    @MockBean
    private PermissionGroupService permissionGroupService;

    @MockBean
    private UserUtils userUtils;

    @MockBean
    private OrganizationService organizationService;

    @MockBean
    private ObjectMapper objectMapper;

    @MockBean
    AssetService assetService;

    @MockBean
    BlacklistedEnvVariableHelper blacklistedEnvVariableHelper;

    private EmailService emailService;

    @BeforeEach
    public void setup() {
        EnvManager realEnvManager = new EnvManagerImpl(
                sessionUserService,
                userService,
                analyticsService,
                userRepository,
                emailSender,
                commonConfig,
                emailConfig,
                javaMailSender,
                googleRecaptchaConfig,
                fileUtils,
                permissionGroupService,
                configService,
                userUtils,
                organizationService,
                objectMapper,
                emailService,
                blacklistedEnvVariableHelper);

        // Create a spy of the real env manager
        envManager = Mockito.spy(realEnvManager);

        Mockito.when(organizationService.getCurrentUserOrganizationId()).thenReturn(Mono.just("org-id"));
        Mockito.when(blacklistedEnvVariableHelper.getBlacklistedEnvVariableForAppsmithCloud(eq("org-id")))
                .thenReturn(Set.of());
    }

    @Test
    public void simpleSample() {
        final String content =
                "APPSMITH_DB_URL='first value'\nAPPSMITH_REDIS_URL='second value'\n\nAPPSMITH_INSTANCE_NAME='third value'";

        StepVerifier.create(envManager.transformEnvContent(content, Map.of("APPSMITH_DB_URL", "new first value")))
                .assertNext(value -> {
                    assertThat(value)
                            .containsExactly(
                                    "APPSMITH_DB_URL='new first value'",
                                    "APPSMITH_REDIS_URL='second value'",
                                    "",
                                    "APPSMITH_INSTANCE_NAME='third value'");
                })
                .verifyComplete();

        StepVerifier.create(envManager.transformEnvContent(content, Map.of("APPSMITH_REDIS_URL", "new second value")))
                .assertNext(value -> {
                    assertThat(value)
                            .containsExactly(
                                    "APPSMITH_DB_URL='first value'",
                                    "APPSMITH_REDIS_URL='new second value'",
                                    "",
                                    "APPSMITH_INSTANCE_NAME='third value'");
                })
                .verifyComplete();

        StepVerifier.create(
                        envManager.transformEnvContent(content, Map.of("APPSMITH_INSTANCE_NAME", "new third value")))
                .assertNext(value -> {
                    assertThat(value)
                            .containsExactly(
                                    "APPSMITH_DB_URL='first value'",
                                    "APPSMITH_REDIS_URL='second value'",
                                    "",
                                    "APPSMITH_INSTANCE_NAME='new third value'");
                })
                .verifyComplete();

        StepVerifier.create(envManager.transformEnvContent(
                        content,
                        Map.of(
                                "APPSMITH_DB_URL", "new first value",
                                "APPSMITH_INSTANCE_NAME", "new third value")))
                .assertNext(value -> {
                    assertThat(value)
                            .containsExactly(
                                    "APPSMITH_DB_URL='new first value'",
                                    "APPSMITH_REDIS_URL='second value'",
                                    "",
                                    "APPSMITH_INSTANCE_NAME='new third value'");
                })
                .verifyComplete();
    }

    @Test
    public void emptyValues() {
        final String content = "APPSMITH_DB_URL=first value\nAPPSMITH_REDIS_URL=\n\nAPPSMITH_INSTANCE_NAME=third value";

        StepVerifier.create(envManager.transformEnvContent(content, Map.of("APPSMITH_REDIS_URL", "new second value")))
                .assertNext(value -> {
                    assertThat(value)
                            .containsExactly(
                                    "APPSMITH_DB_URL=first value",
                                    "APPSMITH_REDIS_URL='new second value'",
                                    "",
                                    "APPSMITH_INSTANCE_NAME=third value");
                })
                .verifyComplete();

        StepVerifier.create(envManager.transformEnvContent(content, Map.of("APPSMITH_REDIS_URL", "")))
                .assertNext(value -> {
                    assertThat(value)
                            .containsExactly(
                                    "APPSMITH_DB_URL=first value",
                                    "APPSMITH_REDIS_URL=",
                                    "",
                                    "APPSMITH_INSTANCE_NAME=third value");
                })
                .verifyComplete();
    }

    @Test
    public void quotedValues() {
        final String content =
                "APPSMITH_DB_URL='first value'\nAPPSMITH_REDIS_URL=\"quoted value\"\n\nAPPSMITH_INSTANCE_NAME='third value'";

        StepVerifier.create(envManager.transformEnvContent(
                        content,
                        Map.of(
                                "APPSMITH_DB_URL", "new first value",
                                "APPSMITH_REDIS_URL", "new second value")))
                .assertNext(value -> {
                    assertThat(value)
                            .containsExactly(
                                    "APPSMITH_DB_URL='new first value'",
                                    "APPSMITH_REDIS_URL='new second value'",
                                    "",
                                    "APPSMITH_INSTANCE_NAME='third value'");
                })
                .verifyComplete();

        StepVerifier.create(envManager.transformEnvContent(content, Map.of("APPSMITH_REDIS_URL", "")))
                .assertNext(value -> {
                    assertThat(value)
                            .containsExactly(
                                    "APPSMITH_DB_URL='first value'",
                                    "APPSMITH_REDIS_URL=",
                                    "",
                                    "APPSMITH_INSTANCE_NAME='third value'");
                })
                .verifyComplete();

        StepVerifier.create(envManager.transformEnvContent(
                        content,
                        Map.of(
                                "APPSMITH_INSTANCE_NAME", "Sponge-bob's Instance",
                                "APPSMITH_REDIS_URL", "value with \" char in it")))
                .assertNext(value -> {
                    assertThat(value)
                            .containsExactly(
                                    "APPSMITH_DB_URL='first value'",
                                    "APPSMITH_REDIS_URL='value with \" char in it'",
                                    "",
                                    "APPSMITH_INSTANCE_NAME='Sponge-bob'\"'\"'s Instance'");
                })
                .verifyComplete();
    }

    @Test
    public void parseEmptyValues() {

        assertThat(envManager.parseToMap(
                        "APPSMITH_DB_URL='first value'\nAPPSMITH_REDIS_URL=\n\nAPPSMITH_INSTANCE_NAME='third value'"))
                .containsExactlyInAnyOrderEntriesOf(Map.of(
                        "APPSMITH_DB_URL", "first value",
                        "APPSMITH_REDIS_URL", "",
                        "APPSMITH_INSTANCE_NAME", "third value"));
    }

    @Test
    public void parseQuotedValues() {

        assertThat(
                        envManager.parseToMap(
                                "APPSMITH_DB_URL=first\nAPPSMITH_REDIS_URL=\"quoted value\"\n\nAPPSMITH_INSTANCE_NAME='third value'"))
                .containsExactlyInAnyOrderEntriesOf(Map.of(
                        "APPSMITH_DB_URL", "first",
                        "APPSMITH_REDIS_URL", "quoted value",
                        "APPSMITH_INSTANCE_NAME", "third value"));

        assertThat(envManager.parseToMap("APPSMITH_INSTANCE_NAME=\"Sponge-bob's Instance\""))
                .containsExactlyInAnyOrderEntriesOf(Map.of("APPSMITH_INSTANCE_NAME", "Sponge-bob's Instance"));
    }

    @Test
    public void parseTestWithEscapes() {
        assertThat(envManager.parseToMap(
                        "APPSMITH_ALLOWED_FRAME_ANCESTORS=\"'\"'none'\"'\"\nAPPSMITH_REDIS_URL='second\" value'\n"))
                .containsExactlyInAnyOrderEntriesOf(Map.of(
                        "APPSMITH_ALLOWED_FRAME_ANCESTORS", "'none'",
                        "APPSMITH_REDIS_URL", "second\" value"));
    }

    @Test
    public void disallowedVariable() {
        final String content =
                "APPSMITH_DB_URL=first value\nDISALLOWED_NASTY_STUFF=\"quoted value\"\n\nAPPSMITH_INSTANCE_NAME=third value";

        StepVerifier.create(envManager.transformEnvContent(
                        content,
                        Map.of(
                                "APPSMITH_DB_URL", "new first value",
                                "DISALLOWED_NASTY_STUFF", "new second value")))
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && ((AppsmithException) throwable).getError().equals(AppsmithError.GENERIC_BAD_REQUEST))
                .verify();
    }

    @Test
    public void addNewVariable() {
        final String content =
                "APPSMITH_DB_URL='first value'\nAPPSMITH_REDIS_URL='quoted value'\n\nAPPSMITH_INSTANCE_NAME='third value'";

        StepVerifier.create(envManager.transformEnvContent(
                        content,
                        Map.of(
                                "APPSMITH_DB_URL", "new first value",
                                "APPSMITH_DISABLE_TELEMETRY", "false")))
                .assertNext(value -> {
                    assertThat(value)
                            .containsExactly(
                                    "APPSMITH_DB_URL='new first value'",
                                    "APPSMITH_REDIS_URL='quoted value'",
                                    "",
                                    "APPSMITH_INSTANCE_NAME='third value'",
                                    "APPSMITH_DISABLE_TELEMETRY=false");
                })
                .verifyComplete();
    }

    @Test
    public void setValueWithQuotes() {
        final String content =
                "APPSMITH_DB_URL='first value'\nAPPSMITH_REDIS_URL='quoted value'\n\nAPPSMITH_INSTANCE_NAME='third value'";

        StepVerifier.create(envManager.transformEnvContent(
                        content,
                        Map.of(
                                "APPSMITH_DB_URL", "'just quotes'",
                                "APPSMITH_DISABLE_TELEMETRY", "some quotes 'inside' it")))
                .assertNext(value -> {
                    assertThat(value)
                            .containsExactly(
                                    "APPSMITH_DB_URL=\"'\"'just quotes'\"'\"",
                                    "APPSMITH_REDIS_URL='quoted value'",
                                    "",
                                    "APPSMITH_INSTANCE_NAME='third value'",
                                    "APPSMITH_DISABLE_TELEMETRY='some quotes '\"'\"'inside'\"'\"' it'");
                })
                .verifyComplete();
    }

    @Test
    public void unsafeShellValuesAreQuoted() {
        final String content = "APPSMITH_DISABLE_TELEMETRY=false";

        StepVerifier.create(envManager.transformEnvContent(
                        content, Map.of("APPSMITH_DISABLE_TELEMETRY", "$(touch${IFS}/tmp/pwned)")))
                .assertNext(value ->
                        assertThat(value).containsExactly("APPSMITH_DISABLE_TELEMETRY='$(touch${IFS}/tmp/pwned)'"))
                .verifyComplete();
    }

    @Test
    public void controlCharactersInValuesAreRejected() {
        final String content = "APPSMITH_DISABLE_TELEMETRY=false";

        StepVerifier.create(envManager.transformEnvContent(
                        content,
                        Map.of("APPSMITH_DISABLE_TELEMETRY", "false\nAPPSMITH_JAVA_ARGS=$(touch${IFS}/tmp/pwned)")))
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && ((AppsmithException) throwable).getError().equals(AppsmithError.INVALID_PARAMETER))
                .verify();
    }

    @Test
    public void sendTestEmail_WhenUserNotSuperUser_ThrowsException() {
        User user = new User();
        user.setEmail("sample-super-user");
        Mockito.when(sessionUserService.getCurrentUser()).thenReturn(Mono.just(user));
        Mockito.when(userService.findByEmail(user.getEmail())).thenReturn(Mono.just(user));
        Mockito.when(userUtils.isCurrentUserSuperUser()).thenReturn(Mono.just(false));

        StepVerifier.create(envManager.sendTestEmail(null))
                .expectErrorMessage(AppsmithError.UNAUTHORIZED_ACCESS.getMessage())
                .verify();
    }

    private void mockSuperUser() {
        User user = new User();
        user.setEmail("admin@appsmith.com");
        Mockito.when(userUtils.isCurrentUserSuperUser()).thenReturn(Mono.just(true));
        Mockito.when(sessionUserService.getCurrentUser()).thenReturn(Mono.just(user));
    }

    private TestEmailConfigRequestDTO buildDto(String smtpHost) {
        return buildDto(smtpHost, 25);
    }

    private TestEmailConfigRequestDTO buildDto(String smtpHost, int port) {
        TestEmailConfigRequestDTO dto = new TestEmailConfigRequestDTO();
        dto.setSmtpHost(smtpHost);
        dto.setSmtpPort(port);
        dto.setFromEmail("test@appsmith.com");
        dto.setStarttlsEnabled(false);
        return dto;
    }

    @ParameterizedTest
    @ValueSource(strings = {"127.0.0.1", "169.254.169.254", "localhost"})
    public void sendTestEmail_WhenBlockedHost_ThrowsException(String host) {
        // Surefire bypasses the SSRF filter JVM-wide (see root pom) for the benefit of tests that
        // use MockWebServer / Testcontainers on loopback. This test explicitly verifies the
        // filter, so re-enable it for the test body.
        RestrictedHostFilter.setSsrfFilterDisabledForTesting(false);
        try {
            mockSuperUser();

            StepVerifier.create(envManager.sendTestEmail(buildDto(host)))
                    .expectErrorSatisfies(e -> {
                        assertThat(e).isInstanceOf(AppsmithException.class);
                        assertThat(e.getMessage()).contains("Invalid SMTP configuration");
                    })
                    .verify();
        } finally {
            RestrictedHostFilter.resetSsrfFilterDisabledForTesting();
        }
    }

    @ParameterizedTest
    @ValueSource(ints = {80, 443, 6379, 8080, 27017, 0, -1})
    public void sendTestEmail_WhenDisallowedPort_ThrowsException(int port) {
        mockSuperUser();

        StepVerifier.create(envManager.sendTestEmail(buildDto("smtp.gmail.com", port)))
                .expectErrorSatisfies(e -> {
                    assertThat(e).isInstanceOf(AppsmithException.class);
                    assertThat(e.getMessage()).contains("Invalid SMTP configuration");
                })
                .verify();
    }

    @Test
    public void buildMailSender_UsesHostnameForTls_NotResolvedIp() throws Exception {
        TestEmailConfigRequestDTO dto = buildDto("smtp.example.com", 587);
        dto.setStarttlsEnabled(true);
        InetAddress resolved = InetAddress.getByAddress("smtp.example.com", new byte[] {(byte) 192, 0, 2, 10});

        JavaMailSenderImpl sender = EnvManagerCEImpl.buildMailSender(dto, resolved);

        // TLS SNI + certificate identity checks run against the sender host, so it must be the
        // hostname the user entered — connecting by IP fails with
        // "No subject alternative names matching IP address" (APP-15713).
        assertThat(sender.getHost()).isEqualTo("smtp.example.com");
        Properties props = sender.getJavaMailProperties();
        assertThat(props.getProperty("mail.smtp.starttls.enable")).isEqualTo("true");
        assertThat(props.get("mail.smtp.socketFactory")).isInstanceOf(SocketFactory.class);
        assertThat(props.getProperty("mail.smtp.socketFactory.fallback")).isEqualTo("false");
        assertThat(props.getProperty("mail.smtp.ssl.checkserveridentity")).isEqualTo("true");
        assertThat(props.get("mail.smtp.connectiontimeout")).isNotNull();
    }

    @Test
    public void buildMailSender_Port465_EnablesImplicitSslWithHostname() throws Exception {
        TestEmailConfigRequestDTO dto = buildDto("smtp.example.com", 465);
        InetAddress resolved = InetAddress.getByAddress("smtp.example.com", new byte[] {(byte) 192, 0, 2, 10});

        JavaMailSenderImpl sender = EnvManagerCEImpl.buildMailSender(dto, resolved);

        assertThat(sender.getHost()).isEqualTo("smtp.example.com");
        Properties props = sender.getJavaMailProperties();
        assertThat(props.getProperty("mail.smtp.ssl.enable")).isEqualTo("true");
        assertThat(props.getProperty("mail.smtp.starttls.enable")).isEqualTo("false");
    }

    @Test
    public void buildMailSender_StarttlsDisabled_KeepsPlaintextProps() throws Exception {
        TestEmailConfigRequestDTO dto = buildDto("smtp.example.com", 587);
        InetAddress resolved = InetAddress.getByAddress("smtp.example.com", new byte[] {(byte) 192, 0, 2, 10});

        JavaMailSenderImpl sender = EnvManagerCEImpl.buildMailSender(dto, resolved);

        Properties props = sender.getJavaMailProperties();
        assertThat(props.getProperty("mail.smtp.starttls.enable")).isEqualTo("false");
        assertThat(props.getProperty("mail.smtp.ssl.enable")).isNull();
    }

    @Test
    public void buildMailSender_AuthProps_FollowUsernamePresence() throws Exception {
        InetAddress resolved = InetAddress.getByAddress("smtp.example.com", new byte[] {(byte) 192, 0, 2, 10});

        TestEmailConfigRequestDTO withAuth = buildDto("smtp.example.com", 587);
        withAuth.setUsername("mailer");
        withAuth.setPassword("secret");
        JavaMailSenderImpl authSender = EnvManagerCEImpl.buildMailSender(withAuth, resolved);
        assertThat(authSender.getJavaMailProperties().getProperty("mail.smtp.auth"))
                .isEqualTo("true");
        assertThat(authSender.getUsername()).isEqualTo("mailer");
        assertThat(authSender.getPassword()).isEqualTo("secret");

        TestEmailConfigRequestDTO noAuth = buildDto("smtp.example.com", 587);
        JavaMailSenderImpl noAuthSender = EnvManagerCEImpl.buildMailSender(noAuth, resolved);
        assertThat(noAuthSender.getJavaMailProperties().getProperty("mail.smtp.auth"))
                .isEqualTo("false");
        assertThat(noAuthSender.getUsername()).isNull();
    }

    @Test
    public void buildMailSender_SocketFactory_ConnectsToValidatedAddressNotEndpoint() throws Exception {
        // The SSRF fix must keep connecting to the address RestrictedHostFilter validated, even
        // though the sender host is now the hostname. JavaMail asks the socket factory for an
        // unconnected socket and then connects it to (host, port) itself — mimic that here, with
        // an endpoint pointing at an unroutable TEST-NET address. The pinned socket must ignore
        // it and reach the validated (loopback) listener instead.
        try (ServerSocket server = new ServerSocket(0, 1, InetAddress.getLoopbackAddress())) {
            TestEmailConfigRequestDTO dto = buildDto("smtp.example.com", 587);
            dto.setStarttlsEnabled(true);

            JavaMailSenderImpl sender = EnvManagerCEImpl.buildMailSender(dto, InetAddress.getLoopbackAddress());
            SocketFactory factory =
                    (SocketFactory) sender.getJavaMailProperties().get("mail.smtp.socketFactory");

            try (Socket socket = factory.createSocket()) {
                socket.connect(new InetSocketAddress("192.0.2.1", server.getLocalPort()), 2000);
                assertThat(socket.getInetAddress().isLoopbackAddress()).isTrue();
            }
            server.accept().close(); // drain the backlog before the next connect

            // The pre-connected overloads must pin the same way.
            try (Socket socket = factory.createSocket("192.0.2.1", server.getLocalPort())) {
                assertThat(socket.getInetAddress().isLoopbackAddress()).isTrue();
            }
        }
    }

    @Test
    public void setEnv_AndGetAll() {
        // Create a test map of environment variables
        Map<String, String> envs = new HashMap<>();
        envs.put("APPSMITH_DB_URL", "mongo-url");
        envs.put("APPSMITH_DISABLE_TELEMETRY", "");

        // Mock the getAll method on the spy to return our test environment variables
        Mockito.doReturn(Mono.just(envs)).when(envManager).getAll();

        // Test the getAllNonEmpty method (which filters out empty values)
        StepVerifier.create(envManager.getAllNonEmpty())
                .assertNext(map -> {
                    assertThat(map).hasSize(1);
                    assertThat(map).containsKey("APPSMITH_DB_URL");
                    assertThat(map).containsValue("mongo-url");
                    assertThat(map).doesNotContainKey("APPSMITH_DISABLE_TELEMETRY");
                })
                .verifyComplete();
    }

    @Test
    public void getAllNonEmpty_WithMultipleVariables_FiltersEmptyOnes() {
        // Create a test map with multiple environment variables
        Map<String, String> envs = new HashMap<>();
        envs.put("APPSMITH_DB_URL", "mongo-url");
        envs.put("APPSMITH_DISABLE_TELEMETRY", "");
        envs.put("APPSMITH_INSTANCE_NAME", "test-instance");
        envs.put("APPSMITH_ADMIN_EMAILS", "");
        envs.put("APPSMITH_MAIL_HOST", "smtp.example.com");

        // Mock the getAll method on the spy to return our test environment variables
        Mockito.doReturn(Mono.just(envs)).when(envManager).getAll();

        // Test the getAllNonEmpty method (which filters out empty values)
        StepVerifier.create(envManager.getAllNonEmpty())
                .assertNext(map -> {
                    assertThat(map).hasSize(3);
                    assertThat(map).containsEntry("APPSMITH_DB_URL", "mongo-url");
                    assertThat(map).containsEntry("APPSMITH_INSTANCE_NAME", "test-instance");
                    assertThat(map).containsEntry("APPSMITH_MAIL_HOST", "smtp.example.com");
                    assertThat(map).doesNotContainKey("APPSMITH_DISABLE_TELEMETRY");
                    assertThat(map).doesNotContainKey("APPSMITH_ADMIN_EMAILS");
                })
                .verifyComplete();
    }
}
