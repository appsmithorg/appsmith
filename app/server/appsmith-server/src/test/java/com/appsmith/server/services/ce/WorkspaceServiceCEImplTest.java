package com.appsmith.server.services.ce;

import com.appsmith.server.acl.RoleGraph;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.repositories.*;
import com.appsmith.server.services.*;

import static com.appsmith.server.constants.FieldName.WEBSITE;
import static  org.junit.Assert.assertThrows;
import static  org.junit.Assert.assertEquals;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.modelmapper.ModelMapper;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;

import static com.appsmith.server.constants.FieldName.EMAIL;

@RunWith(SpringRunner.class)
public class WorkspaceServiceCEImplTest {

    @MockBean
    Scheduler scheduler;
    @MockBean
    Validator validator;
    @MockBean
    MongoConverter mongoConverter;
    @MockBean
    ReactiveMongoTemplate reactiveMongoTemplate;
    @MockBean
    WorkspaceRepository workspaceRepository;
    @MockBean
    AnalyticsService analyticsService;
    @MockBean
    PluginRepository pluginRepository;
    @MockBean
    SessionUserService sessionUserService;
    @MockBean
    UserWorkspaceService userWorkspaceService;
    @MockBean
    UserRepository userRepository;
    @MockBean
    RoleGraph roleGraph;
    @MockBean
    AssetRepository assetRepository;
    @MockBean
    AssetService assetService;
    @MockBean
    ApplicationRepository applicationRepository;
    @MockBean
    PermissionGroupService permissionGroupService;
    @MockBean
    PolicyUtils policyUtils;
    @MockBean
    ModelMapper modelMapper;

    WorkspaceServiceCE workspaceServiceCE;

    @Before
    public void setUp() {
        workspaceServiceCE = new WorkspaceServiceCEImpl(scheduler, validator, mongoConverter, reactiveMongoTemplate,
                workspaceRepository, analyticsService, pluginRepository, sessionUserService, userWorkspaceService,
                userRepository, roleGraph, assetRepository, assetService, applicationRepository, permissionGroupService,
                policyUtils, modelMapper);
    }

    @Test
    public void testValidateIncomingWorkspaceValidEmail() {
        Workspace workspaceWithEmail = new Workspace();
        workspaceWithEmail.setEmail("valid@email.com");
        workspaceServiceCE.validateIncomingWorkspace(workspaceWithEmail);
        workspaceWithEmail.setEmail("valid@email.co.in");
        workspaceServiceCE.validateIncomingWorkspace(workspaceWithEmail);
        workspaceWithEmail.setEmail("valid@email-assoc.co.in");
        workspaceServiceCE.validateIncomingWorkspace(workspaceWithEmail);
    }

    @Test()
    public void testValidateIncomingWorkspaceInvalidEmail() {
        Workspace workspaceWithEmail = new Workspace();
        workspaceWithEmail.setEmail("invalid@.com");
        AppsmithException exception = assertThrows(
                AppsmithException.class, () ->workspaceServiceCE.validateIncomingWorkspace(workspaceWithEmail));
        assertEquals(new AppsmithException(AppsmithError.INVALID_PARAMETER, EMAIL).getMessage(), exception.getMessage());
        workspaceWithEmail.setEmail("@invalid.com");
        exception = assertThrows(
                AppsmithException.class, () ->workspaceServiceCE.validateIncomingWorkspace(workspaceWithEmail));
        assertEquals(new AppsmithException(AppsmithError.INVALID_PARAMETER, EMAIL).getMessage(), exception.getMessage());
    }

    @Test
    public void testValidateIncomingWorkspaceValidWebsite() {
        Workspace workspaceWithWebsite = new Workspace();
        workspaceWithWebsite.setWebsite("https://www.valid.website.com");
        workspaceServiceCE.validateIncomingWorkspace(workspaceWithWebsite);
        workspaceWithWebsite.setWebsite("http://www.valid.website.com");
        workspaceServiceCE.validateIncomingWorkspace(workspaceWithWebsite);
        workspaceWithWebsite.setWebsite("https://valid.website.com");
        workspaceServiceCE.validateIncomingWorkspace(workspaceWithWebsite);
        workspaceWithWebsite.setWebsite("http://valid.website.com");
        workspaceServiceCE.validateIncomingWorkspace(workspaceWithWebsite);
        workspaceWithWebsite.setWebsite("www.valid.website.com");
        workspaceServiceCE.validateIncomingWorkspace(workspaceWithWebsite);
        workspaceWithWebsite.setWebsite("valid.website.com");
        workspaceServiceCE.validateIncomingWorkspace(workspaceWithWebsite);
        workspaceWithWebsite.setWebsite("valid-website.com");
        workspaceServiceCE.validateIncomingWorkspace(workspaceWithWebsite);
        workspaceWithWebsite.setWebsite("valid.12345.com");
        workspaceServiceCE.validateIncomingWorkspace(workspaceWithWebsite);
        workspaceWithWebsite.setWebsite("12345.com");
        workspaceServiceCE.validateIncomingWorkspace(workspaceWithWebsite);
        workspaceWithWebsite.setWebsite("");
        workspaceServiceCE.validateIncomingWorkspace(workspaceWithWebsite);
        workspaceWithWebsite.setWebsite(null);
        workspaceServiceCE.validateIncomingWorkspace(workspaceWithWebsite);
    }

    @Test
    public void testValidateIncomingWorkspaceInvalidWebsite() {
        Workspace workspaceWithWebsite = new Workspace();
        workspaceWithWebsite.setWebsite("htp://www.invalid.website.com");
        AppsmithException exception = assertThrows(
                AppsmithException.class, () ->workspaceServiceCE.validateIncomingWorkspace(workspaceWithWebsite));
        assertEquals(new AppsmithException(AppsmithError.INVALID_PARAMETER, WEBSITE).getMessage(), exception.getMessage());
        workspaceWithWebsite.setWebsite("htp://invalid.website.com");
        exception = assertThrows(
                AppsmithException.class, () ->workspaceServiceCE.validateIncomingWorkspace(workspaceWithWebsite));
        assertEquals(new AppsmithException(AppsmithError.INVALID_PARAMETER, WEBSITE).getMessage(), exception.getMessage());
        workspaceWithWebsite.setWebsite("htp://www");
        exception = assertThrows(
                AppsmithException.class, () ->workspaceServiceCE.validateIncomingWorkspace(workspaceWithWebsite));
        assertEquals(new AppsmithException(AppsmithError.INVALID_PARAMETER, WEBSITE).getMessage(), exception.getMessage());
        workspaceWithWebsite.setWebsite("www");
        exception = assertThrows(
                AppsmithException.class, () ->workspaceServiceCE.validateIncomingWorkspace(workspaceWithWebsite));
        assertEquals(new AppsmithException(AppsmithError.INVALID_PARAMETER, WEBSITE).getMessage(), exception.getMessage());
    }
}