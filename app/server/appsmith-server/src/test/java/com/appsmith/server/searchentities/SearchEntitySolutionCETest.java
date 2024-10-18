package com.appsmith.server.searchentities;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.SearchEntityDTO;
import com.appsmith.server.extensions.AfterAllCleanUpExtension;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.WorkspaceService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.AssertionsForInterfaceTypes.assertThat;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
@ExtendWith(AfterAllCleanUpExtension.class)
class SearchEntitySolutionCETest {

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    SearchEntitySolution searchEntitySolution;

    private final List<String> applicationIds = new ArrayList<>();

    private final List<String> workspaceIds = new ArrayList<>();

    @AfterEach
    public void cleanup() {
        if (!CollectionUtils.isNullOrEmpty(applicationIds)) {
            applicationIds.forEach(applicationId ->
                    applicationPageService.deleteApplication(applicationId).block());
            applicationIds.clear();
        }
        if (!CollectionUtils.isNullOrEmpty(workspaceIds)) {
            workspaceIds.forEach(
                    workspaceId -> workspaceService.archiveById(workspaceId).block());
            workspaceIds.clear();
        }
    }

    @Test
    @WithUserDetails("api_user")
    public void searchEntity_noEntitiesWithSearchString_returnsEmptyList() {
        final String searchString = UUID.randomUUID().toString();
        Mono<SearchEntityDTO> searchEntityDTOMono =
                searchEntitySolution.searchEntity(new String[] {}, searchString, 0, 10, true);

        StepVerifier.create(searchEntityDTOMono)
                .assertNext(searchEntityDTO -> {
                    assertThat(searchEntityDTO.getApplications()).isEmpty();
                    assertThat(searchEntityDTO.getWorkspaces()).isEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void searchEntity_emptySizeParam_returnsNullForEntityList() {
        final String searchString = UUID.randomUUID().toString();
        Mono<SearchEntityDTO> searchEntityDTOMono =
                searchEntitySolution.searchEntity(new String[] {}, searchString, 0, 0, true);

        StepVerifier.create(searchEntityDTOMono)
                .assertNext(searchEntityDTO -> {
                    assertThat(searchEntityDTO.getApplications()).isNull();
                    assertThat(searchEntityDTO.getWorkspaces()).isNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void searchEntity_fetchAllEntities_entriesPresentWithSearchString_returnsPaginatedResult() {
        final String searchString = UUID.randomUUID().toString();
        Workspace workspace =
                workspaceService.create(mockWorkspace(searchString)).block();
        assertNotNull(workspace, "Workspace should not be null");
        workspaceIds.add(workspace.getId());
        Application application = mockNonGitConnectedApplication(searchString, workspace);
        application = applicationPageService
                .createApplication(application, workspace.getId())
                .block();
        assertNotNull(application, "Application should not be null");
        applicationIds.add(application.getId());
        Mono<SearchEntityDTO> searchEntityDTOMono =
                searchEntitySolution.searchEntity(new String[] {}, searchString, 0, 10, true);

        StepVerifier.create(searchEntityDTOMono)
                .assertNext(searchEntityDTO -> {
                    assertThat(searchEntityDTO.getApplications()).hasSize(1);
                    assertThat(searchEntityDTO.getWorkspaces()).hasSize(1);

                    Application application1 = searchEntityDTO.getApplications().get(0);
                    assertThat(application1.getName()).contains(searchString);

                    Workspace workspace1 = searchEntityDTO.getWorkspaces().get(0);
                    assertThat(workspace1.getName()).contains(searchString);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void searchEntity_fetchAllEntities_nullSearchString_returnsPaginatedResult() {
        Workspace workspace = workspaceService
                .create(mockWorkspace(UUID.randomUUID().toString()))
                .block();
        assertNotNull(workspace, "Workspace should not be null");
        workspaceIds.add(workspace.getId());
        Application application =
                mockNonGitConnectedApplication(UUID.randomUUID().toString(), workspace);
        application = applicationPageService
                .createApplication(application, workspace.getId())
                .block();
        assertNotNull(application, "Application should not be null");
        applicationIds.add(application.getId());
        Mono<SearchEntityDTO> searchEntityDTOMono =
                searchEntitySolution.searchEntity(new String[] {}, null, 0, 10, true);

        StepVerifier.create(searchEntityDTOMono)
                .assertNext(searchEntityDTO -> {
                    assertThat(searchEntityDTO.getApplications()).hasSize(1);
                    assertThat(searchEntityDTO.getWorkspaces()).hasSize(1);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void searchEntity_fetchWorkspaces_entriesPresentWithSearchString_returnsPaginatedResult() {
        final String searchString = UUID.randomUUID().toString();
        Workspace workspace =
                workspaceService.create(mockWorkspace(searchString)).block();
        assertNotNull(workspace, "Workspace should not be null");
        workspaceIds.add(workspace.getId());
        Application application = mockNonGitConnectedApplication(searchString, workspace);
        application = applicationPageService
                .createApplication(application, workspace.getId())
                .block();
        assertNotNull(application, "Application should not be null");
        applicationIds.add(application.getId());
        Mono<SearchEntityDTO> searchEntityDTOMono = searchEntitySolution.searchEntity(
                new String[] {Workspace.class.getSimpleName()}, searchString, 0, 10, true);

        StepVerifier.create(searchEntityDTOMono)
                .assertNext(searchEntityDTO -> {
                    assertThat(searchEntityDTO.getApplications()).hasSize(0);
                    assertThat(searchEntityDTO.getWorkspaces()).hasSize(1);

                    Workspace workspace1 = searchEntityDTO.getWorkspaces().get(0);
                    assertThat(workspace1.getName()).contains(searchString);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void searchEntity_fetchApplications_entriesPresentWithSearchString_returnsPaginatedResult() {
        final String searchString = UUID.randomUUID().toString();
        Workspace workspace =
                workspaceService.create(mockWorkspace(searchString)).block();
        assertNotNull(workspace, "Workspace should not be null");
        workspaceIds.add(workspace.getId());
        Application application = mockNonGitConnectedApplication(searchString, workspace);
        application = applicationPageService
                .createApplication(application, workspace.getId())
                .block();
        assertNotNull(application, "Application should not be null");
        applicationIds.add(application.getId());

        Mono<SearchEntityDTO> searchEntityDTOMono = searchEntitySolution.searchEntity(
                new String[] {Application.class.getSimpleName()}, searchString, 0, 10, true);

        StepVerifier.create(searchEntityDTOMono)
                .assertNext(searchEntityDTO -> {
                    assertThat(searchEntityDTO.getApplications()).hasSize(1);
                    assertThat(searchEntityDTO.getWorkspaces()).hasSize(0);

                    Application application1 = searchEntityDTO.getApplications().get(0);
                    assertThat(application1.getName()).isEqualTo(searchString + "_application");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void searchEntity_fetchApplicationWithDefaultBranch_entriesPresentWithSearchString_returnsPaginatedResult() {
        final String searchString = UUID.randomUUID().toString();
        Workspace workspace =
                workspaceService.create(mockWorkspace(searchString)).block();
        assertNotNull(workspace, "Workspace should not be null");
        workspaceIds.add(workspace.getId());

        Application defaultApplication = mockGitConnectedApplication("main", "main", searchString, workspace);
        defaultApplication = applicationPageService
                .createApplication(defaultApplication, workspace.getId())
                .block();
        assert defaultApplication != null;
        applicationIds.add(defaultApplication.getId());
        GitArtifactMetadata metadata = defaultApplication.getGitApplicationMetadata();
        metadata.setDefaultApplicationId(defaultApplication.getId());
        applicationService.save(defaultApplication).block();

        Application childBranch = mockGitConnectedApplication("feat/test", "main", searchString, workspace);
        applicationPageService.createApplication(childBranch, workspace.getId()).block();
        GitArtifactMetadata metadata1 = childBranch.getGitApplicationMetadata();
        metadata1.setDefaultApplicationId(defaultApplication.getId());

        applicationService.save(childBranch).block();

        Mono<SearchEntityDTO> searchEntityDTOMono =
                searchEntitySolution.searchEntity(new String[] {}, searchString, 0, 10, true);

        StepVerifier.create(searchEntityDTOMono)
                .assertNext(searchEntityDTO -> {
                    assertThat(searchEntityDTO.getWorkspaces()).hasSize(1);
                    Workspace workspace1 = searchEntityDTO.getWorkspaces().get(0);
                    assertThat(workspace1.getName()).contains(searchString);

                    assertThat(searchEntityDTO.getApplications()).hasSize(1);
                    Application application1 = searchEntityDTO.getApplications().get(0);
                    assertThat(application1.getName()).contains(searchString);
                })
                .verifyComplete();
    }

    private static Application mockGitConnectedApplication(
            String branchName, String defaultBranchName, String searchString, Workspace workspace) {
        Application application = new Application();
        application.setName(searchString + "_application");
        application.setWorkspaceId(workspace.getId());
        GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
        gitArtifactMetadata.setBranchName(branchName);
        gitArtifactMetadata.setDefaultBranchName(defaultBranchName);
        gitArtifactMetadata.setRemoteUrl("git@test.com:user/testRepo.git");
        application.setGitApplicationMetadata(gitArtifactMetadata);
        return application;
    }

    private static Application mockNonGitConnectedApplication(String searchString, Workspace workspace) {
        Application application = new Application();
        application.setName(searchString + "_application");
        application.setWorkspaceId(workspace.getId());
        return application;
    }

    private static Workspace mockWorkspace(String searchString) {
        Workspace workspace = new Workspace();
        workspace.setName(searchString + "_workspace");
        return workspace;
    }
}
