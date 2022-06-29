package com.appsmith.server.services;

import com.appsmith.server.acl.RoleGraph;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.UserAndGroupDTO;
import com.appsmith.server.dtos.UserGroupInfoDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.AssetRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.modelmapper.ModelMapper;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.test.StepVerifier;

import javax.validation.Validator;
import java.util.List;

import static com.appsmith.server.acl.AclPermission.WORKSPACE_INVITE_USERS;

@RunWith(SpringJUnit4ClassRunner.class)
public class WorkspaceServiceUnitTest {

    @MockBean PluginRepository pluginRepository;
    @MockBean SessionUserService sessionUserService;
    @MockBean UserWorkspaceService userWorkspaceService;
    @MockBean UserRepository userRepository;
    @MockBean RoleGraph roleGraph;
    @MockBean AssetRepository assetRepository;
    @MockBean AssetService assetService;
    @MockBean Scheduler scheduler;
    @MockBean MongoConverter mongoConverter;
    @MockBean ReactiveMongoTemplate reactiveMongoTemplate;
    @MockBean WorkspaceRepository workspaceRepository;
    @MockBean Validator validator;
    @MockBean AnalyticsService analyticsService;
    @MockBean ApplicationRepository applicationRepository;

    @MockBean UserGroupService userGroupService;

    @MockBean PermissionGroupService permissionGroupService;

    @MockBean RbacPolicyService rbacPolicyService;

    @MockBean PolicyUtils policyUtils;

    @MockBean UserService userService;

    WorkspaceService workspaceService;

    ModelMapper modelMapper;

    @Before
    public void setUp() {
        modelMapper = new ModelMapper();
        workspaceService = new WorkspaceServiceImpl(scheduler, validator, mongoConverter, reactiveMongoTemplate,
                workspaceRepository, analyticsService, pluginRepository, sessionUserService, userWorkspaceService,
                userRepository, roleGraph, assetRepository, assetService, applicationRepository, userGroupService,
                permissionGroupService, rbacPolicyService, policyUtils, modelMapper);
    }

    @Test
    public void whenMapUserGroup_thenConvertsToUserGroupInfoDTO() {
        UserGroup userGroup = new UserGroup();
        userGroup.setName("Test");
        userGroup.setId("123");
        userGroup.setDescription("Test");
        UserGroupInfoDTO userGroupInfoDTO = modelMapper.map(userGroup, UserGroupInfoDTO.class);
        Assert.assertEquals(userGroup.getName(), userGroupInfoDTO.getName());
        Assert.assertEquals(userGroup.getId(), userGroupInfoDTO.getId());
        Assert.assertEquals(userGroup.getDescription(), userGroupInfoDTO.getDescription());
    }

    @Test
    public void getWorkspaceMembers_WhenRoleIsNull_ReturnsEmptyList() {
        // create a workspace object
        Workspace testWorkspace = new Workspace();
        testWorkspace.setName("Get All Members For Workspace Test");
        testWorkspace.setDomain("test.com");
        testWorkspace.setWebsite("https://test.com");
        testWorkspace.setId("test-org-id");

        // mock repository methods so that they return the objects we've created
        Mockito.when(workspaceRepository.findById("test-org-id", WORKSPACE_INVITE_USERS))
                .thenReturn(Mono.just(testWorkspace));

        Mono<List<UserAndGroupDTO>> workspaceMembers = userWorkspaceService.getWorkspaceMembers(testWorkspace.getId());
        StepVerifier
                .create(workspaceMembers)
                .assertNext(userAndGroupDTOs -> {
                    Assert.assertEquals(0, userAndGroupDTOs.size());
                })
                .verifyComplete();
    }

    @Test
    public void getWorkspaceMembers_WhenNoOrgFound_ThrowsException() {
        String sampleWorkspaceId = "test-org-id";
        // mock repository methods so that they return the objects we've created
        Mockito.when(workspaceRepository.findById(sampleWorkspaceId, WORKSPACE_INVITE_USERS))
                .thenReturn(Mono.empty());

        Mono<List<UserAndGroupDTO>> workspaceMembers = userWorkspaceService.getWorkspaceMembers(sampleWorkspaceId);
        StepVerifier
                .create(workspaceMembers)
                .expectErrorMessage(AppsmithError.NO_RESOURCE_FOUND.getMessage(FieldName.WORKSPACE, sampleWorkspaceId))
                .verify();
    }
}
