package com.appsmith.server.solutions.ce;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.dtos.OrganizationApplicationsDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.dtos.ReleaseNode;
import com.appsmith.server.dtos.UserHomepageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.solutions.ReleaseNotesService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.StringUtils;
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_ORGANIZATIONS;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static java.util.stream.Collectors.toMap;


@Slf4j
@RequiredArgsConstructor
public class ApplicationFetcherCEImpl implements ApplicationFetcherCE {

    /**
     * A component responsible for generating a list of applications accessible by the currently logged-in user.
     * TODO: Return applications shared with the user as part of this.
     */

    private final SessionUserService sessionUserService;
    private final UserService userService;
    private final UserDataService userDataService;
    private final OrganizationService organizationService;
    private final ApplicationRepository applicationRepository;
    private final ReleaseNotesService releaseNotesService;
    private final ResponseUtils responseUtils;
    private final NewPageService newPageService;

    /**
     * For the current user, it first fetches all the organizations that its part of. For each organization, in turn all
     * the applications are fetched. These applications are then returned grouped by Organizations in a special DTO and returned
     *
     * @return List of UserHomepageDTO
     */
    public Mono<UserHomepageDTO> getAllApplications() {

        Mono<User> userMono = sessionUserService
                .getCurrentUser()
                .flatMap(user -> {
                    if (user.isAnonymous()) {
                        return Mono.error(new AppsmithException(AppsmithError.USER_NOT_SIGNED_IN));
                    }
                    return Mono.just(user.getUsername());
                })
                .flatMap(userService::findByEmail)
                .cache();

        Mono<UserData> userDataMono = userDataService.getForCurrentUser().defaultIfEmpty(new UserData()).cache();

        return userMono
                .zipWith(userDataMono)
                .flatMap(userAndUserDataTuple -> {
                    User user = userAndUserDataTuple.getT1();
                    UserData userData = userAndUserDataTuple.getT2();

                    UserHomepageDTO userHomepageDTO = new UserHomepageDTO();
                    userHomepageDTO.setUser(user);

                    Set<String> orgIds = user.getOrganizationIds();
                    if(CollectionUtils.isEmpty(orgIds)) {
                        userHomepageDTO.setOrganizationApplications(new ArrayList<>());
                        return Mono.just(userHomepageDTO);
                    }

                    // create a set of org id where recently used ones will be at the beginning
                    List<String> recentlyUsedOrgIds = userData.getRecentlyUsedOrgIds();
                    Set<String> orgIdSortedSet = new LinkedHashSet<>();
                    if(recentlyUsedOrgIds != null && recentlyUsedOrgIds.size() > 0) {
                        // user has a recently used list, add them to the beginning
                        orgIdSortedSet.addAll(recentlyUsedOrgIds);
                    }
                    orgIdSortedSet.addAll(orgIds); // add all other if not added already

                    // Collect all the applications as a map with organization id as a key
                    Flux<Application> applicationFlux = applicationRepository
                            .findByMultipleOrganizationIds(orgIds, READ_APPLICATIONS)
                            .filter(application -> application.getGitApplicationMetadata() == null
                                    || (StringUtils.equals(application.getId(), application.getGitApplicationMetadata().getDefaultApplicationId()))
                            )
                            .map(responseUtils::updateApplicationWithDefaultResources);

                    // sort the list of applications if user has recent applications
                    if(!CollectionUtils.isEmpty(userData.getRecentlyUsedAppIds())) {
                        // creating a map of applicationId and corresponding index to reduce sorting time
                        Map<String, Integer> idToIndexMap = IntStream.range(0, userData.getRecentlyUsedAppIds().size())
                                .boxed()
                                .collect(toMap(userData.getRecentlyUsedAppIds()::get, i -> i));

                        applicationFlux = applicationFlux.sort((o1, o2) -> {
                            String o1Id = o1.getId(), o2Id = o2.getId();
                            Integer idx1 = idToIndexMap.get(o1Id) == null ? Integer.MAX_VALUE : idToIndexMap.get(o1Id);
                            Integer idx2 = idToIndexMap.get(o2Id) == null ? Integer.MAX_VALUE : idToIndexMap.get(o2Id);
                            return (idx1-idx2);
                        });
                    }

                    Mono<Map<String, Collection<Application>>> applicationsMapMono = applicationFlux.collectMultimap(
                            Application::getOrganizationId, Function.identity()
                    );

                    return organizationService
                            .findByIdsIn(orgIds, READ_ORGANIZATIONS)
                            .collectMap(Organization::getId, v -> v)
                            .zipWith(applicationsMapMono)
                            .map(tuple -> {
                                Map<String, Organization> organizations = tuple.getT1();

                                Map<String, Collection<Application>> applicationsCollectionByOrgId = tuple.getT2();

                                List<OrganizationApplicationsDTO> organizationApplicationsDTOS = new ArrayList<>();

                                for(String orgId : orgIdSortedSet) {
                                    Organization organization = organizations.get(orgId);
                                    if(organization != null) {
                                        Collection<Application> applicationCollection = applicationsCollectionByOrgId.get(organization.getId());

                                        final List<Application> applicationList = new ArrayList<>();
                                        if (!CollectionUtils.isEmpty(applicationCollection)) {
                                            applicationList.addAll(applicationCollection);
                                        }

                                        OrganizationApplicationsDTO organizationApplicationsDTO = new OrganizationApplicationsDTO();
                                        organizationApplicationsDTO.setOrganization(organization);
                                        organizationApplicationsDTO.setApplications(applicationList);
                                        organizationApplicationsDTO.setUserRoles(organization.getUserRoles());

                                        organizationApplicationsDTOS.add(organizationApplicationsDTO);
                                    }
                                }

                                userHomepageDTO.setOrganizationApplications(organizationApplicationsDTOS);
                                return userHomepageDTO;
                            });
                })
                .flatMap(userHomepageDTO -> {
                    List<String> applicationIds = userHomepageDTO.getOrganizationApplications().stream()
                            .map(organizationApplicationsDTO ->
                                    organizationApplicationsDTO.getApplications().stream()
                                            .map(BaseDomain::getId).collect(Collectors.toList())
                            ).flatMap(Collection::stream).collect(Collectors.toList());

                    // fetch the page slugs for the applications
                    return newPageService.findPageSlugsByApplicationIds(applicationIds, READ_PAGES)
                            .collectMultimap(NewPage::getApplicationId)
                            .map(applicationPageMap -> {
                                for (OrganizationApplicationsDTO orgApps : userHomepageDTO.getOrganizationApplications()) {
                                    for (Application application : orgApps.getApplications()) {
                                        setDefaultPageSlug(application, applicationPageMap, Application::getPages, NewPage::getUnpublishedPage);
                                        setDefaultPageSlug(application, applicationPageMap, Application::getPublishedPages, NewPage::getPublishedPage);
                                    }
                                }
                                return userHomepageDTO;
                            });
                })
                .flatMap(userHomepageDTO -> Mono.zip(
                        Mono.just(userHomepageDTO),
                        releaseNotesService.getReleaseNodes()
                                // In case of an error or empty response from CS Server, continue without this data.
                                .onErrorResume(error -> Mono.empty())
                                .defaultIfEmpty(Collections.emptyList()),
                        userDataMono
                ))
                .flatMap(tuple -> {
                    final UserHomepageDTO userHomepageDTO = tuple.getT1();
                    final List<ReleaseNode> releaseNodes = tuple.getT2();
                    final UserData userData = tuple.getT3();

                    final User user = userHomepageDTO.getUser();
                    userHomepageDTO.setReleaseItems(releaseNodes);

                    final String count = releaseNotesService.computeNewFrom(userData.getReleaseNotesViewedVersion());
                    userHomepageDTO.setNewReleasesCount("0".equals(count) ? "" : count);

                    return userDataService.ensureViewedCurrentVersionReleaseNotes(user)
                            .thenReturn(userHomepageDTO);
                });
    }

