package com.appsmith.server.services;

import com.appsmith.server.acl.RoleGraph;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.domains.UserRole;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.AssetRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.repositories.UserRepository;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
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

    WorkspaceService workspaceService;

    @Before
    public void setUp() {
        workspaceService = new WorkspaceServiceImpl(scheduler, validator, mongoConverter, reactiveMongoTemplate,
                workspaceRepository, analyticsService, pluginRepository, sessionUserService, userWorkspaceService,
                userRepository, roleGraph, assetRepository, assetService,
                applicationRepository);
    }

    @Test
    public void getWorkspaceMembers_WhenRoleIsNull_ReturnsEmptyList() {
        // create a workspace object
        Workspace testWorkspace = new Workspace();
        testWorkspace.setName("Get All Members For Organization Test");
        testWorkspace.setDomain("test.com");
        testWorkspace.setWebsite("https://test.com");
        testWorkspace.setId("test-org-id");

        // mock repository methods so that they return the objects we've created
        Mockito.when(workspaceRepository.findById("test-org-id", WORKSPACE_INVITE_USERS))
                .thenReturn(Mono.just(testWorkspace));

        Mono<List<UserRole>> workspaceMembers = workspaceService.getWorkspaceMembers(testWorkspace.getId());
        StepVerifier
                .create(workspaceMembers)
                .assertNext(userRoles -> {
                    Assert.assertEquals(0, userRoles.size());
                })
                .verifyComplete();
    }

    @Test
    public void getWorkspaceMembers_WhenNoOrgFound_ThrowsException() {
        String sampleWorkspaceId = "test-org-id";
        // mock repository methods so that they return the objects we've created
        Mockito.when(workspaceRepository.findById(sampleWorkspaceId, WORKSPACE_INVITE_USERS))
                .thenReturn(Mono.empty());

        Mono<List<UserRole>> workspaceMembers = workspaceService.getWorkspaceMembers(sampleWorkspaceId);
        StepVerifier
                .create(workspaceMembers)
                .expectErrorMessage(AppsmithError.NO_RESOURCE_FOUND.getMessage(FieldName.WORKSPACE, sampleWorkspaceId))
                .verify();
    }
}
