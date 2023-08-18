package com.appsmith.server.solutions.roles;

import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.solutions.roles.constants.RoleTab;
import com.appsmith.server.solutions.roles.dtos.RoleTabDTO;
import com.appsmith.server.solutions.roles.dtos.RoleViewDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ExtendWith(SpringExtension.class)
@DirtiesContext
public class RoleConfigurationSolutionTest {

    @Autowired
    UserRepository userRepository;

    @Autowired
    UserUtils userUtils;

    @Autowired
    RoleConfigurationSolution roleConfigurationSolution;

    @MockBean
    TenantResources tenantResources;

    @MockBean
    WorkspaceResources workspaceResources;

    User api_user = null;

    String superAdminPermissionGroupId = null;

    @BeforeEach
    public void setup() {
        if (api_user == null) {
            api_user = userRepository.findByEmail("api_user").block();
        }

        // Make api_user instance administrator before starting the test
        userUtils.makeSuperUser(List.of(api_user)).block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getAllTabViewsTest() {
        RoleTabDTO mockRoleTabDTO = new RoleTabDTO();

        Mockito.when(workspaceResources.getDataFromRepositoryForAllTabs()).thenReturn(new CommonAppsmithObjectData());
        Mockito.when(workspaceResources.createApplicationResourcesTabView(
                        Mockito.anyString(), Mockito.any(CommonAppsmithObjectData.class)))
                .thenReturn(Mono.just(mockRoleTabDTO));
        Mockito.when(workspaceResources.createDatasourceResourcesTabView(
                        Mockito.anyString(), Mockito.any(CommonAppsmithObjectData.class)))
                .thenReturn(Mono.just(mockRoleTabDTO));
        Mockito.when(tenantResources.createGroupsAndRolesTab(Mockito.anyString()))
                .thenReturn(Mono.just(mockRoleTabDTO));
        Mockito.when(tenantResources.createOthersTab(Mockito.anyString(), Mockito.any(CommonAppsmithObjectData.class)))
                .thenReturn(Mono.just(mockRoleTabDTO));

        if (superAdminPermissionGroupId == null) {
            superAdminPermissionGroupId =
                    userUtils.getSuperAdminPermissionGroup().block().getId();
        }

        Mono<RoleViewDTO> allTabViewsMono = roleConfigurationSolution.getAllTabViews(superAdminPermissionGroupId);

        StepVerifier.create(allTabViewsMono)
                .assertNext(allTabView -> {
                    assertThat(allTabView).isNotNull();
                    assertThat(allTabView.getTabs().size()).isEqualTo(4);
                    // Assert the tabs in order
                    List<String> tabNames = new ArrayList<>(allTabView.getTabs().keySet());

                    assertThat(tabNames.get(0)).isEqualTo(RoleTab.APPLICATION_RESOURCES.getName());
                    assertThat(tabNames.get(1)).isEqualTo(RoleTab.DATASOURCES_ENVIRONMENTS.getName());
                    assertThat(tabNames.get(2)).isEqualTo(RoleTab.GROUPS_ROLES.getName());
                    assertThat(tabNames.get(3)).isEqualTo(RoleTab.OTHERS.getName());
                })
                .verifyComplete();
    }
}
