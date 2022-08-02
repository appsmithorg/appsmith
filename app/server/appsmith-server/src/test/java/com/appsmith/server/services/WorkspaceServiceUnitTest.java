package com.appsmith.server.services;

import com.appsmith.server.acl.RoleGraph;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import com.appsmith.server.dtos.UserAndPermissionGroupDTO;
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

import static com.appsmith.server.acl.AclPermission.READ_WORKSPACES;
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

    @MockBean PermissionGroupService permissionGroupService;

    @MockBean PolicyUtils policyUtils;

    @MockBean UserService userService;

    WorkspaceService workspaceService;

    ModelMapper modelMapper;

    @Before
    public void setUp() {
        modelMapper = new ModelMapper();
        workspaceService = new WorkspaceServiceImpl(scheduler, validator, mongoConverter, reactiveMongoTemplate,
                workspaceRepository, analyticsService, pluginRepository, sessionUserService, userWorkspaceService,
                userRepository, roleGraph, assetRepository, assetService, applicationRepository,
                permissionGroupService, policyUtils, modelMapper);
    }
}
