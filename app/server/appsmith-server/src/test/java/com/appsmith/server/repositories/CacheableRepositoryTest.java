package com.appsmith.server.repositories;

import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.extensions.AfterAllCleanUpExtension;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.repositories.cakes.PermissionGroupRepositoryCake;
import com.appsmith.server.repositories.cakes.UserRepositoryCake;
import com.appsmith.server.services.WorkspaceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.Set;

import static com.appsmith.server.constants.FieldName.ADMINISTRATOR;
import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(AfterAllCleanUpExtension.class)
@SpringBootTest
public class CacheableRepositoryTest {

    @Autowired
    CacheableRepositoryHelper cacheableRepositoryHelper;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    PermissionGroupRepositoryCake permissionGroupRepository;

    @Autowired
    UserRepositoryCake userRepository;

    @Autowired
    UserUtils userUtils;

    @BeforeEach()
    public void setup() {
        User api_user = userRepository.findByEmail("api_user").block();
        userUtils.makeSuperUser(List.of(api_user)).block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getUserPermissionsTest_onPermissionGroupDelete_valid() {

        User api_user = userRepository.findByEmail("api_user").block();

        Workspace workspace = new Workspace();
        workspace.setName("getUserPermissionsTest_onPermissionGroupDelete_valid Workspace");
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        List<PermissionGroup> defaultPermissionGroups = permissionGroupRepository
                .findAllById(createdWorkspace.getDefaultPermissionGroups())
                .collectList()
                .block();
        PermissionGroup adminPg = defaultPermissionGroups.stream()
                .filter(pg -> pg.getName().startsWith(ADMINISTRATOR))
                .findFirst()
                .get();

        Mono<Set<String>> permissionGroupsOfUserMono = cacheableRepositoryHelper.getPermissionGroupsOfUser(api_user);

        // Assert that the user has the ADMINISTRATOR permission group
        StepVerifier.create(permissionGroupsOfUserMono)
                .assertNext(permissionGroupsOfUser -> {
                    assertThat(permissionGroupsOfUser).contains(adminPg.getId());
                })
                .verifyComplete();

        // Now delete the workspace and assert that user permission groups does not contain the admin pg
        workspaceService.archiveById(createdWorkspace.getId()).block();

        Set<String> userPermissionGroupsPostWorkspaceDelete =
                cacheableRepositoryHelper.getPermissionGroupsOfUser(api_user).block();
        assertThat(userPermissionGroupsPostWorkspaceDelete).doesNotContain(adminPg.getId());
    }
}
