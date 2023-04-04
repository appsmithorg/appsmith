package com.appsmith.server.services;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import com.appsmith.server.dtos.MemberInfoDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.UserDataRepository;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.function.Tuple2;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@DirtiesContext
@Slf4j
public class UserWorkspaceServiceUnitTest {
    @Autowired UserDataRepository userDataRepository;
    @Autowired UserDataService userDataService;
    @Autowired WorkspaceService workspaceService;
    @Autowired PermissionGroupRepository permissionGroupRepository;
    @Autowired UserWorkspaceService userWorkspaceService;

    ModelMapper modelMapper;

    @BeforeEach
    public void setUp() {
        modelMapper = new ModelMapper();
    }

    @Test
    public void whenMapPermissionGroup_thenConvertsToPermissionGroupInfoDTO() {
        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setName("Test");
        permissionGroup.setId("123");
        permissionGroup.setDescription("Test");
        PermissionGroupInfoDTO permissionGroupInfoDTO = modelMapper.map(permissionGroup, PermissionGroupInfoDTO.class);
        assertEquals(permissionGroup.getName(), permissionGroupInfoDTO.getName());
        assertEquals(permissionGroup.getId(), permissionGroupInfoDTO.getId());
        assertEquals(permissionGroup.getDescription(), permissionGroupInfoDTO.getDescription());
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getWorkspaceMembers_WhenRoleIsNull_ReturnsEmptyList() {
        // create a workspace object
        Workspace testWorkspace = new Workspace();
        testWorkspace.setName("Get All Members For Workspace Test");
        testWorkspace.setDomain("test.com");
        testWorkspace.setWebsite("https://test.com");
        testWorkspace.setId("test-org-id");

        /**
         * Removing the Default Workspace ID from auto-created permission groups
         * so that while fetching the Users and Groups, we should get empty list.
         */
        Workspace createdWorkspace = workspaceService.create(testWorkspace).block();
        List<PermissionGroup> autoCreatedPermissionGroups = permissionGroupRepository
                .findByDefaultDomainIdAndDefaultDomainType(createdWorkspace.getId(), Workspace.class.getSimpleName())
                .flatMap(permissionGroup -> {
                    permissionGroup.setDefaultDomainId(null);
                    permissionGroup.setDefaultDomainType(null);
                    return permissionGroupRepository.save(permissionGroup);
                })
                .collectList()
                .block();

        Mono<List<MemberInfoDTO>> workspaceMembers = userWorkspaceService.getWorkspaceMembers(testWorkspace.getId());
        StepVerifier
                .create(workspaceMembers)
                .assertNext(userAndGroupDTOs -> {
                    assertEquals(0, userAndGroupDTOs.size());
                })
                .verifyComplete();
    }

    @Test
    public void getWorkspaceMembers_WhenNoOrgFound_ThrowsException() {
        String sampleWorkspaceId = "test-org-id";
        Mono<List<MemberInfoDTO>> workspaceMembers = userWorkspaceService.getWorkspaceMembers(sampleWorkspaceId);
        StepVerifier
                .create(workspaceMembers)
                .expectErrorMessage(AppsmithError.NO_RESOURCE_FOUND.getMessage(FieldName.WORKSPACE, sampleWorkspaceId))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getWorkspaceMembers_WhenUserHasProfilePhotoForOneWorkspace_ProfilePhotoIncluded() {
        // create workspace
        Workspace workspace = new Workspace();
        workspace.setName("workspace_" + UUID.randomUUID());
        Mono<Workspace> workspaceMono = workspaceService.create(workspace);

        Mono<List<MemberInfoDTO>> listMono = userDataService.getForCurrentUser().flatMap(userData -> {
                    userData.setProfilePhotoAssetId("sample-photo-id");
                    return userDataRepository.save(userData);
                }).then(workspaceMono)
                .flatMap(createdWorkspace -> userWorkspaceService.getWorkspaceMembers(createdWorkspace.getId()));

        StepVerifier.create(listMono).assertNext(workspaceMemberInfoDTOS -> {
            assertThat(workspaceMemberInfoDTOS.size()).isEqualTo(1);
            assertThat(workspaceMemberInfoDTOS.get(0).getPhotoId()).isEqualTo("sample-photo-id");
        }).verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getWorkspaceMembers_WhenUserHasProfilePhotoForMultipleWorkspace_ProfilePhotoIncluded() {
        // create workspace
        Workspace firstWorkspace = new Workspace();
        firstWorkspace.setName("first-workspace-" + UUID.randomUUID());

        Workspace secondWorkspace = new Workspace();
        secondWorkspace.setName("second-workspace-" + UUID.randomUUID());

        Mono<Tuple2<Workspace, Workspace>> createWorkspacesMono = Mono.zip(
                workspaceService.create(firstWorkspace),
                workspaceService.create(secondWorkspace)
        );

        Mono<Map<String, List<MemberInfoDTO>>> mapMono = userDataService.getForCurrentUser()
                .flatMap(userData -> {
                    userData.setProfilePhotoAssetId("sample-photo-id");
                    return userDataRepository.save(userData);
                })
                .then(createWorkspacesMono)
                .flatMap(workspaces -> {
                    Set<String> createdIds = Set.of(
                            Objects.requireNonNull(workspaces.getT1().getId()),
                            Objects.requireNonNull(workspaces.getT2().getId())
                    );
                    return userWorkspaceService.getWorkspaceMembers(createdIds);
                });

        StepVerifier.create(mapMono).assertNext(workspaceMemberInfoDTOSMap -> {
            assertThat(workspaceMemberInfoDTOSMap.size()).isEqualTo(2); // should have 2 entries for 2 workspaces
            workspaceMemberInfoDTOSMap.values().forEach(workspaceMemberInfoDTOS -> {
                // should have one entry for the creator member only, get that
                MemberInfoDTO workspaceMemberInfoDTO = workspaceMemberInfoDTOS.get(0);
                // we already set profile photo for the current user, check it exists in response
                assertThat(workspaceMemberInfoDTO.getPhotoId()).isEqualTo("sample-photo-id");
            });
        }).verifyComplete();
    }
}
