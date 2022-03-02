package com.appsmith.server.solutions;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.dtos.OrganizationApplicationsDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.UserService;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_ORGANIZATIONS;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;

@RunWith(SpringRunner.class)
public class ApplicationFetcherUnitTest {
    @MockBean
    OrganizationService organizationService;

    @MockBean
    SessionUserService sessionUserService;

    @MockBean
    UserService userService;

    @MockBean
    UserDataService userDataService;

    @MockBean
    ApplicationRepository applicationRepository;

    @MockBean
    ReleaseNotesService releaseNotesService;

    @MockBean
    ResponseUtils responseUtils;

    @MockBean
    NewPageService newPageService;

    ApplicationFetcher applicationFetcher;

    User testUser;

    final static String defaultPageId = "defaultPageId";

    @Before
    public void setup() {
        applicationFetcher = new ApplicationFetcherImpl(sessionUserService,
                userService,
                userDataService,
                organizationService,
                applicationRepository,
                releaseNotesService,
                responseUtils,
                newPageService
                );
    }

    private List<Application> createDummyApplications(int orgCount, int appCount) {
        List<Application> applicationList = new ArrayList<>(orgCount * appCount);
        for(int i = 1; i <= orgCount; i++) {
            for (int j = 1; j <= appCount; j++) {
                Application application = new Application();
                application.setOrganizationId("org-" + i);
                application.setId("org-" + i + "-app-" + j); // e.g. org-1-app-3
                application.setName(application.getId()); // e.g. org-1-app-3
                // Set dummy applicationPages
                ApplicationPage unpublishedPage = new ApplicationPage();
                unpublishedPage.setId("page" + j);
                unpublishedPage.setDefaultPageId("page" + j);
                unpublishedPage.setIsDefault(true);

                ApplicationPage publishedPage = new ApplicationPage();
                publishedPage.setId("page" + j);
                publishedPage.setDefaultPageId("page" + j);
                publishedPage.setIsDefault(true);

                application.setPages(List.of(unpublishedPage));
                application.setPublishedPages(List.of(publishedPage));
                applicationList.add(application);
            }
        }
        return applicationList;
    }

    private List<NewPage> createDummyPages(int orgCount, int appCount) {
        List<NewPage> newPageList = new ArrayList<>(orgCount * appCount);
        for(int i = 1; i <= orgCount; i++) {
            for (int j = 1; j <= appCount; j++) {
                String applicationId = "org-" + i + "-app-" + j;
                String pageId = "page" + j;
                // Set dummy applicationPages
                ApplicationPage applicationPage = new ApplicationPage();
                applicationPage.setId(pageId);
                applicationPage.setDefaultPageId(defaultPageId);
                applicationPage.setIsDefault(true);

                PageDTO unpublishedPageDTO = new PageDTO();
                unpublishedPageDTO.setSlug(pageId + "-unpublished-slug");

                PageDTO publishedPageDTO = new PageDTO();
                publishedPageDTO.setSlug(pageId + "-published-slug");

                NewPage newPage = new NewPage();
                newPage.setApplicationId(applicationId);
                newPage.setId(pageId);
                newPage.setUnpublishedPage(unpublishedPageDTO);
                newPage.setPublishedPage(publishedPageDTO);
                newPageList.add(newPage);
            }
        }
        return newPageList;
    }

    private Application updateDefaultPageIdsWithinApplication(Application application) {
        application.getPublishedPages().forEach(page -> page.setId(page.getDefaultPageId()));
        application.getPages().forEach(page -> page.setId(page.getDefaultPageId()));
        return application;
    }

    private List<Organization> createDummyOrganizations() {
        List<Organization> organizationList = new ArrayList<>(4);
        for(int i = 1; i <= 4; i++) {
            Organization organization = new Organization();
            organization.setId("org-" + i);
            organization.setName(organization.getId());
            organizationList.add(organization);
        }
        return organizationList;
    }

