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
        String[] validEmails = {"valid@email.com", "valid@email.co.in", "valid@email-assoc.co.in"};
        for (String validEmail:
             validEmails) {
            workspaceWithEmail.setEmail(validEmail);
            workspaceServiceCE.validateIncomingWorkspace(workspaceWithEmail);
        }
    }

    @Test()
    public void testValidateIncomingWorkspaceInvalidEmail() {
        Workspace workspaceWithEmail = new Workspace();
        String[] invalidEmails = {"invalid@.com", "@invalid.com"};
        for (String invalidEmail: invalidEmails) {
            workspaceWithEmail.setEmail(invalidEmail);
            AppsmithException exception = assertThrows(
                    AppsmithException.class, () -> workspaceServiceCE.validateIncomingWorkspace(workspaceWithEmail));
            assertEquals(new AppsmithException(AppsmithError.INVALID_PARAMETER, EMAIL).getMessage(),
                    exception.getMessage());
        }
    }

    @Test
    public void testValidateIncomingWorkspaceValidWebsite() {
        Workspace workspaceWithWebsite = new Workspace();
        String[] validWebsites = {"https://www.valid.website.com", "http://www.valid.website.com", "https://valid.website.com", "http://valid.website.com", "www.valid.website.com", "valid.website.com", "valid-website.com", "valid.12345.com", "12345.com", "", null};
        for (String validWebsite : validWebsites) {
            workspaceWithWebsite.setWebsite(validWebsite);
            workspaceServiceCE.validateIncomingWorkspace(workspaceWithWebsite);
        }
    }

    @Test
    public void testValidateIncomingWorkspaceInvalidWebsite() {
        Workspace workspaceWithWebsite = new Workspace();
        String[] invalidWebsites = {"htp://www.invalid.website.com", "htp://invalid.website.com", "htp://www", "www", "www."};
        workspaceWithWebsite.setWebsite("www.");
        for (String invalidWebsite : invalidWebsites) {
            AppsmithException exception = assertThrows(
                    AppsmithException.class, () -> workspaceServiceCE.validateIncomingWorkspace(workspaceWithWebsite));
            assertEquals(new AppsmithException(AppsmithError.INVALID_PARAMETER, WEBSITE).getMessage(), exception.getMessage());
        }
    }
}