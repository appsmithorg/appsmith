package com.appsmith.server.services;

import com.appsmith.external.services.EncryptionService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.solutions.DatasourcePermission;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static com.appsmith.server.acl.AclPermission.READ_WORKSPACES;
import static com.appsmith.server.constants.ce.FieldNameCE.APPLICATION;
import static com.appsmith.server.constants.ce.FieldNameCE.DEVELOPER;
import static com.appsmith.server.constants.ce.FieldNameCE.VIEWER;
import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
public class EmailServiceTest {


    @Autowired
    UserService userService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    EmailService emailService;

    @Autowired
    PermissionGroupRepository permissionGroupRepository;

    @Autowired
    PermissionGroupService permissionGroupService;

    private static String workspaceId;
    private static Application app;
    private static String workspaceName = "EmailServiceTest";


    @BeforeEach
    @WithUserDetails(value = "api_user")
    public void setup() {
        User apiUser = userService.findByEmail("api_user").block();
        Workspace toCreate = new Workspace();
        toCreate.setName("EmailServiceTest");

        if (!StringUtils.hasLength(workspaceId)) {
            Workspace workspace = workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
            workspaceId = workspace.getId();
        }
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void checkWorkspaceInviteEmailForNewUser() {
        Workspace workspace = new Workspace();
        workspace.setName("UserServiceTest Update Org");
        workspace.setId(UUID.randomUUID().toString());

        User inviter = new User();
        inviter.setName("inviterUserToApplication");
        inviter.setEmail("inviter@testuser.com");

        User invitee = new User();
        invitee.setEmail("invitee@testuser.com");

        String originHeader = "http://localhost:8080";
        String signupInviteUrl = String.format(
                "%s/user/signup?email=%s",
                originHeader,
                URLEncoder.encode(invitee.getUsername().toLowerCase(), StandardCharsets.UTF_8)
        );

        PermissionGroup permissionGroup = permissionGroupRepository.findByDefaultDomainIdAndDefaultDomainType(workspaceId, Workspace.class.getSimpleName())
                .filter(pg -> pg.getName().startsWith(DEVELOPER))
                .blockFirst();

        assertThat(permissionGroup).isNotNull();
        Mono<Map<String, String>> paramsMono = emailService.sendWorkspaceEmail(originHeader, workspace, inviter,
                permissionGroup.getName(), invitee, true);

        StepVerifier.create(paramsMono)
                .assertNext(params -> {
                    assertThat(params).isNotEmpty();
                    assertThat(params.get("role")).contains(DEVELOPER.toLowerCase());
                    assertThat(params.get("inviterFirstName")).isEqualTo("inviterUserToApplication");
                    assertThat(params.get("inviterWorkspaceName")).isEqualTo(workspace.getName());
                    assertThat(params.get("primaryLinkUrl")).isEqualTo( signupInviteUrl);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void checkWorkspaceInviteEmailForExistingUser() {
        Workspace workspace = new Workspace();
        workspace.setName("UserServiceTest Update Org");
        workspace.setId(UUID.randomUUID().toString());

        User inviter = new User();
        inviter.setName("inviterUserToApplication");
        inviter.setEmail("inviter@testuser.com");

        User invitee = new User();
        invitee.setEmail("invitee@testuser.com");

        String originHeader = "http://localhost:8080";

        PermissionGroup permissionGroup = permissionGroupRepository.findByDefaultDomainIdAndDefaultDomainType(workspaceId, Workspace.class.getSimpleName())
                .filter(pg -> pg.getName().startsWith(VIEWER))
                .blockFirst();

        assertThat(permissionGroup).isNotNull();
        Mono<Map<String, String>> paramsMono = emailService.sendWorkspaceEmail(originHeader, workspace, inviter,
                permissionGroup.getName(), invitee, false);

        StepVerifier.create(paramsMono)
                .assertNext(params -> {
                    assertThat(params).isNotEmpty();
                    assertThat(params.get("role")).contains(VIEWER.toLowerCase());
                    assertThat(params.get("inviterFirstName")).isEqualTo("inviterUserToApplication");
                    assertThat(params.get("inviterWorkspaceName")).isEqualTo(workspace.getName());
                    assertThat(params.get("primaryLinkUrl")).isEqualTo(originHeader + "/applications#" + workspace.getId());
                })
                .verifyComplete();
    }
}
