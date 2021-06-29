package com.appsmith.server.services;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Policy;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.ApplicationAccessDTO;
import com.appsmith.server.dtos.ApplicationPagesDTO;
import com.appsmith.server.dtos.OrganizationApplicationsDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.dtos.PageNameIdDTO;
import com.appsmith.server.dtos.UserHomepageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.solutions.ApplicationFetcher;
import com.appsmith.server.solutions.ReleaseNotesService;
import lombok.extern.slf4j.Slf4j;
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
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
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

    @MockBean
    ReleaseNotesService releaseNotesService;

    String orgId;

    @Before
    @WithUserDetails(value = "api_user")
    public void setup() {
        User apiUser = userService.findByEmail("api_user").block();
        orgId = apiUser.getOrganizationIds().iterator().next();
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
                .create(applicationMono)
                .assertNext(application -> {
                    assertThat(application).isNotNull();
                    assertThat(application.isAppIsExample()).isFalse();
                    assertThat(application.getId()).isNotNull();
                    assertThat(application.getName().equals("ApplicationServiceTest TestApp"));
                    assertThat(application.getPolicies()).isNotEmpty();
                    assertThat(application.getPolicies()).containsAll(Set.of(manageAppPolicy, readAppPolicy));
                    assertThat(application.getOrganizationId().equals(orgId));
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
            .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                throwable.getMessage().equals(AppsmithError.DUPLICATE_KEY_USER_ERROR.getMessage(testApp1.getName(), FieldName.NAME)))
            .verify();
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
    public void validMakeApplicationPublicWithActions() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

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

        ActionDTO savedAction = layoutActionService.createAction(action).block();

        ApplicationAccessDTO applicationAccessDTO = new ApplicationAccessDTO();
        applicationAccessDTO.setPublicAccess(true);

        Mono<Application> publicAppMono = applicationService
                .changeViewAccess(createdApplication.getId(), applicationAccessDTO)
                .cache();

        Mono<Datasource> datasourceMono = publicAppMono
                .then(datasourceService.findById(savedDatasource.getId()));

        Mono<NewAction> actionMono = publicAppMono
                .then(newActionService.findById(savedAction.getId()));

        StepVerifier
                .create(Mono.zip(datasourceMono, actionMono))
                .assertNext(tuple -> {
                    Datasource datasource1 = tuple.getT1();
                    NewAction action1 = tuple.getT2();

                    // Check that the datasource used in the app contains public execute permission
                    assertThat(datasource1.getPolicies()).containsAll(Set.of(manageDatasourcePolicy, readDatasourcePolicy, executeDatasourcePolicy));

                    // Check that the action used in the app contains public execute permission
                    assertThat(action1.getPolicies()).containsAll(Set.of(manageActionPolicy, readActionPolicy, executeActionPolicy));

                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createCloneApplication() {
        Application testApplication = new Application();
        testApplication.setName("ApplicationServiceTest Clone Source TestApp");

        Mono<Application> testApplicationMono = applicationPageService.createApplication(testApplication, orgId)
                .cache();

        Mono<Application> applicationMono = testApplicationMono
                .flatMap(application -> applicationPageService.cloneApplication(application.getId()))
                .cache();

        Policy manageAppPolicy = Policy.builder().permission(MANAGE_APPLICATIONS.getValue())
                .users(Set.of("api_user"))
                .build();
        Policy readAppPolicy = Policy.builder().permission(READ_APPLICATIONS.getValue())
                .users(Set.of("api_user"))
                .build();

        Mono<List<PageDTO>> pageListMono = applicationMono
                .flatMapMany(application -> Flux.fromIterable(application.getPages()))
                .flatMap(applicationPage -> newPageService.findPageById(applicationPage.getId(), READ_PAGES, false))
                .collectList();

        Policy managePagePolicy = Policy.builder().permission(MANAGE_PAGES.getValue())
                .users(Set.of("api_user"))
                .build();
        Policy readPagePolicy = Policy.builder().permission(READ_PAGES.getValue())
                .users(Set.of("api_user"))
                .build();

        StepVerifier
                .create(Mono.zip(applicationMono, pageListMono))
                .assertNext(tuple -> {
                    Application application = tuple.getT1();
                    List<PageDTO> pageList = tuple.getT2();
                    assertThat(application).isNotNull();
                    assertThat(application.isAppIsExample()).isFalse();
                    assertThat(application.getId()).isNotNull();
                    assertThat(application.getName().equals("ApplicationServiceTest Clone Source TestApp Copy"));
                    assertThat(application.getPolicies()).containsAll(Set.of(manageAppPolicy, readAppPolicy));
                    assertThat(application.getOrganizationId().equals(orgId));
                    List<ApplicationPage> pages = application.getPages();
                    Set<String> pageIdsFromApplication = pages.stream().map(page -> page.getId()).collect(Collectors.toSet());
                    Set<String> pageIdsFromDb = pageList.stream().map(page -> page.getId()).collect(Collectors.toSet());

                    assertThat(pageIdsFromApplication.containsAll(pageIdsFromDb));

                    assertThat(pageList).isNotEmpty();
                    for (PageDTO page : pageList) {
                        assertThat(page.getPolicies()).containsAll(Set.of(managePagePolicy, readPagePolicy));
                        assertThat(page.getApplicationId()).isEqualTo(application.getId());
                    }
                })
                .verifyComplete();

        // verify that Pages are cloned

        Mono<List<NewPage>> testPageListMono = testApplicationMono
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
                .flatMap(application -> applicationPageService.publish(application.getId()))
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
                .flatMap(page -> applicationPageService.publish(page.getApplicationId()))
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
        applicationPage.setOrder(1);

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
                .flatMap(page -> applicationPageService.publish(page.getApplicationId()))
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
                .flatMap(page -> applicationPageService.publish(page.getApplicationId()))
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
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

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

        ActionDTO savedAction1 = layoutActionService.createAction(action1).block();

        ActionDTO action2 = new ActionDTO();
        action2.setName("Clone App Test action2");
        action2.setPageId(pageId);
        action2.setDatasource(savedDatasource);
        action2.setActionConfiguration(actionConfiguration);

        ActionDTO savedAction2 = layoutActionService.createAction(action2).block();

        ActionDTO action3 = new ActionDTO();
        action3.setName("Clone App Test action3");
        action3.setPageId(pageId);
        action3.setDatasource(savedDatasource);
        action3.setActionConfiguration(actionConfiguration);

        ActionDTO savedAction3 = layoutActionService.createAction(action3).block();

        // Trigger the clone of application now.
        applicationPageService.cloneApplication(originalApplication.getId())
                .timeout(Duration.ofMillis(10))
                .subscribe();

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

        Mono<List<NewAction>> actionsMono = clonedAppFromDbMono
                .flatMap(clonedAppFromDb -> newActionService
                        .findAllByApplicationIdAndViewMode(clonedAppFromDb.getId(), false, READ_ACTIONS, null)
                        .collectList()
                );

        Mono<List<PageDTO>> pagesMono = clonedAppFromDbMono
                .flatMapMany(application -> Flux.fromIterable(application.getPages()))
                .flatMap(applicationPage -> newPageService.findPageById(applicationPage.getId(), READ_PAGES, false))
                .collectList();

        StepVerifier
                .create(Mono.zip(clonedAppFromDbMono, actionsMono, pagesMono))
                .assertNext(tuple -> {
                    Application cloneApp = tuple.getT1();
                    List<NewAction> actions = tuple.getT2();
                    List<PageDTO> pages = tuple.getT3();

                    assertThat(cloneApp).isNotNull();
                    assertThat(pages.get(0).getId()).isNotEqualTo(pageId);
                    assertThat(actions.size()).isEqualTo(3);
                    Set<String> actionNames = actions.stream().map(action -> action.getUnpublishedAction().getName()).collect(Collectors.toSet());
                    assertThat(actionNames).containsExactlyInAnyOrder("Clone App Test action1", "Clone App Test action2", "Clone App Test action3");
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
                .flatMap(applicationId -> newPageService.findApplicationPagesByApplicationIdAndViewMode(applicationId, false));

        StepVerifier
                .create(applicationPagesDTOMono)
                .assertNext(applicationPagesDTO -> {
                    assertThat(applicationPagesDTO.getPages().size()).isEqualTo(4);
                    List<String> pageNames = applicationPagesDTO.getPages().stream().map(pageNameIdDTO -> pageNameIdDTO.getName()).collect(Collectors.toList());
                    assertThat(pageNames).containsExactly("Page1", "Page2", "Page3", "Page4");
                    Integer order = 0;
                    for(PageNameIdDTO page : applicationPagesDTO.getPages()){
                        assertThat(page.getOrder()).isEqualTo(order);
                        order++;
                    }
                })
                .verifyComplete();
    }
}