    private void initMocks() {
        testUser = new User();
        testUser.setEmail("application-fetcher-test-user");
        testUser.setIsAnonymous(false);
        testUser.setOrganizationIds(Set.of("org-1", "org-2", "org-3", "org-4"));

        Mockito.when(sessionUserService.getCurrentUser()).thenReturn(Mono.just(testUser));
        Mockito.when(userService.findByEmail(testUser.getEmail())).thenReturn(Mono.just(testUser));
        Mockito.when(organizationService.findByIdsIn(testUser.getOrganizationIds(), READ_ORGANIZATIONS))
                .thenReturn(Flux.fromIterable(createDummyOrganizations()));
        Mockito.when(releaseNotesService.getReleaseNodes()).thenReturn(Mono.empty());
        Mockito.when(releaseNotesService.computeNewFrom(any())).thenReturn("0");
        Mockito.when(userDataService.ensureViewedCurrentVersionReleaseNotes(testUser)).thenReturn(Mono.just(testUser));
    }

    @Test
    public void getAllApplications_NoRecentOrgAndApps_AllEntriesReturned() {
        initMocks();
        // mock the user data to return recently used orgs and apps
        UserData userData = new UserData();
        Mockito.when(userDataService.getForCurrentUser()).thenReturn(Mono.just(userData));

        // mock the list of applications
        List<Application> applications = createDummyApplications(4,4);
        List<NewPage> pageList = createDummyPages(4, 4);

        Mockito.when(applicationRepository.findByMultipleOrganizationIds(
                testUser.getOrganizationIds(), READ_APPLICATIONS)
        ).thenReturn(Flux.fromIterable(applications));

        Mockito.when(newPageService.findPageSlugsByApplicationIds(anyList(), eq(READ_PAGES)))
                .thenReturn(Flux.fromIterable(pageList));

        for (Application application : applications) {
            Mockito
                    .when(responseUtils.updateApplicationWithDefaultResources(application))
                    .thenReturn(updateDefaultPageIdsWithinApplication(application));
        }

        StepVerifier.create(applicationFetcher.getAllApplications())
                .assertNext(userHomepageDTO -> {
                    List<OrganizationApplicationsDTO> dtos = userHomepageDTO.getOrganizationApplications();
                    assertThat(dtos.size()).isEqualTo(4);
                    for (OrganizationApplicationsDTO dto : dtos) {
                        assertThat(dto.getApplications().size()).isEqualTo(4);
                        List<Application> applicationList = dto.getApplications();
                        for (Application application : applicationList) {
                            application.getPages().forEach(
                                    page -> assertThat(page.getSlug()).isEqualTo(page.getId()+"-unpublished-slug")
                            );
                            application.getPublishedPages().forEach(
                                    page -> assertThat(page.getSlug()).isEqualTo(page.getId()+"-published-slug")
                            );
                        }
                    }
                }).verifyComplete();
    }

