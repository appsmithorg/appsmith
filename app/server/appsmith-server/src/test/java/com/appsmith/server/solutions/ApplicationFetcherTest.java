package com.appsmith.server.solutions;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.dtos.OrganizationApplicationsDTO;
import com.appsmith.server.repositories.ApplicationRepository;
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
import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringRunner.class)
public class ApplicationFetcherTest {
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

    ApplicationFetcher applicationFetcher;


    @Before
    public void setUp() {
        applicationFetcher = new ApplicationFetcher(
                sessionUserService,
                userService,
                userDataService,
                organizationService,
                applicationRepository,
                releaseNotesService
        );
    }

    private List<Application> createDummyApplications() {
        List<Application> applicationList = new ArrayList<>(16);
        for(int i = 1; i <= 4; i++) {
            for (int j = 1; j <= 4; j++) {
                Application application = new Application();
                application.setOrganizationId("org-" + i);
                application.setId("org-" + i + "-app-" + j); // e.g. org-1-app-3
                application.setName(application.getId()); // e.g. org-1-app-3
                applicationList.add(application);
            }
        }
        return applicationList;
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

    @Test
    public void getAllApplications_WhenUserHasRecentOrgAndApp_RecentEntriesComeFirst() {
        User testUser = new User();
        testUser.setEmail("application-fetcher-test-user");
        testUser.setIsAnonymous(false);
        testUser.setOrganizationIds(Set.of("org-1", "org-2", "org-3", "org-4"));

        UserData userData = new UserData();
        userData.setRecentlyUsedOrgIds(List.of("org-2", "org-4", "org-3"));
        userData.setRecentlyUsedAppIds(List.of("org-2-app-2", "org-2-app-1", "org-4-app-3", "org-3-app-3"));
        userData.setReleaseNotesViewedVersion("");

        Mockito.when(sessionUserService.getCurrentUser()).thenReturn(Mono.just(testUser));
        Mockito.when(userService.findByEmail(testUser.getEmail())).thenReturn(Mono.just(testUser));
        Mockito.when(userDataService.getForCurrentUser()).thenReturn(Mono.just(userData));
        Mockito.when(applicationRepository.findByMultipleOrganizationIds(
                testUser.getOrganizationIds(), READ_APPLICATIONS)
        ).thenReturn(Flux.fromIterable(createDummyApplications()));
        Mockito.when(organizationService.findByIdsIn(testUser.getOrganizationIds(), READ_ORGANIZATIONS))
                .thenReturn(Flux.fromIterable(createDummyOrganizations()));
        Mockito.when(releaseNotesService.getReleaseNodes()).thenReturn(Mono.empty());
        Mockito.when(releaseNotesService.computeNewFrom(userData.getReleaseNotesViewedVersion())).thenReturn("0");
        Mockito.when(userDataService.ensureViewedCurrentVersionReleaseNotes(testUser)).thenReturn(Mono.just(testUser));

        StepVerifier.create(applicationFetcher.getAllApplications())
                .assertNext(userHomepageDTO -> {
                    List<OrganizationApplicationsDTO> organizationApplications = userHomepageDTO.getOrganizationApplications();
                    assertThat(organizationApplications).isNotNull();
                    assertThat(organizationApplications.size()).isEqualTo(4);

                    // first org should be most recent one,
                    OrganizationApplicationsDTO firstOrgDTO = organizationApplications.get(0);
                    assertThat(firstOrgDTO.getOrganization().getName()).isEqualTo("org-2");

                    // second org should be after most recent one,
                    OrganizationApplicationsDTO secondOrgDTO = organizationApplications.get(1);
                    assertThat(secondOrgDTO.getOrganization().getName()).isEqualTo("org-4");
                }).verifyComplete();
    }
}