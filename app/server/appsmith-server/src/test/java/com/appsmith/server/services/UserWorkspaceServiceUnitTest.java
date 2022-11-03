package com.appsmith.server.services;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import com.appsmith.server.dtos.WorkspaceMemberInfoDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.notifications.EmailSender;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.UserDataRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
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

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@DirtiesContext
@Slf4j
public class UserWorkspaceServiceUnitTest {

    @Autowired SessionUserService sessionUserService;
    @Autowired WorkspaceRepository workspaceRepository;
    @Autowired UserRepository userRepository;
    @Autowired UserDataRepository userDataRepository;
    @Autowired PolicyUtils policyUtils;
    @Autowired EmailSender emailSender;
    @Autowired UserDataService userDataService;
    @Autowired PermissionGroupService permissionGroupService;
    @Autowired TenantService tenantService;
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
                .findByDefaultWorkspaceId(createdWorkspace.getId())
                .flatMap(permissionGroup -> {
                    permissionGroup.setDefaultWorkspaceId(null);
                    return permissionGroupRepository.save(permissionGroup);
                })
                .collectList()
                .block();

        Mono<List<WorkspaceMemberInfoDTO>> workspaceMembers = userWorkspaceService.getWorkspaceMembers(testWorkspace.getId());
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
        Mono<List<WorkspaceMemberInfoDTO>> workspaceMembers = userWorkspaceService.getWorkspaceMembers(sampleWorkspaceId);
        StepVerifier
                .create(workspaceMembers)
                .expectErrorMessage(AppsmithError.NO_RESOURCE_FOUND.getMessage(FieldName.WORKSPACE, sampleWorkspaceId))
                .verify();
    }
}
