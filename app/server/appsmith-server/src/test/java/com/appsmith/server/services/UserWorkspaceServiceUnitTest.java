package com.appsmith.server.services;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.MemberInfoDTO;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.UserDataRepository;
import com.appsmith.server.solutions.ApplicationPermission;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
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
    @Autowired
    UserDataRepository userDataRepository;

    @Autowired
    UserDataService userDataService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    PermissionGroupRepository permissionGroupRepository;

    @Autowired
    UserWorkspaceService userWorkspaceService;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    ApplicationPermission applicationPermission;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    SessionUserService sessionUserService;

    ModelMapper modelMapper;

    Workspace workspace;

    @BeforeEach
    public void setUp() {
        modelMapper = new ModelMapper();

        User currentUser = sessionUserService.getCurrentUser().block();
        if (null == currentUser) {
            // Do not proceed with further setup, because user context doesn't exist.
            return;
        }

        // create a workspace object
        Workspace testWorkspace = new Workspace();
        testWorkspace.setName("Get All Members For Workspace Test");
        testWorkspace.setDomain("test.com");
        testWorkspace.setWebsite("https://test.com");

        workspace = workspaceService.create(testWorkspace).block();
    }

    @AfterEach
    public void cleanup() {
        User currentUser = sessionUserService.getCurrentUser().block();
        if (null == currentUser) {
            // Do not proceed with cleanup, because user context doesn't exist.
            return;
        }
        List<Application> deletedApplications = applicationService
                .findByWorkspaceId(workspace.getId(), applicationPermission.getDeletePermission())
                .flatMap(remainingApplication -> applicationPageService.deleteApplication(remainingApplication.getId()))
                .collectList()
                .block();
        Workspace deletedWorkspace =
                workspaceService.archiveById(workspace.getId()).block();
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
        List<PermissionGroup> autoCreatedPermissionGroups = permissionGroupRepository
                .findByDefaultDomainIdAndDefaultDomainType(workspace.getId(), Workspace.class.getSimpleName())
                .flatMap(permissionGroup -> {
                    permissionGroup.setDefaultDomainId(null);
                    return permissionGroupRepository.save(permissionGroup);
                })
                .collectList()
                .block();

        Mono<List<MemberInfoDTO>> workspaceMembers = userWorkspaceService.getWorkspaceMembers(workspace.getId());
        StepVerifier.create(workspaceMembers)
                .assertNext(userAndGroupDTOs -> {
                    assertEquals(0, userAndGroupDTOs.size());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getWorkspaceMembers_WhenNoOrgFound_ThrowsException() {
        String sampleWorkspaceId = "test-org-id";
        Mono<List<MemberInfoDTO>> workspaceMembers = userWorkspaceService.getWorkspaceMembers(sampleWorkspaceId);
        StepVerifier.create(workspaceMembers)
                .expectErrorMessage(AppsmithError.NO_RESOURCE_FOUND.getMessage(FieldName.WORKSPACE, sampleWorkspaceId))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getWorkspaceMembers_WhenUserHasProfilePhotoForOneWorkspace_ProfilePhotoIncluded() {
        Mono<List<MemberInfoDTO>> listMono = userDataService
                .getForCurrentUser()
                .flatMap(userData -> {
                    userData.setProfilePhotoAssetId("sample-photo-id");
                    return userDataRepository.save(userData);
                })
                .then(userWorkspaceService.getWorkspaceMembers(workspace.getId()));

        StepVerifier.create(listMono)
                .assertNext(workspaceMemberInfoDTOS -> {
                    assertThat(workspaceMemberInfoDTOS.size()).isEqualTo(1);
                    assertThat(workspaceMemberInfoDTOS.get(0).getPhotoId()).isEqualTo("sample-photo-id");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getWorkspaceMembers_WhenUserHasProfilePhotoForMultipleWorkspace_ProfilePhotoIncluded() {
        // create additional workspace
        Workspace secondWorkspace = new Workspace();
        secondWorkspace.setName("second-workspace-" + UUID.randomUUID());

        Mono<Workspace> createSecondWorkspaceMono =
                workspaceService.create(secondWorkspace).cache();

        Mono<Map<String, List<MemberInfoDTO>>> mapMono = userDataService
                .getForCurrentUser()
                .flatMap(userData -> {
                    userData.setProfilePhotoAssetId("sample-photo-id");
                    return userDataRepository.save(userData);
                })
                .then(createSecondWorkspaceMono)
                .flatMap(createdSecondWorkspace -> {
                    Set<String> createdIds = Set.of(
                            Objects.requireNonNull(createdSecondWorkspace.getId()),
                            Objects.requireNonNull(workspace.getId()));
                    return userWorkspaceService.getWorkspaceMembers(createdIds);
                });

        StepVerifier.create(mapMono)
                .assertNext(workspaceMemberInfoDTOSMap -> {
                    assertThat(workspaceMemberInfoDTOSMap.size())
                            .isEqualTo(2); // should have 2 entries for 2 workspaces
                    workspaceMemberInfoDTOSMap.values().forEach(workspaceMemberInfoDTOS -> {
                        // should have one entry for the creator member only, get that
                        MemberInfoDTO workspaceMemberInfoDTO = workspaceMemberInfoDTOS.get(0);
                        // we already set profile photo for the current user, check it exists in response
                        assertThat(workspaceMemberInfoDTO.getPhotoId()).isEqualTo("sample-photo-id");
                    });
                })
                .verifyComplete();

        // delete second workspace
        Workspace deletedSecondWorkspace = createSecondWorkspaceMono
                .flatMap(createdSecondWorkspace -> workspaceService.archiveById(createdSecondWorkspace.getId()))
                .block();
    }
}
