package com.appsmith.server.solutions;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.configurations.EmailConfig;
import com.appsmith.server.configurations.GoogleRecaptchaConfig;
import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.FileUtils;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.notifications.EmailSender;
import com.appsmith.server.repositories.cakes.UserRepositoryCake;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.AssetService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.EmailService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@ExtendWith(SpringExtension.class)
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_CLASS)
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
    private UserRepositoryCake userRepository;

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
    private AssetService assetService;

    @MockBean
    private EmailService emailService;

    @BeforeEach
    public void setup() {
        envManager = new EnvManagerImpl(
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
                emailService);
    }

    @Test
    public void simpleSample() {
        final String content =
                "APPSMITH_DB_URL='first value'\nAPPSMITH_REDIS_URL='second value'\n\nAPPSMITH_INSTANCE_NAME='third value'";

        assertThat(envManager.transformEnvContent(content, Map.of("APPSMITH_DB_URL", "new first value")))
                .containsExactly(
                        "APPSMITH_DB_URL='new first value'",
                        "APPSMITH_REDIS_URL='second value'",
                        "",
                        "APPSMITH_INSTANCE_NAME='third value'");

        assertThat(envManager.transformEnvContent(content, Map.of("APPSMITH_REDIS_URL", "new second value")))
                .containsExactly(
                        "APPSMITH_DB_URL='first value'",
                        "APPSMITH_REDIS_URL='new second value'",
                        "",
                        "APPSMITH_INSTANCE_NAME='third value'");

        assertThat(envManager.transformEnvContent(content, Map.of("APPSMITH_INSTANCE_NAME", "new third value")))
                .containsExactly(
                        "APPSMITH_DB_URL='first value'",
                        "APPSMITH_REDIS_URL='second value'",
                        "",
                        "APPSMITH_INSTANCE_NAME='new third value'");

        assertThat(envManager.transformEnvContent(
                        content,
                        Map.of(
                                "APPSMITH_DB_URL", "new first value",
                                "APPSMITH_INSTANCE_NAME", "new third value")))
                .containsExactly(
                        "APPSMITH_DB_URL='new first value'",
                        "APPSMITH_REDIS_URL='second value'",
                        "",
                        "APPSMITH_INSTANCE_NAME='new third value'");
    }

    @Test
    public void emptyValues() {
        final String content = "APPSMITH_DB_URL=first value\nAPPSMITH_REDIS_URL=\n\nAPPSMITH_INSTANCE_NAME=third value";

        assertThat(envManager.transformEnvContent(content, Map.of("APPSMITH_REDIS_URL", "new second value")))
                .containsExactly(
                        "APPSMITH_DB_URL=first value",
                        "APPSMITH_REDIS_URL='new second value'",
                        "",
                        "APPSMITH_INSTANCE_NAME=third value");

        assertThat(envManager.transformEnvContent(content, Map.of("APPSMITH_REDIS_URL", "")))
                .containsExactly(
                        "APPSMITH_DB_URL=first value", "APPSMITH_REDIS_URL=", "", "APPSMITH_INSTANCE_NAME=third value");
    }

    @Test
    public void quotedValues() {
        final String content =
                "APPSMITH_DB_URL='first value'\nAPPSMITH_REDIS_URL=\"quoted value\"\n\nAPPSMITH_INSTANCE_NAME='third value'";

        assertThat(envManager.transformEnvContent(
                        content,
                        Map.of(
                                "APPSMITH_DB_URL", "new first value",
                                "APPSMITH_REDIS_URL", "new second value")))
                .containsExactly(
                        "APPSMITH_DB_URL='new first value'",
                        "APPSMITH_REDIS_URL='new second value'",
                        "",
                        "APPSMITH_INSTANCE_NAME='third value'");

        assertThat(envManager.transformEnvContent(content, Map.of("APPSMITH_REDIS_URL", "")))
                .containsExactly(
                        "APPSMITH_DB_URL='first value'",
                        "APPSMITH_REDIS_URL=",
                        "",
                        "APPSMITH_INSTANCE_NAME='third value'");

        assertThat(envManager.transformEnvContent(
                        content,
                        Map.of(
                                "APPSMITH_INSTANCE_NAME", "Sponge-bob's Instance",
                                "APPSMITH_REDIS_URL", "value with \" char in it")))
                .containsExactly(
                        "APPSMITH_DB_URL='first value'",
                        "APPSMITH_REDIS_URL='value with \" char in it'",
                        "",
                        "APPSMITH_INSTANCE_NAME='Sponge-bob'\"'\"'s Instance'");
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

        assertThatThrownBy(() -> envManager.transformEnvContent(
                        content,
                        Map.of(
                                "APPSMITH_DB_URL", "new first value",
                                "DISALLOWED_NASTY_STUFF", "new second value")))
                .matches(value -> value instanceof AppsmithException
                        && AppsmithError.GENERIC_BAD_REQUEST.equals(((AppsmithException) value).getError()));
    }

    @Test
    public void addNewVariable() {
        final String content =
                "APPSMITH_DB_URL='first value'\nAPPSMITH_REDIS_URL='quoted value'\n\nAPPSMITH_INSTANCE_NAME='third value'";

        assertThat(envManager.transformEnvContent(
                        content,
                        Map.of(
                                "APPSMITH_DB_URL", "new first value",
                                "APPSMITH_DISABLE_TELEMETRY", "false")))
                .containsExactly(
                        "APPSMITH_DB_URL='new first value'",
                        "APPSMITH_REDIS_URL='quoted value'",
                        "",
                        "APPSMITH_INSTANCE_NAME='third value'",
                        "APPSMITH_DISABLE_TELEMETRY=false");
    }

    @Test
    public void setValueWithQuotes() {
        final String content =
                "APPSMITH_DB_URL='first value'\nAPPSMITH_REDIS_URL='quoted value'\n\nAPPSMITH_INSTANCE_NAME='third value'";

        assertThat(envManager.transformEnvContent(
                        content,
                        Map.of(
                                "APPSMITH_DB_URL", "'just quotes'",
                                "APPSMITH_DISABLE_TELEMETRY", "some quotes 'inside' it")))
                .containsExactly(
                        "APPSMITH_DB_URL=\"'\"'just quotes'\"'\"",
                        "APPSMITH_REDIS_URL='quoted value'",
                        "",
                        "APPSMITH_INSTANCE_NAME='third value'",
                        "APPSMITH_DISABLE_TELEMETRY='some quotes '\"'\"'inside'\"'\"' it'");
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

    @Test
    public void setEnv_AndGetAll() {
        EnvManager envManagerInner = Mockito.mock(EnvManagerImpl.class);

        Map<String, String> envs = new HashMap<>();
        envs.put("APPSMITH_DB_URL", "mongo-url");
        envs.put("APPSMITH_DISABLE_TELEMETRY", "");

        Mockito.when(envManagerInner.getAll()).thenReturn(Mono.just(envs));
        Mockito.when(envManagerInner.getAllNonEmpty()).thenCallRealMethod();

        Mono<Map<String, String>> envMono = envManagerInner.getAllNonEmpty();

        StepVerifier.create(envMono)
                .assertNext(map -> {
                    assertThat(map).hasSize(1);
                    assertThat(map.containsKey("APPSMITH_DISABLE_TELEMETRY")).isFalse();
                })
                .verifyComplete();
    }
}