    private void setDefaultPageSlug(
            Application application,
            Map<String, Collection<NewPage>> applicationPageMap,
            Function<Application, List<ApplicationPage>> getPages,
            Function<NewPage, PageDTO> getPage
    ) {
        List<ApplicationPage> applicationPages = getPages.apply(application);
        if(!CollectionUtils.isEmpty(applicationPages)) {
            Optional<ApplicationPage> defaultPageOptional = applicationPages.stream()
                    .filter(ApplicationPage::isDefault)
                    .findFirst();

            if(defaultPageOptional.isPresent()) {
                ApplicationPage defaultPage = defaultPageOptional.get();
                Collection<NewPage> pages = applicationPageMap.get(application.getId());
                if(!CollectionUtils.isEmpty(pages)) {
                    Optional<NewPage> newPageDetails = pages.stream()
                            .filter(newPage -> newPage.getId().equals(defaultPage.getId()))
                            .findFirst();

                    if(newPageDetails.isPresent()) {
                        NewPage newPage = newPageDetails.get();
                        defaultPage.setSlug(getPage.apply(newPage).getSlug());
                    } else {
                        log.error("page not found for application id {}, page id {}", application.getId(), defaultPage.getId());
                    }
                } else {
                    log.error("no page found for application {}", application.getId());
                }
            }
        }
    }
}
