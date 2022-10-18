package com.appsmith.server.solutions.ce;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.dtos.ReleaseNode;
import com.appsmith.server.dtos.UserAndPermissionGroupDTO;
import com.appsmith.server.dtos.UserHomepageDTO;
import com.appsmith.server.dtos.WorkspaceApplicationsDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.UserWorkspaceService;
import com.appsmith.server.services.WorkspaceService;
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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static com.appsmith.server.acl.AclPermission.READ_WORKSPACES;


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
    private final WorkspaceService workspaceService;
    private final ApplicationRepository applicationRepository;
    private final ReleaseNotesService releaseNotesService;
    private final ResponseUtils responseUtils;
    private final NewPageService newPageService;
    private final UserWorkspaceService userWorkspaceService;

    private <Domain extends BaseDomain> Flux<Domain> sortDomain(Flux<Domain> domainFlux, List<String> sortOrder) {
        if (CollectionUtils.isEmpty(sortOrder)) {
            return domainFlux;
        }
        return domainFlux.collect(Collectors.toMap(Domain::getId, Function.identity(), (key1, key2) -> key1, LinkedHashMap::new))
        .map(domainMap -> {
            List<Domain> sortedDomains = new ArrayList<>();
            for (String id : sortOrder) {
                if (domainMap.containsKey(id)) {
                    sortedDomains.add(domainMap.get(id));
                    domainMap.remove(id);
                }
            }
            sortedDomains.addAll(domainMap.values());
            return sortedDomains;
        })
        .flatMapMany(Flux::fromIterable);
    }

    /**
     * For the current user, it first fetches all the workspaces user has read permission on. For each workspace, in turn all
     * the readable applications are fetched. These applications are then returned grouped by Workspaces in a special DTO and returned
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

                    // Collect all the applications as a map with workspace id as a key
                    Flux<Application> applicationFlux = applicationRepository
                            .findAllUserApps(READ_APPLICATIONS)
                            //sort transformation
                            .transform(domainFlux -> sortDomain(domainFlux, userData.getRecentlyUsedAppIds()))
                            // Git connected apps will have gitApplicationMetadat
                            .filter(application -> application.getGitApplicationMetadata() == null
                                            // 1. When the ssh key is generated by user and then the connect app fails
                                            || (StringUtils.isEmpty(application.getGitApplicationMetadata().getDefaultBranchName())
                                                && StringUtils.isEmpty(application.getGitApplicationMetadata().getBranchName()))
                                            // 2. When the DefaultBranchName is missing due to branch creation flow failures or corrupted scenarios
                                            || (!StringUtils.isEmpty(application.getGitApplicationMetadata().getBranchName())
                                                && application.getGitApplicationMetadata().getBranchName().equals(application.getGitApplicationMetadata().getDefaultBranchName())
                                    )
                            )
                            .map(responseUtils::updateApplicationWithDefaultResources);

                    Mono<Map<String, Collection<Application>>> applicationsMapMono = applicationFlux.collectMultimap(
                            Application::getWorkspaceId, Function.identity()
                    );

                    Flux<Workspace> workspacesFromRepoFlux = workspaceService.getAll(READ_WORKSPACES)
                            .cache();

                    Mono<List<Workspace>> workspaceListMono = workspacesFromRepoFlux
                            //sort transformation
                            .transform(domainFlux -> sortDomain(domainFlux, userData.getRecentlyUsedWorkspaceIds()))
                            //collect to list to keep the order of the workspaces
                            .collectList()
                            .cache();

                    Mono<Map<String, List<UserAndPermissionGroupDTO>>> userAndPermissionGroupMapDTO = workspacesFromRepoFlux
                            .map(Workspace::getId)
                            .collect(Collectors.toSet())
                            .flatMap(workspaceIds -> userWorkspaceService.getWorkspaceMembers(workspaceIds));

                    return Mono.zip(workspaceListMono, applicationsMapMono, userAndPermissionGroupMapDTO)
                            .map(tuple -> {
                                List<Workspace> workspaces = tuple.getT1();

                                Map<String, Collection<Application>> applicationsCollectionByWorkspaceId = tuple.getT2();

                                Map<String, List<UserAndPermissionGroupDTO>> userAndPermissionGroupMapDTOByWorkspaceId = tuple.getT3();

                                List<WorkspaceApplicationsDTO> workspaceApplicationsDTOS = new ArrayList<>();

                                for(Workspace workspace : workspaces) {
                                    Collection<Application> applicationCollection = applicationsCollectionByWorkspaceId.get(workspace.getId());

                                    final List<Application> applicationList = new ArrayList<>();
                                    if (!CollectionUtils.isEmpty(applicationCollection)) {
                                        applicationList.addAll(applicationCollection);
                                    }

                                    WorkspaceApplicationsDTO workspaceApplicationsDTO = new WorkspaceApplicationsDTO();
                                    workspaceApplicationsDTO.setWorkspace(workspace);
                                    workspaceApplicationsDTO.setApplications(applicationList);
                                    workspaceApplicationsDTO.setUsers(userAndPermissionGroupMapDTOByWorkspaceId.get(workspace.getId()));

                                    workspaceApplicationsDTOS.add(workspaceApplicationsDTO);
                                }

                                userHomepageDTO.setWorkspaceApplications(workspaceApplicationsDTOS);
                                return userHomepageDTO;
                            });
                })
                .flatMap(userHomepageDTO -> {
                    List<String> applicationIds = userHomepageDTO.getWorkspaceApplications().stream()
                            .map(workspaceApplicationsDTO ->
                                    workspaceApplicationsDTO.getApplications().stream()
                                            .map(BaseDomain::getId).collect(Collectors.toList())
                            ).flatMap(Collection::stream).collect(Collectors.toList());

                    // fetch the page slugs for the applications
                    return newPageService.findPageSlugsByApplicationIds(applicationIds, READ_PAGES)
                            .collectMultimap(NewPage::getApplicationId)
                            .map(applicationPageMap -> {
                                for (WorkspaceApplicationsDTO workspaceApps : userHomepageDTO.getWorkspaceApplications()) {
                                    for (Application application : workspaceApps.getApplications()) {
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
                        PageDTO pageDTO = getPage.apply(newPage);
                        if(pageDTO != null) {
                            defaultPage.setSlug(pageDTO.getSlug());
                            defaultPage.setCustomSlug(pageDTO.getCustomSlug());
                        } else {
                            log.error("page dto missing for application {} page {}", application.getId(), defaultPage.getId());
                        }
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
