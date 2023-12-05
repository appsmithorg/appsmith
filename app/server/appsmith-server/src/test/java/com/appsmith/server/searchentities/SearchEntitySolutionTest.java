package com.appsmith.server.searchentities;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.SearchEntityDTO;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.WorkspaceService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.UUID;

import static org.assertj.core.api.AssertionsForInterfaceTypes.assertThat;

@SpringBootTest
class SearchEntitySolutionTest {

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    SearchEntitySolution searchEntitySolution;

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
        assert workspace != null;
        Application application = mockNonGitConnectedApplication(searchString, workspace);
        applicationPageService.createApplication(application, workspace.getId()).block();
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

        // Clean up
        applicationPageService.deleteApplication(application.getId()).block();
        workspaceService.archiveById(workspace.getId()).block();
    }

    @Test
    @WithUserDetails("api_user")
    public void searchEntity_fetchAllEntities_nullSearchString_returnsPaginatedResult() {
        Workspace workspace = workspaceService
                .create(mockWorkspace(UUID.randomUUID().toString()))
                .block();
        assert workspace != null;
        Application application =
                mockNonGitConnectedApplication(UUID.randomUUID().toString(), workspace);
        applicationPageService.createApplication(application, workspace.getId()).block();
        Mono<SearchEntityDTO> searchEntityDTOMono =
                searchEntitySolution.searchEntity(new String[] {}, null, 0, 10, true);

        StepVerifier.create(searchEntityDTOMono)
                .assertNext(searchEntityDTO -> {
                    assertThat(searchEntityDTO.getApplications()).hasSize(1);
                    assertThat(searchEntityDTO.getWorkspaces()).hasSize(1);
                })
                .verifyComplete();

        // Clean up
        applicationPageService.deleteApplication(application.getId()).block();
        workspaceService.archiveById(workspace.getId()).block();
    }

    @Test
    @WithUserDetails("api_user")
    public void searchEntity_fetchWorkspaces_entriesPresentWithSearchString_returnsPaginatedResult() {
        final String searchString = UUID.randomUUID().toString();
        Workspace workspace =
                workspaceService.create(mockWorkspace(searchString)).block();
        assert workspace != null;
        Application application = mockNonGitConnectedApplication(searchString, workspace);
        applicationPageService.createApplication(application, workspace.getId()).block();
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

        // Clean up
        applicationPageService.deleteApplication(application.getId()).block();
        workspaceService.archiveById(workspace.getId()).block();
    }

    @Test
    @WithUserDetails("api_user")
    public void searchEntity_fetchApplications_entriesPresentWithSearchString_returnsPaginatedResult() {
        final String searchString = UUID.randomUUID().toString();
        Workspace workspace =
                workspaceService.create(mockWorkspace(searchString)).block();
        assert workspace != null;
        Application application = mockNonGitConnectedApplication(searchString, workspace);
        applicationPageService.createApplication(application, workspace.getId()).block();
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

        // Clean up
        applicationPageService.deleteApplication(application.getId()).block();
        workspaceService.archiveById(workspace.getId()).block();
    }

    @Test
    @WithUserDetails("api_user")
    public void searchEntity_fetchApplicationWithDefaultBranch_entriesPresentWithSearchString_returnsPaginatedResult() {
        final String searchString = UUID.randomUUID().toString();
        Workspace workspace =
                workspaceService.create(mockWorkspace(searchString)).block();
        assert workspace != null;
        Application defaultApplication = mockGitConnectedApplication("main", "main", searchString, workspace);
        defaultApplication = applicationPageService
                .createApplication(defaultApplication, workspace.getId())
                .block();
        assert defaultApplication != null;
        GitApplicationMetadata metadata = defaultApplication.getGitApplicationMetadata();
        metadata.setDefaultApplicationId(defaultApplication.getId());
        applicationService.save(defaultApplication).block();

        Application childBranch = mockGitConnectedApplication("feat/test", "main", searchString, workspace);
        applicationPageService.createApplication(childBranch, workspace.getId()).block();
        GitApplicationMetadata metadata1 = childBranch.getGitApplicationMetadata();
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

        // Clean up
        applicationPageService.deleteApplication(defaultApplication.getId()).block();
        workspaceService.archiveById(workspace.getId()).block();
    }

    private static Application mockGitConnectedApplication(
            String branchName, String defaultBranchName, String searchString, Workspace workspace) {
        Application application = new Application();
        application.setName(searchString + "_application");
        application.setWorkspaceId(workspace.getId());
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        gitApplicationMetadata.setBranchName(branchName);
        gitApplicationMetadata.setDefaultBranchName(defaultBranchName);
        gitApplicationMetadata.setRemoteUrl("git@test.com:user/testRepo.git");
        application.setGitApplicationMetadata(gitApplicationMetadata);
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
