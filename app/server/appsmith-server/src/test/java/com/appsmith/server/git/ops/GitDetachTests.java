package com.appsmith.server.git.ops;

import com.appsmith.external.git.handler.FSGitHandler;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.git.central.CentralGitService;
import com.appsmith.server.git.central.GitType;
import com.appsmith.server.helpers.CommonGitFileUtils;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ApplicationPermission;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.security.test.context.support.WithUserDetails;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class GitDetachTests {

    @Autowired
    CentralGitService centralGitService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    UserService userService;

    @Autowired
    ApplicationPermission applicationPermission;

    @Autowired
    ApplicationRepository applicationRepository;

    @SpyBean
    FSGitHandler fsGitHandler;

    @SpyBean
    CommonGitFileUtils commonGitFileUtils;

    @Test
    @WithUserDetails(value = "api_user")
    public void detachRemote_withEmptyGitData_hasNoChangeOnArtifact() {
        User apiUser = userService.findByEmail("api_user").block();
        Workspace toCreate = new Workspace();
        toCreate.setName("Workspace_" + UUID.randomUUID());
        Workspace workspace =
                workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
        assertThat(workspace).isNotNull();

        Application testApplication = new Application();
        testApplication.setGitApplicationMetadata(null);
        testApplication.setName("detachRemote_withEmptyGitData");
        testApplication.setWorkspaceId(workspace.getId());
        Application application1 =
                applicationPageService.createApplication(testApplication).block();

        Mono<Application> applicationMono = centralGitService
                .detachRemote(application1.getId(), ArtifactType.APPLICATION, GitType.FILE_SYSTEM)
                .map(artifact -> (Application) artifact);

        StepVerifier.create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        & throwable.getMessage().contains("Git configuration is invalid"))
                .verify();
    }

    @WithUserDetails("api_user")
    @Test
    public void detachRemote_whenUserDoesNotHaveRequiredPermission_throwsException() {
        Application application =
                createApplicationAndRemovePermissionFromApplication(applicationPermission.getGitConnectPermission());
        Mono<Application> applicationMono = centralGitService
                .detachRemote(application.getId(), ArtifactType.APPLICATION, GitType.FILE_SYSTEM)
                .map(artifact -> (Application) artifact);

        StepVerifier.create(applicationMono)
                .expectErrorMessage(
                        AppsmithError.ACL_NO_RESOURCE_FOUND.getMessage(FieldName.APPLICATION, application.getId()))
                .verify();
    }

    /**
     * This method creates a workspace, creates an application in the workspace and removes the
     * create application permission from the workspace for the api_user.
     *
     * @return Created Application
     */
    private Application createApplicationAndRemovePermissionFromApplication(AclPermission permission) {
        User apiUser = userService.findByEmail("api_user").block();

        Workspace toCreate = new Workspace();
        toCreate.setName("Workspace_" + UUID.randomUUID());
        Workspace workspace =
                workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
        assertThat(workspace).isNotNull();

        Application testApplication = new Application();
        testApplication.setWorkspaceId(workspace.getId());
        testApplication.setName("Test App");
        Application application1 =
                applicationPageService.createApplication(testApplication).block();

        assertThat(application1).isNotNull();

        // remove permission from the application for the api user
        application1.getPolicyMap().remove(permission.getValue());

        return applicationRepository.save(application1).block();
    }
}
