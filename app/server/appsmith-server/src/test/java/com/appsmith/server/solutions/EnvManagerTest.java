package com.appsmith.server.solutions;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.configurations.EmailConfig;
import com.appsmith.server.configurations.GoogleRecaptchaConfig;
import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.FileUtils;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.notifications.EmailSender;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserService;
import lombok.extern.slf4j.Slf4j;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.File;
import java.io.IOException;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;

@RunWith(SpringRunner.class)
@Slf4j
public class EnvManagerTest {
    @MockBean
    private SessionUserService sessionUserService;
    @MockBean
    private UserService userService;
    @MockBean
    private PolicyUtils policyUtils;
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

    private EnvManager envManager;

    @Before
    public void setUp() {
        envManager = new EnvManager(
                sessionUserService, userService, policyUtils, emailSender,
                commonConfig, emailConfig, javaMailSender, googleRecaptchaConfig, fileUtils
        );
    }

    @Test
    public void simpleSample() {
        final String content = "APPSMITH_MONGODB_URI=first value\nAPPSMITH_REDIS_URL=second value\n\nAPPSMITH_INSTANCE_NAME=third value";

        assertThat(EnvManager.transformEnvContent(
                content,
                Map.of("APPSMITH_MONGODB_URI", "new first value")
        )).containsExactly(
                "APPSMITH_MONGODB_URI=new first value",
                "APPSMITH_REDIS_URL=second value",
                "",
                "APPSMITH_INSTANCE_NAME=third value"
        );

        assertThat(EnvManager.transformEnvContent(
                content,
                Map.of("APPSMITH_REDIS_URL", "new second value")
        )).containsExactly(
                "APPSMITH_MONGODB_URI=first value",
                "APPSMITH_REDIS_URL=new second value",
                "",
                "APPSMITH_INSTANCE_NAME=third value"
        );

        assertThat(EnvManager.transformEnvContent(
                content,
                Map.of("APPSMITH_INSTANCE_NAME", "new third value")
        )).containsExactly(
                "APPSMITH_MONGODB_URI=first value",
                "APPSMITH_REDIS_URL=second value",
                "",
                "APPSMITH_INSTANCE_NAME=new third value"
        );

        assertThat(EnvManager.transformEnvContent(
                content,
                Map.of(
                        "APPSMITH_MONGODB_URI", "new first value",
                        "APPSMITH_INSTANCE_NAME", "new third value"
                )
        )).containsExactly(
                "APPSMITH_MONGODB_URI=new first value",
                "APPSMITH_REDIS_URL=second value",
                "",
                "APPSMITH_INSTANCE_NAME=new third value"
        );

    }

    @Test
    public void emptyValues() {
        final String content = "APPSMITH_MONGODB_URI=first value\nAPPSMITH_REDIS_URL=\n\nAPPSMITH_INSTANCE_NAME=third value";

        assertThat(EnvManager.transformEnvContent(
                content,
                Map.of("APPSMITH_REDIS_URL", "new second value")
        )).containsExactly(
                "APPSMITH_MONGODB_URI=first value",
                "APPSMITH_REDIS_URL=new second value",
                "",
                "APPSMITH_INSTANCE_NAME=third value"
        );

        assertThat(EnvManager.transformEnvContent(
                content,
                Map.of("APPSMITH_REDIS_URL", "")
        )).containsExactly(
                "APPSMITH_MONGODB_URI=first value",
                "APPSMITH_REDIS_URL=",
                "",
                "APPSMITH_INSTANCE_NAME=third value"
        );

    }

    @Test
    public void quotedValues() {
        final String content = "APPSMITH_MONGODB_URI=first value\nAPPSMITH_REDIS_URL=\"quoted value\"\n\nAPPSMITH_INSTANCE_NAME=third value";

        assertThat(EnvManager.transformEnvContent(
                content,
                Map.of(
                        "APPSMITH_MONGODB_URI", "new first value",
                        "APPSMITH_REDIS_URL", "new second value"
                )
        )).containsExactly(
                "APPSMITH_MONGODB_URI=new first value",
                "APPSMITH_REDIS_URL=\"new second value\"",
                "",
                "APPSMITH_INSTANCE_NAME=third value"
        );

        assertThat(EnvManager.transformEnvContent(
                content,
                Map.of("APPSMITH_REDIS_URL", "")
        )).containsExactly(
                "APPSMITH_MONGODB_URI=first value",
                "APPSMITH_REDIS_URL=\"\"",
                "",
                "APPSMITH_INSTANCE_NAME=third value"
        );

    }

    public void parseTest() {

        assertThat(EnvManager.parseToMap(
                "APPSMITH_MONGODB_URI=first value\nAPPSMITH_REDIS_URL=second value\n\nAPPSMITH_INSTANCE_NAME=third value"
        )).containsExactlyInAnyOrderEntriesOf(Map.of(
                "APPSMITH_MONGODB_URI", "first value",
                "APPSMITH_REDIS_URL", "second value",
                "APPSMITH_INSTANCE_NAME", "third value"
        ));

    }

