package com.appsmith.server.solutions.ce;

import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.InviteUsersDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.helpers.SecureBaseUrlResolver;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.UserAndAccessManagementService;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static com.appsmith.server.constants.FieldName.ADMINISTRATOR;
import static org.assertj.core.api.Assertions.assertThat;

/**
 * Tests that origin validation (APPSMITH_BASE_URL vs request Origin header) runs
 * BEFORE any user creation or permission-group assignment in the invite flow.
 *
 * <p>Uses {@code @SpyBean} on {@link SecureBaseUrlResolver} to simulate origin
 * mismatch without requiring a separate Spring context with custom property overrides.
 */
@SpringBootTest
@DirtiesContext
@ActiveProfiles("test")
@Slf4j
public class UserAndAccessManagementServiceOriginValidationTest {

    private static final String MISMATCHED_ORIGIN = "http://different-origin.example.com";

    @Autowired
    private UserAndAccessManagementService userAndAccessManagementService;

    @Autowired
    private WorkspaceService workspaceService;

    @Autowired
    private PermissionGroupRepository permissionGroupRepository;

    @Autowired
    private UserRepository userRepository;

    @MockBean
    private PluginExecutorHelper pluginExecutorHelper;

    @SpyBean
    private SecureBaseUrlResolver secureBaseUrlResolver;

    @BeforeEach
    public void setup() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));
    }

    /**
     * When the Origin header does not match APPSMITH_BASE_URL, the invite flow must
     * fail with a "Bad request" error AND must NOT persist the invited user in the
     * workspace's permission group. This test verifies the atomicity guarantee: no
     * side-effects on validation failure.
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void inviteUsers_originMismatch_shouldNotPersistUserInPermissionGroup() {
        String uniqueEmail = "invite-origin-test-" + UUID.randomUUID() + "@usertest.com";

        // Simulate origin mismatch: resolver rejects the mismatched origin
        Mockito.doReturn(Mono.error(new AppsmithException(
                        AppsmithError.GENERIC_BAD_REQUEST,
                        "Origin header does not match APPSMITH_BASE_URL configuration.")))
                .when(secureBaseUrlResolver)
                .resolveSecureBaseUrl(MISMATCHED_ORIGIN);

        Workspace toCreate = new Workspace();
        toCreate.setName("OriginValidationTest Workspace " + UUID.randomUUID());
        toCreate.setDomain("example.com");
        toCreate.setWebsite("https://example.com");

        Workspace workspace = workspaceService.create(toCreate).block();
        assertThat(workspace).isNotNull();

        List<PermissionGroup> permissionGroups = permissionGroupRepository
                .findAllById(workspace.getDefaultPermissionGroups())
                .collectList()
                .block();

        String adminPermissionGroupId = permissionGroups.stream()
                .filter(pg -> pg.getName().startsWith(ADMINISTRATOR))
                .findFirst()
                .orElseThrow()
                .getId();

        InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
        inviteUsersDTO.setUsernames(new ArrayList<>(List.of(uniqueEmail)));
        inviteUsersDTO.setPermissionGroupId(adminPermissionGroupId);

        // Act: invoke invite with a mismatched Origin header
        StepVerifier.create(userAndAccessManagementService.inviteUsers(inviteUsersDTO, MISMATCHED_ORIGIN))
                .expectErrorSatisfies(error -> {
                    assertThat(error.getMessage())
                            .contains("Origin header does not match APPSMITH_BASE_URL configuration");
                })
                .verify();

        // Assert: the invited user must NOT have been created in the DB
        User invitedUser = userRepository.findByEmail(uniqueEmail).block();
        assertThat(invitedUser)
                .as("Invited user should not be persisted when origin validation fails")
                .isNull();

        // Assert: the permission group must NOT contain the invited user
        PermissionGroup adminPgAfter =
                permissionGroupRepository.findById(adminPermissionGroupId).block();
        assertThat(adminPgAfter).isNotNull();

        if (invitedUser != null) {
            assertThat(adminPgAfter.getAssignedToUserIds())
                    .as("Permission group should not contain the invited user on origin mismatch")
                    .doesNotContain(invitedUser.getId());
        }
    }
}
