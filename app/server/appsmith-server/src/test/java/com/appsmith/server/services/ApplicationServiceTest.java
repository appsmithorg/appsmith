package com.appsmith.server.services;

import com.appsmith.external.helpers.AppsmithBeanUtils;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.JSValue;
import com.appsmith.external.models.Policy;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.PluginType;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.ApplicationAccessDTO;
import com.appsmith.server.dtos.ApplicationPagesDTO;
import com.appsmith.server.dtos.OrganizationApplicationsDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.dtos.UserHomepageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.helpers.TextUtils;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.solutions.ApplicationFetcher;
import com.appsmith.server.solutions.ImportExportApplicationService;
import com.appsmith.server.solutions.ReleaseNotesService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpMethod;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.function.Tuple2;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.EXECUTE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.EXECUTE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.MANAGE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.MANAGE_PAGES;
import static com.appsmith.server.acl.AclPermission.READ_ACTIONS;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static com.appsmith.server.constants.FieldName.DEFAULT_PAGE_LAYOUT;
import static com.appsmith.server.services.ApplicationPageServiceImpl.EVALUATION_VERSION;
import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringRunner.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class ApplicationServiceTest {

    @Autowired
    ApplicationService applicationService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    UserService userService;

    @Autowired
    OrganizationService organizationService;

    @Autowired
    DatasourceService datasourceService;

    @Autowired
    PluginService pluginService;

    @Autowired
    NewActionService newActionService;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    @Autowired
    ApplicationFetcher applicationFetcher;

    @Autowired
    NewPageService newPageService;

    @Autowired
    NewPageRepository newPageRepository;

    @Autowired
    ApplicationRepository applicationRepository;

    @Autowired
    LayoutActionService layoutActionService;

    @Autowired
    LayoutCollectionService layoutCollectionService;

    @Autowired
    ActionCollectionService actionCollectionService;

    @Autowired
    PluginRepository pluginRepository;

    @Autowired
    PolicyUtils policyUtils;

    @Autowired
    ImportExportApplicationService importExportApplicationService;

    @Autowired
    ThemeService themeService;

    @MockBean
    ReleaseNotesService releaseNotesService;

    @MockBean
    PluginExecutor pluginExecutor;

    String orgId;

    static Plugin testPlugin = new Plugin();

    static Datasource testDatasource = new Datasource();

    static Application gitConnectedApp = new Application();

    @Before
    @WithUserDetails(value = "api_user")
    public void setup() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));
        User apiUser = userService.findByEmail("api_user").block();
        orgId = apiUser.getOrganizationIds().iterator().next();
        if (StringUtils.isEmpty(gitConnectedApp.getId())) {
            gitConnectedApp.setOrganizationId(orgId);
            GitApplicationMetadata gitData = new GitApplicationMetadata();
            gitData.setBranchName("testBranch");
            gitData.setRepoName("testRepo");
            gitData.setRemoteUrl("git@test.com:user/testRepo.git");
            gitData.setRepoName("testRepo");
            gitConnectedApp.setGitApplicationMetadata(gitData);
            // This will be altered in update app by branch test
            gitConnectedApp.setName("gitConnectedApp");
            gitConnectedApp = applicationPageService.createApplication(gitConnectedApp)
                    .flatMap(application -> {
                        application.getGitApplicationMetadata().setDefaultApplicationId(application.getId());
                        return applicationService.save(application);
                    })
                    // Assign the branchName to all the resources connected to the application
                    .flatMap(application -> importExportApplicationService.exportApplicationById(application.getId(), gitData.getBranchName()))
                    .flatMap(applicationJson -> importExportApplicationService.importApplicationInOrganization(orgId, applicationJson, gitConnectedApp.getId(), gitData.getBranchName()))
                    .block();

            testPlugin = pluginService.findByName("Installed Plugin Name").block();

            Datasource datasource = new Datasource();
            datasource.setName("Clone App with action Test");
            datasource.setPluginId(testPlugin.getId());
            DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
            datasourceConfiguration.setUrl("http://test.com");
            datasource.setDatasourceConfiguration(datasourceConfiguration);
            datasource.setOrganizationId(orgId);
            testDatasource = datasourceService.create(datasource).block();
        }
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createApplicationWithNullName() {
        Application application = new Application();
        Mono<Application> applicationMono = Mono.just(application)
                .flatMap(app -> applicationPageService.createApplication(app, orgId));
        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.NAME)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createValidApplication() {
        Application testApplication = new Application();
        testApplication.setName("ApplicationServiceTest TestApp");
        Mono<Application> applicationMono = applicationPageService.createApplication(testApplication, orgId);

        Policy manageAppPolicy = Policy.builder().permission(MANAGE_APPLICATIONS.getValue())
                .users(Set.of("api_user"))
                .build();
        Policy readAppPolicy = Policy.builder().permission(READ_APPLICATIONS.getValue())
                .users(Set.of("api_user"))
                .build();

        StepVerifier
                .create(applicationMono.zipWith(themeService.getDefaultThemeId()))
                .assertNext(tuple2 -> {
                    Application application = tuple2.getT1();
                    String defaultThemeId = tuple2.getT2();
                    assertThat(application).isNotNull();
                    assertThat(application.getSlug()).isEqualTo(TextUtils.makeSlug(application.getName()));
                    assertThat(application.isAppIsExample()).isFalse();
                    assertThat(application.getId()).isNotNull();
                    assertThat(application.getName()).isEqualTo("ApplicationServiceTest TestApp");
                    assertThat(application.getPolicies()).isNotEmpty();
                    assertThat(application.getPolicies()).containsAll(Set.of(manageAppPolicy, readAppPolicy));
                    assertThat(application.getOrganizationId()).isEqualTo(orgId);
                    assertThat(application.getModifiedBy()).isEqualTo("api_user");
                    assertThat(application.getUpdatedAt()).isNotNull();
                    assertThat(application.getEvaluationVersion()).isEqualTo(EVALUATION_VERSION);
                    assertThat(application.getColor()).isNotEmpty();
                    assertThat(application.getEditModeThemeId()).isEqualTo(defaultThemeId);
                    assertThat(application.getPublishedModeThemeId()).isEqualTo(defaultThemeId);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void defaultPageCreateOnCreateApplicationTest() {
        Application testApplication = new Application();
        testApplication.setName("ApplicationServiceTest TestAppForTestingPage");
        Flux<PageDTO> pagesFlux = applicationPageService
                .createApplication(testApplication, orgId)
                // Fetch the unpublished pages by applicationId
                .flatMapMany(application -> newPageService.findByApplicationId(application.getId(), READ_PAGES, false));

        Policy managePagePolicy = Policy.builder().permission(MANAGE_PAGES.getValue())
                .users(Set.of("api_user"))
                .build();
        Policy readPagePolicy = Policy.builder().permission(READ_PAGES.getValue())
                .users(Set.of("api_user"))
                .build();

        StepVerifier
                .create(pagesFlux)
                .assertNext(page -> {
                    assertThat(page).isNotNull();
                    assertThat(page.getName()).isEqualTo(FieldName.DEFAULT_PAGE_NAME);
                    assertThat(page.getLayouts()).isNotEmpty();
                    assertThat(page.getPolicies()).isNotEmpty();
                    assertThat(page.getPolicies().containsAll(Set.of(managePagePolicy, readPagePolicy)));
                })
                .verifyComplete();
    }

    /* Tests for Get Application Flow */

    @Test
    @WithUserDetails(value = "api_user")
    public void getApplicationInvalidId() {
        Mono<Application> applicationMono = applicationService.getById("random-id");
        StepVerifier.create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.NO_RESOURCE_FOUND.getMessage(FieldName.APPLICATION, "random-id")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getApplicationNullId() {
        Mono<Application> applicationMono = applicationService.getById(null);
        StepVerifier.create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.ID)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void validGetApplicationById() {
        Application application = new Application();
        application.setName("validGetApplicationById-Test");
        Mono<Application> createApplication = applicationPageService.createApplication(application, orgId);
        Mono<Application> getApplication = createApplication.flatMap(t -> applicationService.getById(t.getId()));
        StepVerifier.create(getApplication)
                .assertNext(t -> {
                    assertThat(t).isNotNull();
                    assertThat(t.isAppIsExample()).isFalse();
                    assertThat(t.getId()).isNotNull();
                    assertThat(t.getName()).isEqualTo("validGetApplicationById-Test");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void validGetApplicationsByName() {
        Application application = new Application();
        application.setName("validGetApplicationByName-Test");
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.set(FieldName.NAME, application.getName());

        Mono<Application> createApplication = applicationPageService.createApplication(application, orgId);

        Flux<Application> getApplication = createApplication.flatMapMany(t -> applicationService.get(params));
        StepVerifier.create(getApplication)
                .assertNext(t -> {
                    assertThat(t).isNotNull();
                    assertThat(t.isAppIsExample()).isFalse();
                    assertThat(t.getId()).isNotNull();
                    assertThat(t.getName()).isEqualTo("validGetApplicationByName-Test");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getApplicationByDefaultIdAndBranchName_emptyBranchName_success() {
        Mono<Application> applicationMono = applicationService.findByBranchNameAndDefaultApplicationId("", gitConnectedApp.getId(), READ_APPLICATIONS);
        StepVerifier.create(applicationMono)
                .assertNext(application -> {
                    assertThat(application.getId()).isEqualTo(gitConnectedApp.getId());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getApplicationByDefaultIdAndBranchName_invalidBranchName_throwException() {
        Mono<Application> applicationMono = applicationService.findByBranchNameAndDefaultApplicationId("randomBranch", gitConnectedApp.getId(), READ_APPLICATIONS);
        StepVerifier.create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.NO_RESOURCE_FOUND.getMessage(FieldName.APPLICATION, gitConnectedApp.getId() + "," + "randomBranch")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getApplicationByDefaultIdAndBranchName_validBranchName_success() {
        Mono<Application> applicationMono = applicationService.findByBranchNameAndDefaultApplicationId("testBranch", gitConnectedApp.getId(), READ_APPLICATIONS);
        StepVerifier.create(applicationMono)
                .assertNext(application -> {
                    assertThat(application.getGitApplicationMetadata()).isEqualTo(gitConnectedApp.getGitApplicationMetadata());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getApplicationsByBranchName_validBranchName_success() {
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.set(FieldName.DEFAULT_RESOURCES + "." + FieldName.BRANCH_NAME, gitConnectedApp.getGitApplicationMetadata().getBranchName());

        Flux<Application> getApplication = applicationService.get(params);
        StepVerifier.create(getApplication)
                .assertNext(t -> {
                    assertThat(t).isNotNull();
                    assertThat(t.getGitApplicationMetadata().getBranchName()).isEqualTo(gitConnectedApp.getGitApplicationMetadata().getBranchName());
                    assertThat(t.getId()).isEqualTo(gitConnectedApp.getId());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void validGetApplications() {
        Application application = new Application();
        application.setName("validGetApplications-Test");

        Policy readAppPolicy = Policy.builder().permission(READ_APPLICATIONS.getValue())
                .users(Set.of("api_user"))
                .build();
        Mono<Application> createApplication = applicationPageService.createApplication(application, orgId);
        List<Application> applicationList = createApplication
                .flatMapMany(t -> applicationService.get(new LinkedMultiValueMap<>()))
                .collectList()
                .block();

        assertThat(applicationList.size() > 0);
        applicationList
                .stream()
                .filter(t -> t.getName().equals("validGetApplications-Test"))
                .forEach(t -> {
                    assertThat(t.getId()).isNotNull();
                    assertThat(t.isAppIsExample()).isFalse();
                    assertThat(t.getPolicies()).isNotEmpty();
                    assertThat(t.getPolicies()).containsAll(Set.of(readAppPolicy));
                });
    }

    /* Tests for Update Application Flow */
    @Test
    @WithUserDetails(value = "api_user")
    public void validUpdateApplication() {
        Application application = new Application();
        application.setName("validUpdateApplication-Test");

        Mono<Application> createApplication =
                applicationPageService
                        .createApplication(application, orgId);
        Mono<Application> updateApplication = createApplication
                .map(t -> {
                    t.setName("NewValidUpdateApplication-Test");
                    return t;
                })
                .flatMap(t -> applicationService.update(t.getId(), t))
                .flatMap(t -> applicationService.getById(t.getId()));

        StepVerifier.create(updateApplication)
                .assertNext(t -> {
                    assertThat(t).isNotNull();
                    assertThat(t.getId()).isNotNull();
                    assertThat(t.getPolicies()).isNotEmpty();
                    assertThat(t.getName()).isEqualTo("NewValidUpdateApplication-Test");
                    assertThat(t.getSlug()).isEqualTo(TextUtils.makeSlug(t.getName()));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void invalidUpdateApplication() {
        Application testApp1 = new Application();
        testApp1.setName("validApplication1");
        Application testApp2 = new Application();
        testApp2.setName("validApplication2");

        Mono<List<Application>> createMultipleApplications = Mono.zip(
            applicationPageService.createApplication(testApp1, orgId),
            applicationPageService.createApplication(testApp2, orgId))
            .map(tuple -> List.of(tuple.getT1(), tuple.getT2()));

            Mono<Application> updateInvalidApplication = createMultipleApplications
            .map(applicationList -> {
                Application savedTestApp1 = applicationList.get(0);
                Application savedTestApp2 = applicationList.get(1);
                savedTestApp2.setName(savedTestApp1.getName());
                return savedTestApp2;
            })
            .flatMap(t -> applicationService.update(t.getId(), t));

        StepVerifier.create(updateInvalidApplication)
            .expectErrorMatches(throwable -> throwable instanceof AppsmithException)
            .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void updateApplicationByIdAndBranchName_validBranchName_success() {
        gitConnectedApp.setName("updatedGitConnectedApplication");

        Mono<Application> updateApplication = applicationService.update(gitConnectedApp.getId(), gitConnectedApp)
                .flatMap(t -> {
                    GitApplicationMetadata gitData = t.getGitApplicationMetadata();
                    return applicationService.findByBranchNameAndDefaultApplicationId(gitData.getBranchName(), gitData.getDefaultApplicationId(), READ_APPLICATIONS);
                });

        StepVerifier.create(updateApplication)
                .assertNext(t -> {
                    assertThat(t).isNotNull();
                    assertThat(t.getId()).isNotNull();
                    assertThat(t.getPolicies()).isNotEmpty();
                    assertThat(t.getName()).isEqualTo("updatedGitConnectedApplication");
                    assertThat(t.getSlug()).isEqualTo(TextUtils.makeSlug(t.getName()));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void reuseDeletedAppName() {
        Application firstApp = new Application();
        firstApp.setName("Ghost app");

        Application secondApp = new Application();
        secondApp.setName("Ghost app");

        Mono<Application> firstAppDeletion = applicationPageService
                .createApplication(firstApp, orgId)
                .flatMap(app -> applicationService.archive(app))
                .cache();

        Mono<Application> secondAppCreation = firstAppDeletion.then(
                applicationPageService.createApplication(secondApp, orgId));

        StepVerifier
                .create(Mono.zip(firstAppDeletion, secondAppCreation))
                .assertNext(tuple2 -> {
                    Application first = tuple2.getT1(), second = tuple2.getT2();
                    assertThat(first.getName()).isEqualTo("Ghost app");
                    assertThat(second.getName()).isEqualTo("Ghost app");
                    assertThat(first.isDeleted()).isTrue();
                    assertThat(second.isDeleted()).isFalse();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getAllApplicationsForHome() {
        Mockito.when(releaseNotesService.getReleaseNodes()).thenReturn(Mono.empty());

        Mono<UserHomepageDTO> allApplications = applicationFetcher.getAllApplications();

        StepVerifier
                .create(allApplications)
                .assertNext(userHomepageDTO -> {
                    assertThat(userHomepageDTO).isNotNull();
                    //In case of anonymous user, we should have errored out. Assert that the user is not anonymous.
                    assertThat(userHomepageDTO.getUser().getIsAnonymous()).isFalse();

                    List<OrganizationApplicationsDTO> organizationApplicationsDTOs = userHomepageDTO.getOrganizationApplications();
                    assertThat(organizationApplicationsDTOs.size()).isPositive();

                    for (OrganizationApplicationsDTO organizationApplicationDTO : organizationApplicationsDTOs) {
                        if (organizationApplicationDTO.getOrganization().getName().equals("Spring Test Organization")) {
                            assertThat(organizationApplicationDTO.getOrganization().getUserPermissions()).contains("read:organizations");

                            Application application = organizationApplicationDTO.getApplications().get(0);
                            assertThat(application.getUserPermissions()).contains("read:applications");
                            assertThat(application.isAppIsExample()).isFalse();

                            assertThat(organizationApplicationDTO.getUserRoles().get(0).getRole().getName()).isEqualTo("Administrator");
                            log.debug(organizationApplicationDTO.getUserRoles().toString());
                        }
                    }


                })
                .verifyComplete();

    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getOnlyDefaultApplicationsConnectedToGitForHome() {
        Mockito.when(releaseNotesService.getReleaseNodes()).thenReturn(Mono.empty());

        Mono<UserHomepageDTO> allApplications = applicationFetcher.getAllApplications();

        Application branchedApplication = new Application();
        GitApplicationMetadata childBranchGitData = new GitApplicationMetadata();
        AppsmithBeanUtils.copyNestedNonNullProperties(gitConnectedApp.getGitApplicationMetadata(), childBranchGitData);
        childBranchGitData.setBranchName("childBranch");
        branchedApplication.setGitApplicationMetadata(childBranchGitData);
        branchedApplication.setOrganizationId(orgId);
        branchedApplication.setName(gitConnectedApp.getName());

        Mono<Application> branchedApplicationMono = applicationPageService.createApplication(branchedApplication);

        Mono<List<Application>> gitConnectedAppsMono = applicationService.findByOrganizationId(orgId, READ_APPLICATIONS)
                .filter(application -> application.getGitApplicationMetadata() != null)
                .collectList();

        StepVerifier
                .create(branchedApplicationMono
                        .then(Mono.zip(allApplications, gitConnectedAppsMono)))
                .assertNext(tuple -> {
                    UserHomepageDTO userHomepageDTO = tuple.getT1();
                    List<Application> gitConnectedApps = tuple.getT2();
                    assertThat(userHomepageDTO).isNotNull();
                    //In case of anonymous user, we should have errored out. Assert that the user is not anonymous.
                    assertThat(userHomepageDTO.getUser().getIsAnonymous()).isFalse();

                    List<OrganizationApplicationsDTO> organizationApplicationsDTOs = userHomepageDTO.getOrganizationApplications();
                    assertThat(organizationApplicationsDTOs.size()).isPositive();

                    for (OrganizationApplicationsDTO organizationApplicationDTO : organizationApplicationsDTOs) {
                        if (organizationApplicationDTO.getOrganization().getId().equals(orgId)) {
                            List<Application> applications = organizationApplicationDTO
                                    .getApplications()
                                    .stream()
                                    .filter(application -> application.getGitApplicationMetadata() != null)
                                    .collect(Collectors.toList());
                            assertThat(applications).hasSize(1);
                            assertThat(applications.get(0).getId()).isEqualTo(gitConnectedApp.getId());
                            assertThat(gitConnectedApps).hasSize(2);
                        }
                    }
                })
                .verifyComplete();

    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void getAllApplicationsForHomeWhenNoApplicationPresent() {
        Mockito.when(releaseNotesService.getReleaseNodes()).thenReturn(Mono.empty());

        // Create an organization for this user first.
        Organization organization = new Organization();
        organization.setName("usertest's organization");
        Mono<Organization> organizationMono = organizationService.create(organization);

        Mono<UserHomepageDTO> allApplications = organizationMono
                .then(applicationFetcher.getAllApplications());

        StepVerifier
                .create(allApplications)
                .assertNext(userHomepageDTO -> {
                    assertThat(userHomepageDTO).isNotNull();
                    //In case of anonymous user, we should have errored out. Assert that the user is not anonymous.
                    assertThat(userHomepageDTO.getUser().getIsAnonymous()).isFalse();

                    List<OrganizationApplicationsDTO> organizationApplications = userHomepageDTO.getOrganizationApplications();

                    // There should be atleast one organization present in the output.
                    OrganizationApplicationsDTO orgAppDto = organizationApplications.get(0);
                    assertThat(orgAppDto.getOrganization().getUserPermissions().contains("read:organizations"));
                })
                .verifyComplete();

    }

    @Test
    @WithUserDetails(value = "api_user")
    public void validMakeApplicationPublic() {
        Application application = new Application();
        application.setName("validMakeApplicationPublic-Test");

        Policy manageAppPolicy = Policy.builder().permission(MANAGE_APPLICATIONS.getValue())
                .users(Set.of("api_user"))
                .build();
        Policy readAppPolicy = Policy.builder().permission(READ_APPLICATIONS.getValue())
                .users(Set.of("api_user", FieldName.ANONYMOUS_USER))
                .build();

        Policy managePagePolicy = Policy.builder().permission(MANAGE_PAGES.getValue())
                .users(Set.of("api_user"))
                .build();
        Policy readPagePolicy = Policy.builder().permission(READ_PAGES.getValue())
                .users(Set.of("api_user", FieldName.ANONYMOUS_USER))
                .build();

        Application createdApplication = applicationPageService.createApplication(application, orgId).block();

        ApplicationAccessDTO applicationAccessDTO = new ApplicationAccessDTO();
        applicationAccessDTO.setPublicAccess(true);

        Mono<Application> publicAppMono = applicationService
                .changeViewAccess(createdApplication.getId(), applicationAccessDTO)
                .cache();

        Mono<PageDTO> pageMono = publicAppMono
                .flatMap(app -> {
                    String pageId = app.getPages().get(0).getId();
                    return newPageService.findPageById(pageId, READ_PAGES, false);
                });

        StepVerifier
                .create(Mono.zip(publicAppMono, pageMono))
                .assertNext(tuple -> {
                    Application publicApp = tuple.getT1();
                    PageDTO page = tuple.getT2();

                    assertThat(publicApp.getIsPublic()).isTrue();
                    assertThat(publicApp.getPolicies()).containsAll(Set.of(manageAppPolicy, readAppPolicy));

                    // Check the child page's policies
                    assertThat(page.getPolicies()).containsAll(Set.of(managePagePolicy, readPagePolicy));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void validMakeApplicationPrivate() {
        Application application = new Application();
        application.setName("validMakeApplicationPrivate-Test");

        Policy manageAppPolicy = Policy.builder().permission(MANAGE_APPLICATIONS.getValue())
                .users(Set.of("api_user"))
                .build();
        Policy readAppPolicy = Policy.builder().permission(READ_APPLICATIONS.getValue())
                .users(Set.of("api_user"))
                .build();

        Policy managePagePolicy = Policy.builder().permission(MANAGE_PAGES.getValue())
                .users(Set.of("api_user"))
                .build();
        Policy readPagePolicy = Policy.builder().permission(READ_PAGES.getValue())
                .users(Set.of("api_user"))
                .build();

        Mono<Application> createApplication = applicationPageService.createApplication(application, orgId);

        ApplicationAccessDTO applicationAccessDTO = new ApplicationAccessDTO();
        Mono<Application> privateAppMono = createApplication
                .flatMap(application1 -> {
                    applicationAccessDTO.setPublicAccess(true);
                    return applicationService.changeViewAccess(application1.getId(), applicationAccessDTO);
                })
                .flatMap(application1 -> {
                    applicationAccessDTO.setPublicAccess(false);
                    return applicationService.changeViewAccess(application1.getId(), applicationAccessDTO);
                })
                .cache();

        Mono<PageDTO> pageMono = privateAppMono
                .flatMap(app -> {
                    String pageId = app.getPages().get(0).getId();
                    return newPageService.findPageById(pageId, READ_PAGES, false);
                });

        StepVerifier
                .create(Mono.zip(privateAppMono, pageMono))
                .assertNext(tuple -> {
                    Application app = tuple.getT1();
                    PageDTO page = tuple.getT2();

                    assertThat(app.getIsPublic()).isFalse();
                    assertThat(app.getPolicies()).containsAll(Set.of(manageAppPolicy, readAppPolicy));

                    // Check the child page's policies
                    assertThat(page.getPolicies()).containsAll(Set.of(managePagePolicy, readPagePolicy));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void makeApplicationPublic_applicationWithGitMetadata_success() {

        Policy manageAppPolicy = Policy.builder().permission(MANAGE_APPLICATIONS.getValue())
                .users(Set.of("api_user"))
                .build();
        Policy readAppPolicy = Policy.builder().permission(READ_APPLICATIONS.getValue())
                .users(Set.of("api_user", FieldName.ANONYMOUS_USER))
                .build();

        Policy managePagePolicy = Policy.builder().permission(MANAGE_PAGES.getValue())
                .users(Set.of("api_user"))
                .build();
        Policy readPagePolicy = Policy.builder().permission(READ_PAGES.getValue())
                .users(Set.of("api_user", FieldName.ANONYMOUS_USER))
                .build();

        ApplicationAccessDTO applicationAccessDTO = new ApplicationAccessDTO();
        applicationAccessDTO.setPublicAccess(true);

        Mono<Application> publicAppMono = applicationService
                .changeViewAccess(gitConnectedApp.getId(), "testBranch", applicationAccessDTO)
                .cache();

        Mono<PageDTO> pageMono = publicAppMono
                .flatMap(app -> {
                    String pageId = app.getPages().get(0).getId();
                    return newPageService.findPageById(pageId, READ_PAGES, false);
                });

        StepVerifier
                .create(Mono.zip(publicAppMono, pageMono))
                .assertNext(tuple -> {
                    Application publicApp = tuple.getT1();
                    PageDTO page = tuple.getT2();

                    assertThat(publicApp.getIsPublic()).isTrue();
                    assertThat(publicApp.getPolicies()).containsAll(Set.of(manageAppPolicy, readAppPolicy));

                    // Check the child page's policies
                    assertThat(page.getPolicies()).containsAll(Set.of(managePagePolicy, readPagePolicy));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void makeApplicationPrivate_applicationWithGitMetadata_success() {
        Policy manageAppPolicy = Policy.builder().permission(MANAGE_APPLICATIONS.getValue())
                .users(Set.of("api_user"))
                .build();
        Policy readAppPolicy = Policy.builder().permission(READ_APPLICATIONS.getValue())
                .users(Set.of("api_user"))
                .build();

        Policy managePagePolicy = Policy.builder().permission(MANAGE_PAGES.getValue())
                .users(Set.of("api_user"))
                .build();
        Policy readPagePolicy = Policy.builder().permission(READ_PAGES.getValue())
                .users(Set.of("api_user"))
                .build();


        ApplicationAccessDTO applicationAccessDTO = new ApplicationAccessDTO();
        applicationAccessDTO.setPublicAccess(true);
        Mono<Application> privateAppMono = applicationService.changeViewAccess(gitConnectedApp.getId(), "testBranch", applicationAccessDTO)
                .flatMap(application1 -> {
                    applicationAccessDTO.setPublicAccess(false);
                    return applicationService.changeViewAccess(application1.getId(), applicationAccessDTO);
                })
                .cache();

        Mono<PageDTO> pageMono = privateAppMono
                .flatMap(app -> {
                    String pageId = app.getPages().get(0).getId();
                    return newPageService.findPageById(pageId, READ_PAGES, false);
                });

        StepVerifier
                .create(Mono.zip(privateAppMono, pageMono))
                .assertNext(tuple -> {
                    Application app = tuple.getT1();
                    PageDTO page = tuple.getT2();

                    assertThat(app.getIsPublic()).isFalse();
                    assertThat(app.getPolicies()).containsAll(Set.of(manageAppPolicy, readAppPolicy));

                    // Check the child page's policies
                    assertThat(page.getPolicies()).containsAll(Set.of(managePagePolicy, readPagePolicy));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void validMakeApplicationPublicWithActions() {

        Application application = new Application();
        application.setName("validMakeApplicationPublic-ExplicitDatasource-Test");

        Policy manageDatasourcePolicy = Policy.builder().permission(MANAGE_DATASOURCES.getValue())
                .users(Set.of("api_user"))
                .build();
        Policy readDatasourcePolicy = Policy.builder().permission(READ_DATASOURCES.getValue())
                .users(Set.of("api_user"))
                .build();
        Policy executeDatasourcePolicy = Policy.builder().permission(EXECUTE_DATASOURCES.getValue())
                .users(Set.of("api_user", FieldName.ANONYMOUS_USER))
                .build();

        Policy manageActionPolicy = Policy.builder().permission(MANAGE_ACTIONS.getValue())
                .users(Set.of("api_user"))
                .build();
        Policy readActionPolicy = Policy.builder().permission(READ_ACTIONS.getValue())
                .users(Set.of("api_user"))
                .build();
        Policy executeActionPolicy = Policy.builder().permission(EXECUTE_ACTIONS.getValue())
                .users(Set.of("api_user", FieldName.ANONYMOUS_USER))
                .build();

        Application createdApplication = applicationPageService.createApplication(application, orgId).block();

        String pageId = createdApplication.getPages().get(0).getId();

        Plugin plugin = pluginService.findByName("Installed Plugin Name").block();
        Datasource datasource = new Datasource();
        datasource.setName("Public App Test");
        datasource.setPluginId(plugin.getId());
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://test.com");
        datasource.setDatasourceConfiguration(datasourceConfiguration);
        datasource.setOrganizationId(orgId);

        Datasource savedDatasource = datasourceService.create(datasource).block();

        ActionDTO action = new ActionDTO();
        action.setName("Public App Test action");
        action.setPageId(pageId);
        action.setDatasource(savedDatasource);
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);

        ActionDTO savedAction = layoutActionService.createSingleAction(action).block();

        ApplicationAccessDTO applicationAccessDTO = new ApplicationAccessDTO();
        applicationAccessDTO.setPublicAccess(true);

        Plugin installedJsPlugin = pluginRepository.findByPackageName("installed-js-plugin").block();
        assert installedJsPlugin != null;

        ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
        actionCollectionDTO.setName("testActionCollection");
        actionCollectionDTO.setApplicationId(createdApplication.getId());
        actionCollectionDTO.setOrganizationId(orgId);
        actionCollectionDTO.setPageId(pageId);
        actionCollectionDTO.setPluginId(installedJsPlugin.getId());
        actionCollectionDTO.setPluginType(PluginType.JS);

        ActionCollectionDTO savedActionCollection = layoutCollectionService.createCollection(actionCollectionDTO).block();

        Mono<Application> publicAppMono = applicationService
                .changeViewAccess(createdApplication.getId(), applicationAccessDTO)
                .cache();

        Mono<Datasource> datasourceMono = publicAppMono
                .then(datasourceService.findById(savedDatasource.getId()));

        Mono<NewAction> actionMono = publicAppMono
                .then(newActionService.findById(savedAction.getId()));

        final Mono<ActionCollection> actionCollectionMono = publicAppMono
                .then(actionCollectionService.findById(savedActionCollection.getId(), READ_ACTIONS));

        StepVerifier
                .create(Mono.zip(datasourceMono, actionMono, actionCollectionMono))
                .assertNext(tuple -> {
                    Datasource datasource1 = tuple.getT1();
                    NewAction action1 = tuple.getT2();
                    final ActionCollection actionCollection1 = tuple.getT3();

                    // Check that the datasource used in the app contains public execute permission
                    assertThat(datasource1.getPolicies()).containsAll(Set.of(manageDatasourcePolicy, readDatasourcePolicy, executeDatasourcePolicy));

                    // Check that the action used in the app contains public execute permission
                    assertThat(action1.getPolicies()).containsAll(Set.of(manageActionPolicy, readActionPolicy, executeActionPolicy));

                    // Check that the action collection used in the app contains public execute permission
                    assertThat(actionCollection1.getPolicies()).containsAll(Set.of(manageActionPolicy, readActionPolicy, executeActionPolicy));

                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void cloneApplication_applicationWithGitMetadata_success() {

        final String branchName = gitConnectedApp.getGitApplicationMetadata().getBranchName();
        Mono<Application> clonedApplicationMono = applicationPageService.cloneApplication(gitConnectedApp.getId(), branchName)
                .cache();

        Policy manageAppPolicy = Policy.builder().permission(MANAGE_APPLICATIONS.getValue())
                .users(Set.of("api_user"))
                .build();
        Policy readAppPolicy = Policy.builder().permission(READ_APPLICATIONS.getValue())
                .users(Set.of("api_user"))
                .build();

        Mono<List<PageDTO>> clonedPageListMono = clonedApplicationMono
                .flatMapMany(application -> Flux.fromIterable(application.getPages()))
                .flatMap(applicationPage -> newPageService.findPageById(applicationPage.getId(), READ_PAGES, false))
                .collectList();

        Policy managePagePolicy = Policy.builder().permission(MANAGE_PAGES.getValue())
                .users(Set.of("api_user"))
                .build();
        Policy readPagePolicy = Policy.builder().permission(READ_PAGES.getValue())
                .users(Set.of("api_user"))
                .build();

        Mono<List<PageDTO>> srcPageListMono = Flux.fromIterable(gitConnectedApp.getPages())
                .flatMap(applicationPage -> newPageService.findPageById(applicationPage.getId(), READ_PAGES, false))
                .collectList();

        StepVerifier
                .create(Mono.zip(clonedApplicationMono, clonedPageListMono, srcPageListMono))
                .assertNext(tuple -> {
                    Application clonedApplication = tuple.getT1(); // cloned application
                    List<PageDTO> clonedPageList = tuple.getT2();
                    List<PageDTO> srcPageList = tuple.getT3();

                    assertThat(clonedApplication).isNotNull();
                    assertThat(clonedApplication.isAppIsExample()).isFalse();
                    assertThat(clonedApplication.getId()).isNotNull();
                    assertThat(clonedApplication.getName().equals("ApplicationServiceTest Clone Source TestApp Copy"));
                    assertThat(clonedApplication.getPolicies()).containsAll(Set.of(manageAppPolicy, readAppPolicy));
                    assertThat(clonedApplication.getOrganizationId().equals(orgId));
                    assertThat(clonedApplication.getModifiedBy()).isEqualTo("api_user");
                    assertThat(clonedApplication.getUpdatedAt()).isNotNull();
                    assertThat(clonedApplication.getEvaluationVersion()).isNotNull();
                    assertThat(clonedApplication.getEvaluationVersion()).isEqualTo(gitConnectedApp.getEvaluationVersion());

                    List<ApplicationPage> pages = clonedApplication.getPages();
                    Set<String> clonedPageIdsFromApplication = pages.stream().map(page -> page.getId()).collect(Collectors.toSet());
                    Set<String> clonedPageIdsFromDb = clonedPageList.stream().map(page -> page.getId()).collect(Collectors.toSet());

                    assertThat(clonedPageIdsFromApplication.containsAll(clonedPageIdsFromDb));

                    Set<String> srcPageIdsFromDb = srcPageList.stream().map(page -> page.getId()).collect(Collectors.toSet());
                    Set<String> defaultSrcPageIdsFromDb = srcPageList.stream().map(page -> page.getDefaultResources().getPageId()).collect(Collectors.toSet());
                    assertThat(Collections.disjoint(srcPageIdsFromDb, clonedPageIdsFromDb)).isTrue();

                    assertThat(clonedPageList).isNotEmpty();
                    for (PageDTO page : clonedPageList) {
                        assertThat(page.getPolicies()).containsAll(Set.of(managePagePolicy, readPagePolicy));
                        assertThat(page.getApplicationId()).isEqualTo(clonedApplication.getId());
                    }
                })
                .verifyComplete();

        // verify that Pages are cloned

        Mono<List<NewPage>> clonedNewPageListMono = clonedApplicationMono
                .flatMapMany(application -> Flux.fromIterable(application.getPages()))
                .flatMap(applicationPage -> newPageRepository.findById(applicationPage.getId()))
                .collectList();

        Mono<List<NewPage>> srcNewPageListMono = Flux.fromIterable(gitConnectedApp.getPages())
                .flatMap(applicationPage -> newPageService.findByBranchNameAndDefaultPageId(branchName, applicationPage.getDefaultPageId(), READ_PAGES))
                .collectList();

        StepVerifier
                .create(Mono.zip(clonedNewPageListMono, srcNewPageListMono))
                .assertNext(tuple -> {
                    List<NewPage> clonedNewPageList = tuple.getT1();
                    List<NewPage> srcNewPageList = tuple.getT2();

                    List<String> clonedPageIdList = new ArrayList<>();
                    List<String> clonedDefaultPageIdList = new ArrayList<>();
                    clonedNewPageList
                            .forEach(newPage -> {
                                clonedPageIdList.add(newPage.getId());
                                clonedDefaultPageIdList.add(newPage.getDefaultResources().getPageId());
                                assertThat(newPage.getDefaultResources().getApplicationId()).isEqualTo(newPage.getApplicationId());
                                assertThat(newPage.getDefaultResources().getPageId()).isEqualTo(newPage.getId());
                            });

                    List<String> srcPageIdList = new ArrayList<>();
                    List<String> srcDefaultPageIdList = new ArrayList<>();
                    srcNewPageList
                            .forEach(newPage -> {
                                srcPageIdList.add(newPage.getId());
                                srcDefaultPageIdList.add(newPage.getDefaultResources().getPageId());
                                assertThat(newPage.getDefaultResources().getApplicationId()).isEqualTo(newPage.getApplicationId());
                                assertThat(newPage.getDefaultResources().getPageId()).isEqualTo(newPage.getId());
                            });

                    assertThat(clonedPageIdList).doesNotContainAnyElementsOf(srcPageIdList);
                    assertThat(clonedDefaultPageIdList).doesNotContainAnyElementsOf(srcDefaultPageIdList);
                })
                .verifyComplete();

        // verify that cloned Pages are not renamed

        Mono<List<String>> pageNameListMono = clonedPageListMono
                .flatMapMany(Flux::fromIterable)
                .map(PageDTO::getName)
                .collectList();

        Mono<List<String>> testPageNameListMono = clonedNewPageListMono
                .flatMapMany(Flux::fromIterable)
                .map(newPage -> newPage.getUnpublishedPage().getName())
                .collectList();

        StepVerifier
                .create(Mono.zip(pageNameListMono, testPageNameListMono))
                .assertNext(tuple -> {
                    List<String> pageNameList = tuple.getT1();
                    List<String> testPageNameList = tuple.getT2();

                    assertThat(pageNameList).containsExactlyInAnyOrderElementsOf(testPageNameList);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void cloneApplication_applicationWithGitMetadataAndActions_success() {

        final String branchName = gitConnectedApp.getGitApplicationMetadata().getBranchName();

        Policy manageActionPolicy = Policy.builder().permission(MANAGE_ACTIONS.getValue())
                .users(Set.of("api_user"))
                .build();
        Policy readActionPolicy = Policy.builder().permission(READ_ACTIONS.getValue())
                .users(Set.of("api_user"))
                .build();
        Policy executeActionPolicy = Policy.builder().permission(EXECUTE_ACTIONS.getValue())
                .users(Set.of("api_user"))
                .build();

        String pageId = gitConnectedApp.getPages().get(0).getId();

        ActionDTO action = new ActionDTO();
        action.setName("Clone App Test action");
        action.setPageId(pageId);
        action.setDatasource(testDatasource);
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);

        ActionDTO savedAction = layoutActionService.createSingleAction(action).block();

        Mono<Application> clonedApplicationMono = applicationPageService.cloneApplication(gitConnectedApp.getId(), branchName)
                .cache();

        Policy manageAppPolicy = Policy.builder().permission(MANAGE_APPLICATIONS.getValue())
                .users(Set.of("api_user"))
                .build();
        Policy readAppPolicy = Policy.builder().permission(READ_APPLICATIONS.getValue())
                .users(Set.of("api_user"))
                .build();

        Mono<List<NewAction>> clonedActionListMono = clonedApplicationMono
                .flatMapMany(application -> newActionService.findAllByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS, null))
                .collectList();

        Mono<List<NewAction>> srcActionListMono = newActionService.findAllByApplicationIdAndViewMode(gitConnectedApp.getId(), false, READ_ACTIONS, null)
                .collectList();

        StepVerifier
                .create(Mono.zip(clonedApplicationMono, clonedActionListMono, srcActionListMono))
                .assertNext(tuple -> {
                    Application clonedApplication = tuple.getT1(); // cloned application
                    List<NewAction> clonedActionList = tuple.getT2();
                    List<NewAction> srcActionList = tuple.getT3();

                    assertThat(clonedApplication.getPolicies()).containsAll(Set.of(manageAppPolicy, readAppPolicy));
                    assertThat(clonedApplication.getOrganizationId().equals(orgId));
                    assertThat(clonedApplication.getModifiedBy()).isEqualTo("api_user");
                    assertThat(clonedApplication.getUpdatedAt()).isNotNull();

                    Set<String> clonedPageId = clonedApplication.getPages().stream().map(page -> page.getId()).collect(Collectors.toSet());
                    Set<String> clonedActionIdsFromDb = clonedActionList.stream().map(action1 -> action1.getId()).collect(Collectors.toSet());
                    Set<String> clonedPageIdsInActionFromDb = clonedActionList.stream().map(action1 -> action1.getUnpublishedAction().getPageId()).collect(Collectors.toSet());
                    Set<String> defaultPageIdsInClonedActionFromDb = clonedActionList.stream().map(action1 -> action1.getUnpublishedAction().getDefaultResources().getPageId()).collect(Collectors.toSet());
                    Set<String> defaultClonedActionIdsFromDb = clonedActionList.stream().map(newAction -> newAction.getDefaultResources().getActionId()).collect(Collectors.toSet());

                    Set<String> srcActionIdsFromDb = srcActionList.stream().map(action1 -> action1.getId()).collect(Collectors.toSet());
                    Set<String> srcPageIdsInActionFromDb = srcActionList.stream().map(action1 -> action1.getUnpublishedAction().getPageId()).collect(Collectors.toSet());
                    Set<String> defaultPageIdsInSrcActionFromDb = srcActionList.stream().map(action1 -> action1.getUnpublishedAction().getDefaultResources().getPageId()).collect(Collectors.toSet());
                    Set<String> defaultSrcActionIdsFromDb = srcActionList.stream().map(newAction -> newAction.getDefaultResources().getActionId()).collect(Collectors.toSet());

                    assertThat(Collections.disjoint(clonedActionIdsFromDb, srcActionIdsFromDb)).isTrue();
                    assertThat(clonedPageId).containsAll(clonedPageIdsInActionFromDb);
                    assertThat(Collections.disjoint(defaultClonedActionIdsFromDb, defaultSrcActionIdsFromDb)).isTrue();
                    assertThat(Collections.disjoint(clonedPageIdsInActionFromDb, srcPageIdsInActionFromDb)).isTrue();
                    assertThat(Collections.disjoint(defaultPageIdsInClonedActionFromDb, defaultPageIdsInSrcActionFromDb)).isTrue();
                    assertThat(defaultPageIdsInClonedActionFromDb).isNotEmpty();

                    assertThat(clonedActionList).isNotEmpty();
                    assertThat(defaultClonedActionIdsFromDb).isNotEmpty();
                    for (NewAction newAction : clonedActionList) {
                        assertThat(newAction.getPolicies()).containsAll(Set.of(manageActionPolicy, readActionPolicy, executeActionPolicy));
                        assertThat(newAction.getApplicationId()).isEqualTo(clonedApplication.getId());
                        assertThat(newAction.getUnpublishedAction().getPageId()).isEqualTo(newAction.getUnpublishedAction().getDefaultResources().getPageId());
                    }
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void cloneApplication_withActionAndActionCollection_success() {
        Application testApplication = new Application();
        testApplication.setName("ApplicationServiceTest Clone Source TestApp");

        Mono<Application> originalApplicationMono = applicationPageService.createApplication(testApplication, orgId)
                .cache();

        Map<String, List<String>> originalResourceIds = new HashMap<>();
        Mono<Application> resultMono = originalApplicationMono
                .zipWhen(application -> newPageService.findPageById(application.getPages().get(0).getId(), READ_PAGES, false))
                .flatMap(tuple -> {
                    Application application = tuple.getT1();
                    PageDTO testPage = tuple.getT2();

                    ActionDTO action = new ActionDTO();
                    action.setName("cloneActionTest");
                    action.setPageId(application.getPages().get(0).getId());
                    action.setExecuteOnLoad(true);
                    ActionConfiguration actionConfiguration = new ActionConfiguration();
                    actionConfiguration.setHttpMethod(HttpMethod.GET);
                    action.setActionConfiguration(actionConfiguration);
                    action.setDatasource(testDatasource);

                    ObjectMapper objectMapper = new ObjectMapper();
                    JSONObject parentDsl = null;
                    try {
                        parentDsl = new JSONObject(objectMapper.readValue(DEFAULT_PAGE_LAYOUT, new TypeReference<HashMap<String, Object>>() {
                        }));
                    } catch (JsonProcessingException e) {
                        log.debug("Error while creating JSONObj from defaultPageLayout: ", e);
                    }

                    ArrayList children = (ArrayList) parentDsl.get("children");
                    JSONObject testWidget = new JSONObject();
                    testWidget.put("widgetName", "firstWidget");
                    JSONArray temp = new JSONArray();
                    temp.addAll(List.of(new JSONObject(Map.of("key", "testField"))));
                    testWidget.put("dynamicBindingPathList", temp);
                    testWidget.put("testField", "{{ cloneActionTest.data }}");
                    children.add(testWidget);

                    Layout layout = testPage.getLayouts().get(0);
                    layout.setDsl(parentDsl);

                    // Save actionCollection
                    ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
                    actionCollectionDTO.setName("testCollection1");
                    actionCollectionDTO.setPageId(application.getPages().get(0).getId());
                    actionCollectionDTO.setApplicationId(application.getId());
                    actionCollectionDTO.setOrganizationId(application.getOrganizationId());
                    actionCollectionDTO.setPluginId(testPlugin.getId());
                    actionCollectionDTO.setVariables(List.of(new JSValue("test", "String", "test", true)));
                    actionCollectionDTO.setBody("collectionBody");
                    ActionDTO action1 = new ActionDTO();
                    action1.setName("cloneActionCollection1");
                    action1.setActionConfiguration(new ActionConfiguration());
                    action1.getActionConfiguration().setBody("mockBody");
                    actionCollectionDTO.setActions(List.of(action1));
                    actionCollectionDTO.setPluginType(PluginType.JS);

                    return Mono.zip(
                            layoutCollectionService.createCollection(actionCollectionDTO),
                            layoutActionService.createSingleAction(action),
                            layoutActionService.updateLayout(testPage.getId(), layout.getId(), layout),
                            Mono.just(application)
                        );
                })
                .flatMap(tuple -> {
                    List<String> pageIds = new ArrayList<>(), collectionIds = new ArrayList<>();
                    collectionIds.add(tuple.getT1().getId());
                    tuple.getT4().getPages().forEach(page -> pageIds.add(page.getId()));

                    originalResourceIds.put("pageIds", pageIds);
                    originalResourceIds.put("collectionIds", collectionIds);
                    return newActionService.findAllByApplicationIdAndViewMode(tuple.getT4().getId(), false, READ_ACTIONS, null)
                            .collectList()
                            .flatMap(actionList -> {
                                List<String> actionIds = actionList.stream().map(BaseDomain::getId).collect(Collectors.toList());
                                originalResourceIds.put("actionIds", actionIds);
                                return applicationPageService.cloneApplication(tuple.getT4().getId(), null);
                            });
                })
                .cache();

        Policy manageAppPolicy = Policy.builder().permission(MANAGE_APPLICATIONS.getValue())
                .users(Set.of("api_user"))
                .build();
        Policy readAppPolicy = Policy.builder().permission(READ_APPLICATIONS.getValue())
                .users(Set.of("api_user"))
                .build();

        Policy managePagePolicy = Policy.builder().permission(MANAGE_PAGES.getValue())
                .users(Set.of("api_user"))
                .build();
        Policy readPagePolicy = Policy.builder().permission(READ_PAGES.getValue())
                .users(Set.of("api_user"))
                .build();

        StepVerifier.create(resultMono
                .zipWhen(application -> Mono.zip(
                        newActionService.findAllByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS, null).collectList(),
                        actionCollectionService.findAllByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS, null).collectList(),
                        newPageService.findNewPagesByApplicationId(application.getId(), READ_PAGES).collectList()
                )))
                .assertNext(tuple -> {
                    Application application = tuple.getT1(); // cloned application
                    List<NewAction> actionList = tuple.getT2().getT1();
                    List<ActionCollection> actionCollectionList = tuple.getT2().getT2();
                    List<NewPage> pageList = tuple.getT2().getT3();

                    assertThat(application).isNotNull();
                    assertThat(application.isAppIsExample()).isFalse();
                    assertThat(application.getId()).isNotNull();
                    assertThat(application.getName().equals("ApplicationServiceTest Clone Source TestApp Copy"));
                    assertThat(application.getPolicies()).containsAll(Set.of(manageAppPolicy, readAppPolicy));
                    assertThat(application.getOrganizationId().equals(orgId));
                    assertThat(application.getModifiedBy()).isEqualTo("api_user");
                    assertThat(application.getUpdatedAt()).isNotNull();
                    List<ApplicationPage> pages = application.getPages();
                    Set<String> pageIdsFromApplication = pages.stream().map(page -> page.getId()).collect(Collectors.toSet());
                    Set<String> pageIdsFromDb = pageList.stream().map(page -> page.getId()).collect(Collectors.toSet());

                    assertThat(pageIdsFromApplication.containsAll(pageIdsFromDb));

                    assertThat(pageList).isNotEmpty();
                    for (NewPage page : pageList) {
                        assertThat(page.getPolicies()).containsAll(Set.of(managePagePolicy, readPagePolicy));
                        assertThat(page.getApplicationId()).isEqualTo(application.getId());
                    }

                    assertThat(pageList).isNotEmpty();
                    pageList.forEach(newPage -> {
                        assertThat(newPage.getDefaultResources()).isNotNull();
                        assertThat(newPage.getDefaultResources().getPageId()).isEqualTo(newPage.getId());
                        assertThat(newPage.getDefaultResources().getApplicationId()).isEqualTo(application.getId());

                        newPage.getUnpublishedPage()
                                .getLayouts()
                                .forEach(layout ->
                                        layout.getLayoutOnLoadActions().forEach(dslActionDTOS -> {
                                            dslActionDTOS.forEach(actionDTO -> {
                                                assertThat(actionDTO.getId()).isEqualTo(actionDTO.getDefaultActionId());
                                            });
                                        })
                                );
                    });

                    assertThat(actionList).hasSize(2);
                    actionList.forEach(newAction -> {
                        assertThat(newAction.getDefaultResources()).isNotNull();
                        assertThat(newAction.getDefaultResources().getActionId()).isEqualTo(newAction.getId());
                        assertThat(newAction.getDefaultResources().getApplicationId()).isEqualTo(application.getId());

                        ActionDTO action = newAction.getUnpublishedAction();
                        assertThat(action.getDefaultResources()).isNotNull();
                        assertThat(action.getDefaultResources().getPageId()).isEqualTo(application.getPages().get(0).getId());
                        if (!StringUtils.isEmpty(action.getDefaultResources().getCollectionId())) {
                            assertThat(action.getDefaultResources().getCollectionId()).isEqualTo(action.getCollectionId());
                        }
                    });

                    assertThat(actionCollectionList).hasSize(1);
                    actionCollectionList.forEach(actionCollection -> {
                        assertThat(actionCollection.getDefaultResources()).isNotNull();
                        assertThat(actionCollection.getDefaultResources().getCollectionId()).isEqualTo(actionCollection.getId());
                        assertThat(actionCollection.getDefaultResources().getApplicationId()).isEqualTo(application.getId());

                        ActionCollectionDTO unpublishedCollection = actionCollection.getUnpublishedCollection();

                        assertThat(unpublishedCollection.getDefaultToBranchedActionIdsMap())
                                .hasSize(1);
                        unpublishedCollection.getDefaultToBranchedActionIdsMap().keySet()
                                .forEach(key ->
                                        assertThat(key).isEqualTo(unpublishedCollection.getDefaultToBranchedActionIdsMap().get(key))
                                );

                        assertThat(unpublishedCollection.getDefaultResources()).isNotNull();
                        assertThat(unpublishedCollection.getDefaultResources().getPageId())
                                .isEqualTo(application.getPages().get(0).getId());
                    });
                })
                .verifyComplete();

        // Check if the resources from original application are intact
        StepVerifier
                .create(originalApplicationMono
                .zipWhen(application -> Mono.zip(
                        newActionService.findAllByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS, null).collectList(),
                        actionCollectionService.findAllByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS, null).collectList(),
                        newPageService.findNewPagesByApplicationId(application.getId(), READ_PAGES).collectList()
                )))
                .assertNext(tuple -> {
                    List<NewAction> actionList = tuple.getT2().getT1();
                    List<ActionCollection> actionCollectionList = tuple.getT2().getT2();
                    List<NewPage> pageList = tuple.getT2().getT3();

                    List<String> pageIds = pageList.stream().map(BaseDomain::getId).collect(Collectors.toList());
                    List<String> actionIds = actionList.stream().map(BaseDomain::getId).collect(Collectors.toList());
                    List<String> collectionIds = actionCollectionList.stream().map(BaseDomain::getId).collect(Collectors.toList());

                    assertThat(originalResourceIds.get("pageIds")).containsAll(pageIds);
                    assertThat(originalResourceIds.get("actionIds")).containsAll(actionIds);
                    assertThat(originalResourceIds.get("collectionIds")).containsAll(collectionIds);
                })
                .verifyComplete();

        Mono<List<PageDTO>> pageListMono = resultMono
                .flatMapMany(application -> Flux.fromIterable(application.getPages()))
                .flatMap(applicationPage -> newPageService.findPageById(applicationPage.getId(), READ_PAGES, false))
                .collectList();

        // verify that Pages are cloned
        Mono<List<NewPage>> testPageListMono = originalApplicationMono
                .flatMapMany(application -> Flux.fromIterable(application.getPages()))
                .flatMap(applicationPage -> newPageRepository.findById(applicationPage.getId()))
                .collectList();

        Mono<List<String>> pageIdListMono = pageListMono
                .flatMapMany(Flux::fromIterable)
                .map(PageDTO::getId)
                .collectList();

        Mono<List<String>> testPageIdListMono = testPageListMono
                .flatMapMany(Flux::fromIterable)
                .map(NewPage::getId)
                .collectList();

        StepVerifier
                .create(Mono.zip(pageIdListMono, testPageIdListMono))
                .assertNext(tuple -> {
                    List<String> pageIdList = tuple.getT1();
                    List<String> testPageIdList = tuple.getT2();

                    assertThat(pageIdList).doesNotContainAnyElementsOf(testPageIdList);
                })
                .verifyComplete();

        // verify that cloned Pages are not renamed

        Mono<List<String>> pageNameListMono = pageListMono
                .flatMapMany(Flux::fromIterable)
                .map(PageDTO::getName)
                .collectList();

        Mono<List<String>> testPageNameListMono = testPageListMono
                .flatMapMany(Flux::fromIterable)
                .map(newPage -> newPage.getUnpublishedPage().getName())
                .collectList();

        StepVerifier
                .create(Mono.zip(pageNameListMono, testPageNameListMono))
                .assertNext(tuple -> {
                    List<String> pageNameList = tuple.getT1();
                    List<String> testPageNameList = tuple.getT2();

                    assertThat(pageNameList).containsExactlyInAnyOrderElementsOf(testPageNameList);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void basicPublishApplicationTest() {
        Application testApplication = new Application();
        String appName = "ApplicationServiceTest Publish Application";
        testApplication.setName(appName);
        testApplication.setAppLayout(new Application.AppLayout(Application.AppLayout.Type.DESKTOP));
        Mono<Application> applicationMono = applicationPageService.createApplication(testApplication, orgId)
                .flatMap(application -> applicationPageService.publish(application.getId(), true))
                .then(applicationService.findByName(appName, MANAGE_APPLICATIONS))
                .cache();

        Mono<List<NewPage>> applicationPagesMono = applicationMono
                .map(application -> application.getPages())
                .flatMapMany(Flux::fromIterable)
                .flatMap(applicationPage -> newPageService.findById(applicationPage.getId(), READ_PAGES))
                .collectList();

        StepVerifier
                .create(Mono.zip(applicationMono, applicationPagesMono))
                .assertNext(tuple -> {
                    Application application = tuple.getT1();
                    List<NewPage> pages = tuple.getT2();

                    assertThat(application).isNotNull();
                    assertThat(application.isAppIsExample()).isFalse();
                    assertThat(application.getId()).isNotNull();
                    assertThat(application.getName().equals(appName));
                    assertThat(application.getPages().size()).isEqualTo(1);
                    assertThat(application.getPublishedPages().size()).isEqualTo(1);

                    assertThat(pages.size()).isEqualTo(1);
                    NewPage newPage = pages.get(0);
                    assertThat(newPage.getUnpublishedPage().getName()).isEqualTo(newPage.getPublishedPage().getName());
                    assertThat(newPage.getUnpublishedPage().getLayouts().get(0).getId()).isEqualTo(newPage.getPublishedPage().getLayouts().get(0).getId());
                    assertThat(newPage.getUnpublishedPage().getLayouts().get(0).getDsl()).isEqualTo(newPage.getPublishedPage().getLayouts().get(0).getDsl());

                    assertThat(application.getPublishedAppLayout()).isEqualTo(application.getUnpublishedAppLayout());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void publishApplication_withGitConnectedApp_success() {
        GitApplicationMetadata gitData = gitConnectedApp.getGitApplicationMetadata();
        gitConnectedApp.setAppLayout(new Application.AppLayout(Application.AppLayout.Type.DESKTOP));

        Mono<Application> applicationMono = applicationService.update(gitConnectedApp.getId(), gitConnectedApp)
                .flatMap(updatedApp -> applicationPageService.publish(updatedApp.getId(), gitData.getBranchName(), true))
                .flatMap(application -> applicationService.findByBranchNameAndDefaultApplicationId(gitData.getBranchName(), gitData.getDefaultApplicationId(), MANAGE_APPLICATIONS))
                .cache();

        Mono<List<NewPage>> applicationPagesMono = applicationMono
                .map(application -> application.getPages())
                .flatMapMany(Flux::fromIterable)
                .flatMap(applicationPage -> newPageService.findById(applicationPage.getId(), READ_PAGES))
                .collectList();

        StepVerifier
                .create(Mono.zip(applicationMono, applicationPagesMono))
                .assertNext(tuple -> {
                    Application application = tuple.getT1();
                    List<NewPage> pages = tuple.getT2();

                    assertThat(application).isNotNull();
                    assertThat(application.getPages().size()).isEqualTo(1);
                    assertThat(application.getPublishedPages().size()).isEqualTo(1);

                    assertThat(pages.size()).isEqualTo(1);
                    NewPage newPage = pages.get(0);
                    assertThat(newPage.getUnpublishedPage().getName()).isEqualTo(newPage.getPublishedPage().getName());
                    assertThat(newPage.getUnpublishedPage().getLayouts().get(0).getId()).isEqualTo(newPage.getPublishedPage().getLayouts().get(0).getId());
                    assertThat(newPage.getUnpublishedPage().getLayouts().get(0).getDsl()).isEqualTo(newPage.getPublishedPage().getLayouts().get(0).getDsl());
                    assertThat(newPage.getDefaultResources()).isNotNull();

                    assertThat(application.getPublishedAppLayout()).isEqualTo(application.getUnpublishedAppLayout());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void deleteUnpublishedPageFromApplication() {
        Application testApplication = new Application();
        String appName = "ApplicationServiceTest Publish Application Delete Page";
        testApplication.setName(appName);
        Mono<Application> applicationMono = applicationPageService.createApplication(testApplication, orgId)
                .flatMap(application -> {
                    PageDTO page = new PageDTO();
                    page.setName("New Page");
                    page.setApplicationId(application.getId());
                    Layout defaultLayout = newPageService.createDefaultLayout();
                    List<Layout> layouts = new ArrayList<>();
                    layouts.add(defaultLayout);
                    page.setLayouts(layouts);
                    return applicationPageService.createPage(page);
                })
                .flatMap(page -> applicationPageService.publish(page.getApplicationId(), true))
                .then(applicationService.findByName(appName, MANAGE_APPLICATIONS))
                .cache();

        PageDTO newPage = applicationMono
                .flatMap(application -> newPageService
                        .findByNameAndApplicationIdAndViewMode("New Page", application.getId(), READ_PAGES, false)
                        .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "page")))
                        .flatMap(page -> applicationPageService.deleteUnpublishedPage(page.getId()))).block();

        ApplicationPage applicationPage = new ApplicationPage();
        applicationPage.setId(newPage.getId());
        applicationPage.setIsDefault(false);
        applicationPage.setDefaultPageId(newPage.getId());

        StepVerifier
                .create(applicationService.findById(newPage.getApplicationId(), MANAGE_APPLICATIONS))
                .assertNext(editedApplication -> {

                    List<ApplicationPage> publishedPages = editedApplication.getPublishedPages();
                    assertThat(publishedPages).size().isEqualTo(2);
                    assertThat(publishedPages).containsAnyOf(applicationPage);

                    List<ApplicationPage> editedApplicationPages = editedApplication.getPages();
                    assertThat(editedApplicationPages.size()).isEqualTo(1);
                    assertThat(editedApplicationPages).doesNotContain(applicationPage);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void deleteUnpublishedPage_FromApplicationConnectedToGit_success() {

        final String branchName = gitConnectedApp.getGitApplicationMetadata().getBranchName();
        PageDTO page = new PageDTO();
        page.setName("Test delete unPublish page test");
        page.setApplicationId(gitConnectedApp.getId());
        Layout defaultLayout = newPageService.createDefaultLayout();
        List<Layout> layouts = new ArrayList<>();
        layouts.add(defaultLayout);
        page.setLayouts(layouts);

        Mono<Application> applicationMono = applicationPageService.createPageWithBranchName(page, branchName)
                .flatMap(pageDTO -> applicationPageService.publish(pageDTO.getApplicationId(), branchName, true))
                .cache();

        PageDTO newPage = applicationMono
                .flatMap(application -> newPageService
                        .findByNameAndApplicationIdAndViewMode("Test delete unPublish page test", application.getId(), READ_PAGES, false)
                        .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "page")))
                        .flatMap(pageDTO -> applicationPageService.deleteUnpublishedPage(pageDTO.getId()))).block();

        ApplicationPage applicationPage = new ApplicationPage();
        applicationPage.setId(newPage.getId());
        applicationPage.setIsDefault(false);
        applicationPage.setDefaultPageId(newPage.getId());

        StepVerifier
                .create(applicationService.findById(newPage.getApplicationId(), MANAGE_APPLICATIONS))
                .assertNext(editedApplication -> {

                    List<ApplicationPage> publishedPages = editedApplication.getPublishedPages();
                    assertThat(publishedPages).size().isEqualTo(2);
                    assertThat(publishedPages).containsAnyOf(applicationPage);

                    List<ApplicationPage> editedApplicationPages = editedApplication.getPages();
                    assertThat(editedApplicationPages.size()).isEqualTo(1);
                    assertThat(editedApplicationPages).doesNotContain(applicationPage);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void changeDefaultPageForAPublishedApplication() {
        Application testApplication = new Application();
        String appName = "ApplicationServiceTest Publish Application Change Default Page";
        testApplication.setName(appName);
        Mono<Application> applicationMono = applicationPageService.createApplication(testApplication, orgId)
                .flatMap(application -> {
                    PageDTO page = new PageDTO();
                    page.setName("New Page");
                    page.setApplicationId(application.getId());
                    Layout defaultLayout = newPageService.createDefaultLayout();
                    List<Layout> layouts = new ArrayList<>();
                    layouts.add(defaultLayout);
                    page.setLayouts(layouts);
                    return applicationPageService.createPage(page);
                })
                .flatMap(page -> applicationPageService.publish(page.getApplicationId(), true))
                .then(applicationService.findByName(appName, MANAGE_APPLICATIONS))
                .cache();

        PageDTO newPage = applicationMono
                .flatMap(application -> newPageService
                        .findByNameAndApplicationIdAndViewMode("New Page", application.getId(), READ_PAGES, false)
                        .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "unpublishedEditedPage")))).block();

        Mono<Application> updatedDefaultPageApplicationMono = applicationMono
                .flatMap(application -> applicationPageService.makePageDefault(application.getId(), newPage.getId()));

        ApplicationPage publishedEditedPage = new ApplicationPage();
        publishedEditedPage.setId(newPage.getId());
        publishedEditedPage.setIsDefault(false);

        ApplicationPage unpublishedEditedPage = new ApplicationPage();
        unpublishedEditedPage.setId(newPage.getId());
        unpublishedEditedPage.setIsDefault(true);

        StepVerifier
                .create(updatedDefaultPageApplicationMono)
                .assertNext(editedApplication -> {

                    List<ApplicationPage> publishedPages = editedApplication.getPublishedPages();
                    assertThat(publishedPages).size().isEqualTo(2);
                    boolean isFound = false;
                    for( ApplicationPage page: publishedPages) {
                        if(page.getId().equals(publishedEditedPage.getId()) && page.getIsDefault().equals(publishedEditedPage.getIsDefault())) {
                            isFound = true;
                        }
                    }
                    assertThat(isFound).isTrue();

                    List<ApplicationPage> editedApplicationPages = editedApplication.getPages();
                    assertThat(editedApplicationPages.size()).isEqualTo(2);
                    isFound = false;
                    for( ApplicationPage page: editedApplicationPages) {
                        if(page.getId().equals(unpublishedEditedPage.getId()) && page.getIsDefault().equals(unpublishedEditedPage.getIsDefault())) {
                            isFound = true;
                        }
                    }
                    assertThat(isFound).isTrue();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getApplicationInViewMode() {
        Application testApplication = new Application();
        String appName = "ApplicationServiceTest Get Application In View Mode";
        testApplication.setName(appName);
        Mono<Application> applicationMono = applicationPageService.createApplication(testApplication, orgId)
                .flatMap(application -> {
                    PageDTO page = new PageDTO();
                    page.setName("New Page");
                    page.setApplicationId(application.getId());
                    Layout defaultLayout = newPageService.createDefaultLayout();
                    List<Layout> layouts = new ArrayList<>();
                    layouts.add(defaultLayout);
                    page.setLayouts(layouts);
                    return applicationPageService.createPage(page);
                })
                .flatMap(page -> applicationPageService.publish(page.getApplicationId(), true))
                .then(applicationService.findByName(appName, MANAGE_APPLICATIONS))
                .cache();

        PageDTO newPage = applicationMono
                .flatMap(application -> newPageService
                        .findByNameAndApplicationIdAndViewMode("New Page", application.getId(), READ_PAGES, false)
                        .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "page")))
                        .flatMap(page -> applicationPageService.deleteUnpublishedPage(page.getId()))).block();

        Mono<Application> viewModeApplicationMono = applicationMono
                .flatMap(application -> applicationService.getApplicationInViewMode(application.getId()));

        ApplicationPage applicationPage = new ApplicationPage();
        applicationPage.setId(newPage.getId());
        applicationPage.setIsDefault(false);

        StepVerifier
                .create(viewModeApplicationMono)
                .assertNext(viewApplication -> {
                    List<ApplicationPage> editedApplicationPages = viewApplication.getPages();
                    assertThat(editedApplicationPages.size()).isEqualTo(2);
                    boolean isFound = false;
                    for( ApplicationPage page: editedApplicationPages) {
                        if(page.getId().equals(applicationPage.getId()) && page.getIsDefault().equals(applicationPage.getIsDefault())) {
                            isFound = true;
                        }
                    }
                    assertThat(isFound).isTrue();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void validCloneApplicationWhenCancelledMidWay() {
        Mockito.when(pluginExecutor.getHintMessages(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));

        Application testApplication = new Application();
        String appName = "ApplicationServiceTest Clone Application Midway Cancellation";
        testApplication.setName(appName);

        Application originalApplication = applicationPageService.createApplication(testApplication, orgId)
                .block();

        String pageId = originalApplication.getPages().get(0).getId();

        Plugin plugin = pluginService.findByName("Installed Plugin Name").block();
        Datasource datasource = new Datasource();
        datasource.setName("Cloned App Test");
        datasource.setPluginId(plugin.getId());
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://test.com");
        datasource.setDatasourceConfiguration(datasourceConfiguration);
        datasource.setOrganizationId(orgId);

        Datasource savedDatasource = datasourceService.create(datasource).block();

        ActionDTO action1 = new ActionDTO();
        action1.setName("Clone App Test action1");
        action1.setPageId(pageId);
        action1.setDatasource(savedDatasource);
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action1.setActionConfiguration(actionConfiguration);

        ActionDTO savedAction1 = layoutActionService.createSingleAction(action1).block();

        ActionDTO action2 = new ActionDTO();
        action2.setName("Clone App Test action2");
        action2.setPageId(pageId);
        action2.setDatasource(savedDatasource);
        action2.setActionConfiguration(actionConfiguration);

        ActionDTO savedAction2 = layoutActionService.createSingleAction(action2).block();

        ActionDTO action3 = new ActionDTO();
        action3.setName("Clone App Test action3");
        action3.setPageId(pageId);
        action3.setDatasource(savedDatasource);
        action3.setActionConfiguration(actionConfiguration);

        ActionDTO savedAction3 = layoutActionService.createSingleAction(action3).block();

        // Testing JS Objects here
        ActionCollectionDTO actionCollectionDTO1 = new ActionCollectionDTO();
        actionCollectionDTO1.setName("testCollection1");
        actionCollectionDTO1.setPageId(pageId);
        actionCollectionDTO1.setApplicationId(originalApplication.getId());
        actionCollectionDTO1.setOrganizationId(orgId);
        actionCollectionDTO1.setPluginId(datasource.getPluginId());
        ActionDTO jsAction = new ActionDTO();
        jsAction.setName("jsFunc");
        jsAction.setActionConfiguration(new ActionConfiguration());
        jsAction.getActionConfiguration().setBody("mockBody");
        actionCollectionDTO1.setActions(List.of(jsAction));
        actionCollectionDTO1.setPluginType(PluginType.JS);

        final ActionCollectionDTO createdActionCollectionDTO1 = layoutCollectionService.createCollection(actionCollectionDTO1).block();

        // Trigger the clone of application now.
        applicationPageService.cloneApplication(originalApplication.getId(), null)
                .timeout(Duration.ofMillis(10))
                .subscribe();

        // Wait for cloning to complete
        Mono<Application> clonedAppFromDbMono = Mono.just(originalApplication)
                .flatMap(originalApp -> {
                    try {
                        // Before fetching the cloned application, sleep for 5 seconds to ensure that the cloning finishes
                        Thread.sleep(5000);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                    return applicationRepository.findByClonedFromApplicationId(originalApp.getId()).next();
                })
                .cache();

        // Find all actions in new app
        Mono<List<NewAction>> actionsMono = clonedAppFromDbMono
                .flatMap(clonedAppFromDb -> newActionService
                        .findAllByApplicationIdAndViewMode(clonedAppFromDb.getId(), false, READ_ACTIONS, null)
                        .collectList()
                );

        // Find all pages in new app
        Mono<List<PageDTO>> pagesMono = clonedAppFromDbMono
                .flatMapMany(application -> Flux.fromIterable(application.getPages()))
                .flatMap(applicationPage -> newPageService.findPageById(applicationPage.getId(), READ_PAGES, false))
                .collectList();

        // Find all action collections in new app
        final Mono<List<ActionCollection>> actionCollectionsMono = clonedAppFromDbMono
                .flatMap(clonedAppFromDb -> actionCollectionService
                        .findAllByApplicationIdAndViewMode(clonedAppFromDb.getId(), false, READ_ACTIONS, null)
                        .collectList()
                );

        StepVerifier
                .create(Mono.zip(clonedAppFromDbMono, actionsMono, pagesMono, actionCollectionsMono))
                .assertNext(tuple -> {
                    Application cloneApp = tuple.getT1();
                    List<NewAction> actions = tuple.getT2();
                    List<PageDTO> pages = tuple.getT3();
                    final List<ActionCollection> actionCollections = tuple.getT4();

                    assertThat(cloneApp).isNotNull();
                    assertThat(pages.get(0).getId()).isNotEqualTo(pageId);
                    assertThat(actions.size()).isEqualTo(4);
                    Set<String> actionNames = actions.stream().map(action -> action.getUnpublishedAction().getName()).collect(Collectors.toSet());
                    assertThat(actionNames).containsExactlyInAnyOrder("Clone App Test action1", "Clone App Test action2", "Clone App Test action3", "jsFunc");
                    assertThat(actionCollections.size()).isEqualTo(1);
                    Set<String> actionCollectionNames = actionCollections.stream().map(actionCollection -> actionCollection.getUnpublishedCollection().getName()).collect(Collectors.toSet());
                    assertThat(actionCollectionNames).containsExactlyInAnyOrder("testCollection1");
                })
                .verifyComplete();

    }

    @Test
    @WithUserDetails(value = "api_user")
    public void newApplicationShouldHavePublishedState() {
        Application testApplication = new Application();
        testApplication.setName("ApplicationServiceTest NewApp PublishedState");
        Mono<Application> applicationMono = applicationPageService.createApplication(testApplication, orgId).cache();

        Mono<PageDTO> publishedPageMono = applicationMono
                .flatMap(application -> {
                    List<ApplicationPage> publishedPages = application.getPublishedPages();
                    return applicationPageService.getPage(publishedPages.get(0).getId(), true);
                });

        StepVerifier
                .create(Mono.zip(applicationMono, publishedPageMono))
                .assertNext(tuple -> {
                    Application application = tuple.getT1();
                    PageDTO publishedPage = tuple.getT2();

                    // Assert that the application has 1 published page
                    assertThat(application.getPublishedPages()).hasSize(1);

                    // Assert that the published page and the unpublished page are one and the same
                    assertThat(application.getPages().get(0).getId()).isEqualTo(application.getPublishedPages().get(0).getId());

                    // Assert that the published page has 1 layout
                    assertThat(publishedPage.getLayouts()).hasSize(1);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void validGetApplicationPagesMultiPageApp() {
        Application app = new Application();
        app.setName("validGetApplicationPagesMultiPageApp-Test");

        Mono<Application> createApplicationMono = applicationPageService.createApplication(app, orgId)
                .cache();

        // Create all the pages for this application in a blocking manner.
        createApplicationMono
                .flatMap(application -> {
                    PageDTO testPage = new PageDTO();
                    testPage.setName("Page2");
                    testPage.setApplicationId(application.getId());
                    return applicationPageService.createPage(testPage)
                            .then(Mono.just(application));
                })
                .flatMap(application -> {
                    PageDTO testPage = new PageDTO();
                    testPage.setName("Page3");
                    testPage.setApplicationId(application.getId());
                    return applicationPageService.createPage(testPage)
                            .then(Mono.just(application));
                })
                .flatMap(application -> {
                    PageDTO testPage = new PageDTO();
                    testPage.setName("Page4");
                    testPage.setApplicationId(application.getId());
                    return applicationPageService.createPage(testPage);
                })
                .block();

        Mono<ApplicationPagesDTO> applicationPagesDTOMono = createApplicationMono
                .map(application -> application.getId())
                .flatMap(applicationId -> newPageService.findApplicationPagesByApplicationIdViewMode(applicationId, false, false));

        StepVerifier
                .create(applicationPagesDTOMono)
                .assertNext(applicationPagesDTO -> {
                    assertThat(applicationPagesDTO.getPages().size()).isEqualTo(4);
                    List<String> pageNames = applicationPagesDTO.getPages().stream().map(pageNameIdDTO -> pageNameIdDTO.getName()).collect(Collectors.toList());
                    List<String> slugNames = applicationPagesDTO.getPages().stream().map(pageNameIdDTO -> pageNameIdDTO.getSlug()).collect(Collectors.toList());
                    assertThat(pageNames).containsExactly("Page1", "Page2", "Page3", "Page4");
                    assertThat(slugNames).containsExactly("page1", "page2", "page3", "page4");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void validChangeViewAccessCancelledMidWay() {

        Application testApplication = new Application();
        String appName = "ApplicationServiceTest Public View Application Midway Cancellation";
        testApplication.setName(appName);

        Application originalApplication = applicationPageService.createApplication(testApplication, orgId)
                .block();

        String pageId = originalApplication.getPages().get(0).getId();

        Plugin plugin = pluginService.findByName("Installed Plugin Name").block();
        Datasource datasource = new Datasource();
        datasource.setName("Public View App Test");
        datasource.setPluginId(plugin.getId());
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://test.com");
        datasource.setDatasourceConfiguration(datasourceConfiguration);
        datasource.setOrganizationId(orgId);

        Datasource savedDatasource = datasourceService.create(datasource).block();

        ActionDTO action1 = new ActionDTO();
        action1.setName("Public View Test action1");
        action1.setPageId(pageId);
        action1.setDatasource(savedDatasource);
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action1.setActionConfiguration(actionConfiguration);

        ActionDTO savedAction1 = layoutActionService.createSingleAction(action1).block();

        ActionDTO action2 = new ActionDTO();
        action2.setName("Public View Test action2");
        action2.setPageId(pageId);
        action2.setDatasource(savedDatasource);
        action2.setActionConfiguration(actionConfiguration);

        ActionDTO savedAction2 = layoutActionService.createSingleAction(action2).block();

        ActionDTO action3 = new ActionDTO();
        action3.setName("Public View Test action3");
        action3.setPageId(pageId);
        action3.setDatasource(savedDatasource);
        action3.setActionConfiguration(actionConfiguration);

        ActionDTO savedAction3 = layoutActionService.createSingleAction(action3).block();

        ApplicationAccessDTO applicationAccessDTO = new ApplicationAccessDTO();
        applicationAccessDTO.setPublicAccess(true);

        // Trigger the change view access of application now.
        applicationService.changeViewAccess(originalApplication.getId(), applicationAccessDTO)
                .timeout(Duration.ofMillis(10))
                .subscribe();

        Mono<Application> applicationFromDbPostViewChange = Mono.just(originalApplication)
                .flatMap(originalApp -> {
                    try {
                        // Before fetching the public application, sleep for 5 seconds to ensure that the updating
                        // all appsmith objects with public permission finishes.
                        Thread.sleep(5000);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                    return applicationRepository.findById(originalApplication.getId(), READ_APPLICATIONS);
                })
                .cache();

        Mono<List<NewAction>> actionsMono = applicationFromDbPostViewChange
                .flatMap(clonedAppFromDb -> newActionService
                        .findAllByApplicationIdAndViewMode(clonedAppFromDb.getId(), false, READ_ACTIONS, null)
                        .collectList()
                );

        Mono<List<PageDTO>> pagesMono = applicationFromDbPostViewChange
                .flatMapMany(application -> Flux.fromIterable(application.getPages()))
                .flatMap(applicationPage -> newPageService.findPageById(applicationPage.getId(), READ_PAGES, false))
                .collectList();

        Mono<Datasource> datasourceMono = applicationFromDbPostViewChange
                .flatMap(application -> datasourceService.findById(savedDatasource.getId(), READ_DATASOURCES));

        StepVerifier
                .create(Mono.zip(applicationFromDbPostViewChange, actionsMono, pagesMono, datasourceMono))
                .assertNext(tuple -> {
                    Application updatedApplication = tuple.getT1();
                    List<NewAction> actions = tuple.getT2();
                    List<PageDTO> pages = tuple.getT3();
                    Datasource datasource1 = tuple.getT4();

                    assertThat(updatedApplication).isNotNull();
                    assertThat(updatedApplication.getIsPublic()).isTrue();
                    assertThat(updatedApplication
                            .getPolicies()
                            .stream()
                            .filter(policy -> policy.getPermission().equals(READ_APPLICATIONS.getValue()))
                            .findFirst()
                            .get()
                            .getUsers()
                    ).contains("anonymousUser");

                    for (PageDTO page : pages) {
                        assertThat(page
                                .getPolicies()
                                .stream()
                                .filter(policy -> policy.getPermission().equals(READ_PAGES.getValue()))
                                .findFirst()
                                .get()
                                .getUsers()
                        ).contains("anonymousUser");
                    }

                    for (NewAction action : actions) {
                        assertThat(action
                                .getPolicies()
                                .stream()
                                .filter(policy -> policy.getPermission().equals(EXECUTE_ACTIONS.getValue()))
                                .findFirst()
                                .get()
                                .getUsers()
                        ).contains("anonymousUser");
                    }


                    assertThat(datasource1
                            .getPolicies()
                            .stream()
                            .filter(policy -> policy.getPermission().equals(EXECUTE_DATASOURCES.getValue()))
                            .findFirst()
                            .get()
                            .getUsers()
                    ).contains("anonymousUser");

                })
                .verifyComplete();

    }

    @WithUserDetails("api_user")
    @Test
    public void saveLastEditInformation_WhenUserHasPermission_Updated() {
        Application testApplication = new Application();
        testApplication.setName("SaveLastEditInformation TestApp");
        testApplication.setModifiedBy("test-user");
        testApplication.setIsPublic(true);

        Mono<Application> updatedApplication = applicationPageService.createApplication(testApplication, orgId)
                .flatMap(application ->
                    applicationService.saveLastEditInformation(application.getId())
                );
        StepVerifier.create(updatedApplication).assertNext(application -> {
            assertThat(application.getLastUpdateTime()).isNotNull();
            assertThat(application.getPolicies()).isNotNull().isNotEmpty();
            assertThat(application.getModifiedBy()).isEqualTo("api_user");
            assertThat(application.getIsPublic()).isTrue();
        }).verifyComplete();
    }

    @WithUserDetails("api_user")
    @Test
    public void generateSshKeyPair_WhenDefaultApplicationIdNotSet_CurrentAppUpdated() {
        Application unsavedApplication = new Application();
        unsavedApplication.setOrganizationId(orgId);
        Map<String, Policy> policyMap = policyUtils.generatePolicyFromPermission(Set.of(MANAGE_APPLICATIONS), "api_user");
        unsavedApplication.setPolicies(Set.copyOf(policyMap.values()));
        unsavedApplication.setName("ssh-test-app");

        Mono<Application> applicationMono = applicationRepository.save(unsavedApplication)
                .flatMap(savedApplication -> applicationService.createOrUpdateSshKeyPair(savedApplication.getId())
                        .thenReturn(savedApplication.getId())
                ).flatMap(testApplicationId -> applicationRepository.findById(testApplicationId, MANAGE_APPLICATIONS));

        StepVerifier.create(applicationMono)
                .assertNext(testApplication -> {
                    GitAuth gitAuth = testApplication.getGitApplicationMetadata().getGitAuth();
                    assertThat(gitAuth.getPublicKey()).isNotNull();
                    assertThat(gitAuth.getPrivateKey()).isNotNull();
                    assertThat(gitAuth.getGeneratedAt()).isNotNull();
                    assertThat(testApplication.getGitApplicationMetadata().getDefaultApplicationId()).isNotNull();
                })
                .verifyComplete();
    }

    @WithUserDetails("api_user")
    @Test
    public void generateSshKeyPair_WhenDefaultApplicationIdSet_DefaultApplicationUpdated() {
        AclPermission perm = MANAGE_APPLICATIONS;
        Map<String, Policy> policyMap = policyUtils.generatePolicyFromPermission(Set.of(perm), "api_user");
        Set<Policy> policies = Set.copyOf(policyMap.values());

        Application unsavedMainApp = new Application();
        unsavedMainApp.setPolicies(policies);
        unsavedMainApp.setName("ssh-key-master-app");
        unsavedMainApp.setOrganizationId(orgId);

        Mono<Tuple2<Application, Application>> tuple2Mono = applicationRepository.save(unsavedMainApp)
                .flatMap(savedApplication -> applicationService.createOrUpdateSshKeyPair(savedApplication.getId()).thenReturn(savedApplication))
                .flatMap(savedMainApp -> {
                    Application unsavedChildApp = new Application();
                    unsavedChildApp.setGitApplicationMetadata(new GitApplicationMetadata());
                    unsavedChildApp.getGitApplicationMetadata().setDefaultApplicationId(savedMainApp.getId());
                    unsavedChildApp.setPolicies(policies);
                    unsavedChildApp.setName("ssh-key-child-app");
                    unsavedChildApp.setOrganizationId(orgId);
                    return applicationRepository.save(unsavedChildApp);
                })
                .flatMap(savedChildApp ->
                        applicationService.createOrUpdateSshKeyPair(savedChildApp.getId()).thenReturn(savedChildApp)
                )
                .flatMap(savedChildApp -> {
                    // fetch and return both child and main applications
                    String mainApplicationId = savedChildApp.getGitApplicationMetadata().getDefaultApplicationId();
                    Mono<Application> childAppMono = applicationRepository.findById(savedChildApp.getId(), perm);
                    Mono<Application> mainAppMono = applicationRepository.findById(mainApplicationId, perm);
                    return Mono.zip(childAppMono, mainAppMono);
                });

        StepVerifier.create(tuple2Mono)
                .assertNext(applicationTuple2 -> {
                    Application childApp = applicationTuple2.getT1();
                    Application mainApp = applicationTuple2.getT2();

                    // main app should have the generated keys
                    GitAuth gitAuth = mainApp.getGitApplicationMetadata().getGitAuth();
                    assertThat(gitAuth.getPublicKey()).isNotNull();
                    assertThat(gitAuth.getPrivateKey()).isNotNull();
                    assertThat(gitAuth.getGeneratedAt()).isNotNull();

                    // child app should have null as GitAuth inside the metadata
                    GitApplicationMetadata metadata = childApp.getGitApplicationMetadata();
                    assertThat(metadata.getDefaultApplicationId()).isEqualTo(mainApp.getId());
                    assertThat(metadata.getGitAuth()).isNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void deleteApplicationWithPagesAndActions() {

        Application testApplication = new Application();
        String appName = "deleteApplicationWithPagesAndActions";
        testApplication.setName(appName);

        Mono<NewAction> resultMono = applicationPageService.createApplication(testApplication, orgId)
                .flatMap(application -> {
                    PageDTO page = new PageDTO();
                    page.setName("New Page");
                    page.setApplicationId(application.getId());
                    Layout defaultLayout = newPageService.createDefaultLayout();
                    List<Layout> layouts = new ArrayList<>();
                    layouts.add(defaultLayout);
                    page.setLayouts(layouts);
                    return Mono.zip(
                            applicationPageService.createPage(page),
                            pluginRepository.findByPackageName("installed-plugin")
                    );
                })
                .flatMap(tuple -> {
                    final PageDTO page = tuple.getT1();
                    final Plugin installedPlugin = tuple.getT2();

                    final Datasource datasource = new Datasource();
                    datasource.setName("Default Database");
                    datasource.setOrganizationId(orgId);
                    datasource.setPluginId(installedPlugin.getId());
                    datasource.setDatasourceConfiguration(new DatasourceConfiguration());

                    ActionDTO action = new ActionDTO();
                    action.setName("validAction");
                    action.setPageId(page.getId());
                    action.setExecuteOnLoad(true);
                    ActionConfiguration actionConfiguration = new ActionConfiguration();
                    actionConfiguration.setHttpMethod(HttpMethod.GET);
                    action.setActionConfiguration(actionConfiguration);
                    action.setDatasource(datasource);

                    return layoutActionService.createSingleAction(action)
                            .flatMap(action1 -> {
                                return applicationService.findById(page.getApplicationId(), MANAGE_APPLICATIONS)
                                        .flatMap(application -> applicationPageService.deleteApplication(application.getId()))
                                        .flatMap(ignored -> newActionService.findById(action1.getId()));
                            });
                });

        StepVerifier
                .create(resultMono)
                // Since the action should be deleted, we exmpty the Mono to complete empty.
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void deleteApplication_withNullGitData_Success() {
        Application testApplication = new Application();
        String appName = "deleteApplication_withNullGitData_Success";
        testApplication.setName(appName);
        Application application = applicationPageService.createApplication(testApplication, orgId).block();

        Mono<Application> applicationMono = applicationPageService.deleteApplication(application.getId());

        StepVerifier
                .create(applicationMono)
                .assertNext(application1 -> {
                    assertThat(application1.isDeleted()).isTrue();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void deleteApplication_WithDeployKeysNotConnectedToRemote_Success() {
        Application testApplication = new Application();
        String appName = "deleteApplication_WithDeployKeysNotConnectedToRemote_Success";
        testApplication.setName(appName);
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPrivateKey("privateKey");
        gitAuth.setPublicKey("publicKey");
        gitApplicationMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        Application application = applicationPageService.createApplication(testApplication, orgId).block();

        Mono<Application> applicationMono = applicationPageService.deleteApplication(application.getId());

        StepVerifier
                .create(applicationMono)
                .assertNext(application1 -> {
                    assertThat(application1.isDeleted()).isTrue();
                })
                .verifyComplete();
    }

}