    @Test
    public void parseEmptyValues() {

        assertThat(EnvManager.parseToMap(
                "APPSMITH_MONGODB_URI=first value\nAPPSMITH_REDIS_URL=\n\nAPPSMITH_INSTANCE_NAME=third value"
        )).containsExactlyInAnyOrderEntriesOf(Map.of(
                "APPSMITH_MONGODB_URI", "first value",
                "APPSMITH_REDIS_URL", "",
                "APPSMITH_INSTANCE_NAME", "third value"
        ));

    }

    @Test
    public void parseQuotedValues() {

        assertThat(EnvManager.parseToMap(
                "APPSMITH_MONGODB_URI=first value\nAPPSMITH_REDIS_URL=\"quoted value\"\n\nAPPSMITH_INSTANCE_NAME=third value"
        )).containsExactlyInAnyOrderEntriesOf(Map.of(
                "APPSMITH_MONGODB_URI", "first value",
                "APPSMITH_REDIS_URL", "quoted value",
                "APPSMITH_INSTANCE_NAME", "third value"
        ));

    }

    @Test
    public void disallowedVariable() {
        final String content = "APPSMITH_MONGODB_URI=first value\nDISALLOWED_NASTY_STUFF=\"quoted value\"\n\nAPPSMITH_INSTANCE_NAME=third value";

        assertThatThrownBy(() -> EnvManager.transformEnvContent(
                content,
                Map.of(
                        "APPSMITH_MONGODB_URI", "new first value",
                        "DISALLOWED_NASTY_STUFF", "new second value"
                )
        ))
                .matches(value -> value instanceof AppsmithException
                        && AppsmithError.UNAUTHORIZED_ACCESS.equals(((AppsmithException) value).getError()));
    }

    @Test
    public void addNewVariable() {
        final String content = "APPSMITH_MONGODB_URI=first value\nAPPSMITH_REDIS_URL=\"quoted value\"\n\nAPPSMITH_INSTANCE_NAME=third value";

        assertThat(EnvManager.transformEnvContent(
                content,
                Map.of(
                        "APPSMITH_MONGODB_URI", "new first value",
                        "APPSMITH_ENABLE_TELEMETRY", "true"
                )
        )).containsExactly(
                "APPSMITH_MONGODB_URI=new first value",
                "APPSMITH_REDIS_URL=\"quoted value\"",
                "",
                "APPSMITH_INSTANCE_NAME=third value",
                "APPSMITH_ENABLE_TELEMETRY=true"
        );
    }

    @Test
    public void download_UserIsNotSuperUser_ThrowsAccessDenied() {
        User user = new User();
        user.setEmail("sample-super-user");
        Mockito.when(sessionUserService.getCurrentUser()).thenReturn(Mono.just(user));
        Mockito.when(userService.findByEmail(user.getEmail())).thenReturn(Mono.just(user));
        Mockito.when(policyUtils.isPermissionPresentForUser(
                user.getPolicies(), AclPermission.MANAGE_INSTANCE_ENV.getValue(), user.getEmail())
        ).thenReturn(false);

        ServerWebExchange exchange = Mockito.mock(ServerWebExchange.class);
        ServerHttpResponse response = Mockito.mock(ServerHttpResponse.class);
        HttpHeaders headers = new HttpHeaders();

        StepVerifier.create(envManager.download(exchange))
                .expectErrorMessage(AppsmithError.UNAUTHORIZED_ACCESS.getMessage())
                .verify();
    }

    @Test
    public void download_UserIsSuperUser_ReturnsZip() throws IOException {
        User user = new User();
        user.setEmail("sample-super-user");
        Mockito.when(sessionUserService.getCurrentUser()).thenReturn(Mono.just(user));
        Mockito.when(userService.findByEmail(user.getEmail())).thenReturn(Mono.just(user));
        Mockito.when(policyUtils.isPermissionPresentForUser(
                user.getPolicies(), AclPermission.MANAGE_INSTANCE_ENV.getValue(), user.getEmail())
        ).thenReturn(true);

        // create a temp file for docker env
        File file = File.createTempFile( "envmanager-test-docker-file", "env");
        file.deleteOnExit();

        Mockito.when(commonConfig.getEnvFilePath()).thenReturn(file.getAbsolutePath());
        Mockito.when(fileUtils.createZip(any())).thenReturn(new byte[1024]);

        ServerWebExchange exchange = Mockito.mock(ServerWebExchange.class);
        ServerHttpResponse response = Mockito.mock(ServerHttpResponse.class);
        HttpHeaders headers = new HttpHeaders();
        Mockito.when(response.getHeaders()).thenReturn(headers);
        Mockito.when(exchange.getResponse()).thenReturn(response);
        Mockito.when(response.writeWith(any())).thenReturn(Mono.empty());

        StepVerifier.create(envManager.download(exchange))
                .verifyComplete();

        assertThat(headers.getContentType().toString()).isEqualTo("application/zip");
        assertThat(headers.getContentDisposition().toString()).containsIgnoringCase("appsmith-config.zip");
    }
}
