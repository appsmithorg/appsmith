package com.appsmith.server.services;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.MemberInfoDTO;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import com.appsmith.server.dtos.RecentlyUsedEntityDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.UserDataRepository;
import com.appsmith.server.solutions.ApplicationPermission;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.doReturn;

@SpringBootTest
@DirtiesContext
@Slf4j
public class UserWorkspaceServiceUnitTest {
    @Autowired
    UserDataRepository userDataRepository;

    @SpyBean
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

    List<String> workspaceIds = new ArrayList<>();

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

    private Flux<Workspace> createDummyWorkspaces() {
        List<Workspace> workspaceList = new ArrayList<>(4);
        for (int i = 1; i <= 4; i++) {
            Workspace workspace = new Workspace();
            workspace.setName(UUID.randomUUID().toString());
            workspaceList.add(workspace);
        }
        return Flux.fromIterable(workspaceList)
                .flatMap(workspace -> workspaceService.create(workspace))
                .map(workspace -> {
                    workspaceIds.add(workspace.getId());
                    return workspace;
                });
    }

    @AfterEach
    public void cleanup() {
        User currentUser = sessionUserService.getCurrentUser().block();
        if (null == currentUser) {
            // Do not proceed with cleanup, because user context doesn't exist.
            return;
        }
        List<Application> deletedApplications = applicationPermission
                .getDeletePermission()
                .flatMapMany(permission -> applicationService.findByWorkspaceId(workspace.getId(), permission))
                .flatMap(remainingApplication -> applicationPageService.deleteApplication(remainingApplication.getId()))
                .collectList()
                .block();
        if (workspace != null && workspace.getDeletedAt() == null) {
            workspace = workspaceService.archiveById(workspace.getId()).block();
        }

        if (!CollectionUtils.isNullOrEmpty(workspaceIds)) {
            Flux.fromIterable(workspaceIds)
                    .flatMap(workspaceId -> workspaceService.archiveById(workspaceId))
                    .map(deletedWorkspace -> workspaceIds.remove(deletedWorkspace.getId()))
                    .blockLast();
        }
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
                    assertThat(workspaceMemberInfoDTOS).hasSize(1);
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
                    assertThat(workspaceMemberInfoDTOSMap).hasSize(2); // should have 2 entries for 2 workspaces
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

    @Test
    @WithUserDetails(value = "api_user")
    public void getUserWorkspacesByRecentlyUsedOrder_noRecentWorkspaces_allEntriesAreReturned() {
        // Mock the user data to return empty recently used workspaces
        UserData userData = new UserData();
        doReturn(Mono.just(userData)).when(userDataService).getForCurrentUser();
        cleanup();
        createDummyWorkspaces().blockLast();

        StepVerifier.create(userWorkspaceService.getUserWorkspacesByRecentlyUsedOrder(null))
                .assertNext(workspaces -> {
                    assertThat(workspaces).hasSize(4);
                    workspaces.forEach(workspace -> {
                        assertThat(workspaceIds.contains(workspace.getId())).isTrue();
                        assertThat(workspace.getOrganizationId()).isNotEmpty();
                    });
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getUserWorkspacesByRecentlyUsedOrder_withRecentlyUsedWorkspaces_allEntriesWithSameOrderAreReturned() {
        // Mock the user data to return recently used workspaces
        UserData userData = new UserData();
        cleanup();
        createDummyWorkspaces().blockLast();
        List<RecentlyUsedEntityDTO> recentlyUsedEntityDTOs = new ArrayList<>();
        workspaceIds.forEach(workspaceId -> {
            RecentlyUsedEntityDTO recentlyUsedEntityDTO = new RecentlyUsedEntityDTO();
            recentlyUsedEntityDTO.setWorkspaceId(workspaceId);
            recentlyUsedEntityDTOs.add(recentlyUsedEntityDTO);
        });
        userData.setRecentlyUsedEntityIds(recentlyUsedEntityDTOs);
        doReturn(Mono.just(userData)).when(userDataService).getForCurrentUser();

        StepVerifier.create(userWorkspaceService.getUserWorkspacesByRecentlyUsedOrder(null))
                .assertNext(workspaces -> {
                    assertThat(workspaces).hasSize(4);
                    List<String> fetchedWorkspaceIds = new ArrayList<>();
                    workspaces.forEach(workspace -> {
                        fetchedWorkspaceIds.add(workspace.getId());
                        assertThat(workspaceIds.contains(workspace.getId())).isTrue();
                        assertThat(workspace.getOrganizationId()).isNotEmpty();
                    });
                    assertThat(fetchedWorkspaceIds).isEqualTo(workspaceIds);
                })
                .verifyComplete();
    }
}