    @Test
    public void getAllApplications_WhenUserHasRecentOrgAndApp_RecentEntriesComeFirst() {
        initMocks();
        // mock the user data to return recently used orgs and apps
        UserData userData = new UserData();
        userData.setRecentlyUsedOrgIds(List.of("org-2", "org-4"));
        userData.setRecentlyUsedAppIds(List.of("org-2-app-2", "org-2-app-1", "org-4-app-3"));
        Mockito.when(userDataService.getForCurrentUser()).thenReturn(Mono.just(userData));

        // mock the list of applications
        List<Application> applications = createDummyApplications(4,4);
        List<NewPage> pageList = createDummyPages(4, 4);

        Mockito.when(applicationRepository.findByMultipleOrganizationIds(
                testUser.getOrganizationIds(), READ_APPLICATIONS)
        ).thenReturn(Flux.fromIterable(applications));

        Mockito.when(newPageService.findPageSlugsByApplicationIds(anyList(), eq(READ_PAGES)))
                .thenReturn(Flux.fromIterable(pageList));

        for (Application application : applications) {
            Mockito
                    .when(responseUtils.updateApplicationWithDefaultResources(application))
                    .thenReturn(updateDefaultPageIdsWithinApplication(application));
        }

        StepVerifier.create(applicationFetcher.getAllApplications())
                .assertNext(userHomepageDTO -> {
                    List<OrganizationApplicationsDTO> organizationApplications = userHomepageDTO.getOrganizationApplications();
                    assertThat(organizationApplications).isNotNull();
                    assertThat(organizationApplications.size()).isEqualTo(4);

                    // apps under first org should be sorted as org-2-app-2, org-2-app-1, org-2-app-3, org-2-app-4
                    checkAppsAreSorted(organizationApplications.get(0).getApplications(),
                            List.of("org-2-app-2", "org-2-app-1", "org-2-app-3", "org-2-app-4")
                    );

                    // apps should be sorted as org-4-app-3, org-4-app-1, org-4-app-2, org-4-app-4
                    checkAppsAreSorted(organizationApplications.get(1).getApplications(),
                            List.of("org-4-app-3", "org-4-app-1", "org-4-app-2", "org-4-app-4")
                    );

                    // rest two orgs should have apps sorted in default order e.g. 1,2,3,4
                    String org3AppPrefix = organizationApplications.get(2).getOrganization().getId() + "-app-";
                    checkAppsAreSorted(organizationApplications.get(2).getApplications(),
                            List.of(org3AppPrefix+"1", org3AppPrefix+"2", org3AppPrefix+"3", org3AppPrefix+"4")
                    );
                    String org4AppPrefix = organizationApplications.get(3).getOrganization().getId() + "-app-";
                    checkAppsAreSorted(organizationApplications.get(3).getApplications(),
                            List.of(org4AppPrefix+"1", org4AppPrefix+"2", org4AppPrefix+"3", org4AppPrefix+"4")
                    );
                }).verifyComplete();
    }

    @Test
    public void getAllApplications_WhenUserHasRecentOrgButNoRecentApp_AppsAreSortedInDefaultOrder() {
        initMocks();
        // mock the user data to return recently used orgs and apps
        UserData userData = new UserData();
        userData.setRecentlyUsedOrgIds(List.of("org-3", "org-1"));
        Mockito.when(userDataService.getForCurrentUser()).thenReturn(Mono.just(userData));

        // mock the list of applications
        List<Application> applications = createDummyApplications(3,3);
        List<NewPage> pageList = createDummyPages(4, 4);

        Mockito.when(applicationRepository.findByMultipleOrganizationIds(
                testUser.getOrganizationIds(), READ_APPLICATIONS)
        ).thenReturn(Flux.fromIterable(applications));

        Mockito.when(newPageService.findPageSlugsByApplicationIds(anyList(), eq(READ_PAGES)))
                .thenReturn(Flux.fromIterable(pageList));

        for (Application application : applications) {
            Mockito
                    .when(responseUtils.updateApplicationWithDefaultResources(application))
                    .thenReturn(updateDefaultPageIdsWithinApplication(application));
        }

        StepVerifier.create(applicationFetcher.getAllApplications())
                .assertNext(userHomepageDTO -> {
                    List<OrganizationApplicationsDTO> organizationApplications = userHomepageDTO.getOrganizationApplications();
                    assertThat(organizationApplications).isNotNull();
                    assertThat(organizationApplications.size()).isEqualTo(4);

                    // apps under first org should be sorted as 1,2,3
                    checkAppsAreSorted(organizationApplications.get(0).getApplications(),
                            List.of("org-3-app-1", "org-3-app-2", "org-3-app-3")
                    );

                    // apps under second org should be sorted as 1,2,3
                    checkAppsAreSorted(organizationApplications.get(1).getApplications(),
                            List.of("org-1-app-1", "org-1-app-2", "org-1-app-3")
                    );
                }).verifyComplete();
    }

    /**
     * Asserts that provided list of applications are sorted as per the provided id list
     * @param appIds list of string as application ids
     */
    private void checkAppsAreSorted(List<Application> applications, List<String> appIds) {
        for(int i = 0; i < applications.size(); i++) {
            assertThat(applications.get(i).getId()).isEqualTo(appIds.get(i));
        }
    }
}