package com.appsmith.server.solutions;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.OrganizationApplicationsDTO;
import com.appsmith.server.dtos.UserHomepageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.SessionUserServiceImpl;
import com.appsmith.server.services.UserService;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;

import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_ORGANIZATIONS;

@Component
public class ApplicationFetcher {
    /**
     * A component responsible for generating a list of applications accessible by the currently logged-in user.
     * TODO: Return applications shared with the user as part of this.
     */

    private final SessionUserServiceImpl sessionUserService;
    private final UserService userService;
    private final OrganizationService organizationService;
    private final ApplicationRepository applicationRepository;

    public ApplicationFetcher(
            SessionUserServiceImpl sessionUserService,
            UserService userService,
            OrganizationService organizationService,
            ApplicationRepository applicationRepository) {
        this.sessionUserService = sessionUserService;
        this.userService = userService;
        this.organizationService = organizationService;
        this.applicationRepository = applicationRepository;
    }

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

        return userMono
                .flatMap(user -> {
                    Set<String> orgIds = user.getOrganizationIds();

                    // Collect all the applications as a map with organization id as a key

                    Mono<Map<String, Collection<Application>>> applicationsMapMono = applicationRepository
                            .findByMultipleOrganizationIds(orgIds, READ_APPLICATIONS)
                            .collectMultimap(Application::getOrganizationId, Function.identity());

                    UserHomepageDTO userHomepageDTO = new UserHomepageDTO();
                    userHomepageDTO.setUser(user);

                    return organizationService
                            .findByIdsIn(orgIds, READ_ORGANIZATIONS)
                            .collectList()
                            .zipWith(applicationsMapMono)
                            .map(tuple -> {
                                List<Organization> organizations = tuple.getT1();
                                Map<String, Collection<Application>> applicationsCollectionByOrgId = tuple.getT2();

                                List<OrganizationApplicationsDTO> organizationApplicationsDTOS = new ArrayList<>();

                                for (Organization organization : organizations) {
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
                                userHomepageDTO.setOrganizationApplications(organizationApplicationsDTOS);
                                return userHomepageDTO;
                            });
                });
    }
}
