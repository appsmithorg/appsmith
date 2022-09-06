package com.appsmith.server.services;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Set;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.dtos.Permission;

import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

@RunWith(SpringRunner.class)
@SpringBootTest
public class PermissionGroupServiceTest {

    @Autowired
    private PermissionGroupService permissionGroupService;
    
    @Test
    public void testWhenCreatePermissionGroup_ThenUnassignPermissionAndPoliciesAreCreated() {
        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setName("test");
        permissionGroup.setDescription("test");
        permissionGroup.setPermissions(Set.of());

        Mono<PermissionGroup> permissionGroupMono = permissionGroupService.create(permissionGroup);

        StepVerifier.create(permissionGroupMono)
            .assertNext(pg -> {
                assertThat(pg.getId()).isNotNull();
                assertThat(pg.getName()).isEqualTo("test");
                assertThat(pg.getDescription()).isEqualTo("test");
                assertThat(pg.getPermissions()).hasSize(1);
                assertThat(pg.getPermissions())
                        .containsOnly(
                            Permission.builder()
                                .documentId(pg.getId())
                                .aclPermission(AclPermission.UNASSIGN_PERMISSION_GROUPS)
                                .build()
                        );
                assertThat(pg.getPolicies()).hasSize(1);
                assertThat(pg.getPolicies())
                        .containsOnly(
                            Policy.builder()
                                .permission(AclPermission.UNASSIGN_PERMISSION_GROUPS.getValue())
                                .permissionGroups(Set.of(pg.getId()))
                                .build()
                        );
            }).verifyComplete();
    }
}
