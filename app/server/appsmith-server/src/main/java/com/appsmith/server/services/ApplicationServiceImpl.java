package com.appsmith.server.services;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.AnalyticsEvents;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.Page;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ApplicationAccessDTO;
import com.appsmith.server.dtos.OrganizationApplicationsDTO;
import com.appsmith.server.dtos.UserHomepageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.PageRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_ORGANIZATIONS;


@Slf4j
@Service
public class ApplicationServiceImpl extends BaseService<ApplicationRepository, Application, String> implements ApplicationService {

    //Using PageRepository instead of PageService is because a cyclic dependency is introduced if PageService is used here.
    //TODO : Solve for this across LayoutService, PageService and ApplicationService.
    private final PageRepository pageRepository;
    private final SessionUserService sessionUserService;
    private final OrganizationService organizationService;
    private final UserService userService;
    private final PolicyUtils policyUtils;

    @Autowired
    public ApplicationServiceImpl(Scheduler scheduler,
                                  Validator validator,
                                  MongoConverter mongoConverter,
                                  ReactiveMongoTemplate reactiveMongoTemplate,
                                  ApplicationRepository repository,
                                  AnalyticsService analyticsService,
                                  PageRepository pageRepository,
                                  SessionUserService sessionUserService,
                                  OrganizationService organizationService,
                                  UserService userService,
                                  PolicyUtils policyUtils) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.pageRepository = pageRepository;
        this.sessionUserService = sessionUserService;
        this.organizationService = organizationService;
        this.userService = userService;
        this.policyUtils = policyUtils;
    }

    @Override
    public Flux<Application> get(MultiValueMap<String, String> params) {
        return super.getWithPermission(params, READ_APPLICATIONS);
    }

    @Override
    public Mono<Application> getById(String id) {
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }

        return repository.findById(id, READ_APPLICATIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "resource", id)));
    }

    @Override
    public Mono<Application> findById(String id) {
        return repository.findById(id);
    }

    @Override
    public Mono<Application> findById(String id, AclPermission aclPermission) {
        return repository.findById(id, aclPermission);
    }

    @Override
    public Mono<Application> findByIdAndOrganizationId(String id, String organizationId, AclPermission permission) {
        return repository.findByIdAndOrganizationId(id, organizationId, permission);
    }

    @Override
    public Mono<Application> findByName(String name, AclPermission permission) {
        return repository.findByName(name, permission);
    }

    @Override
    public Mono<Application> save(Application application) {
        return repository.save(application);
    }

    @Override
    public Mono<Application> create(Application object) {
        throw new UnsupportedOperationException("Please use `ApplicationPageService.createApplication` to create an application.");
    }

    @Override
    public Mono<Application> createDefault(Application object) {
        return super.create(object);
    }

    @Override
    public Mono<Application> update(String id, Application resource) {
        return repository.updateById(id, resource, AclPermission.MANAGE_APPLICATIONS)
                .flatMap(updatedObj -> analyticsService.sendEvent(AnalyticsEvents.UPDATE + "_" + updatedObj.getClass().getSimpleName().toUpperCase(), updatedObj));
    }

    @Override
    public Mono<Application> archive(Application application) {
        return repository.archive(application);
    }

    /**
     * This function walks through all the pages in the application. In each page, it walks through all the layouts.
     * In a layout, dsl and publishedDsl JSONObjects exist. Publish function is responsible for copying the dsl into
     * the publishedDsl.
     *
     * @param applicationId
     * @return Application
     */

    @Override
    public Mono<Boolean> publish(String applicationId) {
        Mono<Application> applicationMono = findById(applicationId)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "application", applicationId)));

        return applicationMono
                //Return all the pages in the Application
                .map(application -> {
                    List<ApplicationPage> pages = application.getPages();
                    if (pages == null) {
                        pages = new ArrayList<>();
                    }
                    return pages;
                })
                .flatMapMany(Flux::fromIterable)
                //In each page, copy each layout's dsl to publishedDsl field
                .flatMap(applicationPage -> pageRepository
                        .findById(applicationPage.getId())
                        .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "page", applicationPage.getId())))
                        .map(page -> {
                            List<Layout> layoutList = page.getLayouts();
                            for (Layout layout : layoutList) {
                                layout.setPublishedDsl(layout.getDsl());
                                layout.setPublishedLayoutActions(layout.getLayoutActions());
                                layout.setPublishedLayoutOnLoadActions(layout.getLayoutOnLoadActions());
                            }
                            return page;
                        })
                        .flatMap(pageRepository::save))
                .collectList()
                .map(pages -> true);
    }

    /**
     * For the current user, it first fetches all the organizations that its part of. For each organization, in turn all
     * the applications are fetched. These applications are then returned grouped by Organizations in a special DTO and returned
     *
     * TODO : We should also return applications shared with the user as part of this.
     *
     * @return List of OrganizationApplicationsDTO
     */
    @Override
    public Mono<UserHomepageDTO> getAllApplications() {

        Mono<User> userMono = sessionUserService
                .getCurrentUser()
                .flatMap(user -> {
                    if (user.getIsAnonymous()) {
                        return Mono.error(new AppsmithException(AppsmithError.USER_NOT_SIGNED_IN));
                    }
                    return Mono.just(user.getUsername());
                })
                .flatMap(userService::findByEmail)
                .cache();

        return userMono
                .flatMap(user -> {
                    Set<String> orgIds = user.getOrganizationIds();
                    /*
                     * For all the organization ids present in the user object, fetch all the organization objects
                     * and store in a map for fast access;
                     */
                    Mono<Map<String, Organization>> organizationsMapMono = organizationService.findByIdsIn(orgIds, READ_ORGANIZATIONS)
                            .collectMap(Organization::getId, Function.identity());

                    UserHomepageDTO userHomepageDTO = new UserHomepageDTO();
                    userHomepageDTO.setUser(user);

                    return repository
                            // Fetch all the applications which belong the organization ids present in the user
                            .findByMultipleOrganizationIds(orgIds, READ_APPLICATIONS)
                            // Collect all the applications as a map with organization id as a key
                            .collectMultimap(Application::getOrganizationId)
                            .zipWith(organizationsMapMono)
                            .map(tuple -> {
                                Map<String, Collection<Application>> applicationsCollectionByOrgId = tuple.getT1();
                                Map<String, Organization> organizationsMap = tuple.getT2();

                                List<OrganizationApplicationsDTO> organizationApplicationsDTOS = new ArrayList<>();

                                Iterator<Map.Entry<String, Organization>> orgIterator = organizationsMap.entrySet().iterator();

                                while (orgIterator.hasNext()) {
                                    Map.Entry<String, Organization> organizationEntry = orgIterator.next();
                                    String orgId = organizationEntry.getKey();
                                    Organization organization = organizationEntry.getValue();
                                    Collection<Application> applicationCollection = applicationsCollectionByOrgId.get(orgId);

                                    List<Application> applicationList = new ArrayList<>();
                                    if (applicationCollection!=null && !applicationCollection.isEmpty()) {
                                        applicationList = applicationCollection.stream().collect(Collectors.toList());
                                    }

                                    OrganizationApplicationsDTO organizationApplicationsDTO = new OrganizationApplicationsDTO();
                                    organizationApplicationsDTO.setOrganization(organization);
                                    organizationApplicationsDTO.setApplications(applicationList);

                                    organizationApplicationsDTOS.add(organizationApplicationsDTO);
                                }
                                userHomepageDTO.setOrganizationApplications(organizationApplicationsDTOS);
                                return userHomepageDTO;
                            });
                });
    }

    @Override
    public Mono<Application> changeViewAccess(String id, ApplicationAccessDTO applicationAccessDTO) {
        return repository
                .findById(id, MANAGE_APPLICATIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.APPLICATION_ID, id)))
                .flatMap(application -> {

                    if (application.getIsPublic().equals(applicationAccessDTO.getPublicAccess())) {
                        // No change. The required public access is the same as current public access. Do nothing
                        return Mono.just(application);
                    }

                    if (application.getIsPublic() == null && applicationAccessDTO.getPublicAccess().equals(false)) {
                        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
                    }

                    application.setIsPublic(applicationAccessDTO.getPublicAccess());
                    return generateAndSetPoliciesForPublicView(application, applicationAccessDTO.getPublicAccess());
                });
    }

    private Mono<Application> generateAndSetPoliciesForPublicView(Application application, Boolean isPublic) {
        AclPermission permission = READ_APPLICATIONS;

        User user = new User();
        user.setName(FieldName.ANONYMOUS_USER);
        user.setEmail(FieldName.ANONYMOUS_USER);
        user.setIsAnonymous(true);

        Map<String, Policy> applicationPolicyMap = policyUtils.generatePolicyFromPermission(Set.of(permission), user);
        Map<String, Policy> pagePolicyMap = policyUtils.generatePagePoliciesFromApplicationPolicies(applicationPolicyMap, user);
        Map<String, Policy> actionPolicyMap = policyUtils.generateActionPoliciesFromPagePolicies(pagePolicyMap, user);

        Flux<Page> updatedPagesFlux = policyUtils.updateWithApplicationPermissionsToAllItsPages(application.getId(), pagePolicyMap, isPublic);

        Flux<Action> updatedActionsFlux = updatedPagesFlux
                .flatMap(page -> policyUtils.updateWithPagePermissionsToAllItsActions(page.getId(), actionPolicyMap, isPublic));

        return updatedActionsFlux
                .collectList()
                .thenReturn(application)
                .flatMap(app -> {
                    Application updatedApplication;

                    if (isPublic) {
                        updatedApplication = (Application) policyUtils.addPoliciesToExistingObject(applicationPolicyMap, (Application) application);
                    } else {
                        updatedApplication = (Application) policyUtils.removePoliciesFromExistingObject(applicationPolicyMap, (Application) application);
                    }

                    return repository.save(updatedApplication);
                });

    }
}