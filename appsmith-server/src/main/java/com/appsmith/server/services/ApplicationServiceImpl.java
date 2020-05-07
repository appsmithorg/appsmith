package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.AnalyticsEvents;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.dtos.OrganizationApplicationsDTO;
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
import java.util.function.Function;
import java.util.stream.Collectors;

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
                                  PolicyUtils policyUtils) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.pageRepository = pageRepository;
        this.sessionUserService = sessionUserService;
        this.organizationService = organizationService;
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
    public Mono<Application> findByIdAndOrganizationId(String id, String organizationId) {
        return repository.findByIdAndOrganizationId(id, organizationId, READ_APPLICATIONS);
    }

    @Override
    public Mono<Application> findByName(String name) {
        return repository.findByName(name, READ_APPLICATIONS);
    }

    @Override
    public Mono<Application> save(Application application) {
        return repository.save(application);
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
    public Mono<List<OrganizationApplicationsDTO>> getAllApplications() {

        return sessionUserService
                .getCurrentUser()
                .map(user -> user.getOrganizationIds())
                .flatMap(orgIds -> {

                    /*
                     * For all the organization ids present in the user object, fetch all the organization objects
                     * and store in a map for fast access;
                     */
                    Mono<Map<String, Organization>> organizationsMapMono = organizationService.findByIdsIn(orgIds, READ_ORGANIZATIONS)
                            .collectMap(Organization::getId, Function.identity());

                    return repository
                            // Fetch all the applications which belong the organization ids present in the user
                            .findByMultipleOrganizationIds(orgIds, READ_APPLICATIONS)
                            // Collect all the applications as a map with organization id as a key
                            .collectMultimap(Application::getOrganizationId)
                            .zipWith(organizationsMapMono)
                            .map(tuple -> {
                                Map<String, Collection<Application>> applicationsCollectionByOrgId = tuple.getT1();
                                Map<String, Organization> organizationsMap = tuple.getT2();

                                Iterator<Map.Entry<String, Collection<Application>>> itr =
                                        applicationsCollectionByOrgId.entrySet().iterator();

                                List<OrganizationApplicationsDTO> organizationApplicationsDTOS = new ArrayList<>();
                                while (itr.hasNext()) {
                                    Map.Entry<String, Collection<Application>> next = itr.next();
                                    String orgId = next.getKey();
                                    Collection<Application> applicationCollection = next.getValue();
                                    List<Application> applicationList = applicationCollection.stream().collect(Collectors.toList());
                                    Organization organization = organizationsMap.get(orgId);

                                    OrganizationApplicationsDTO organizationApplicationsDTO = new OrganizationApplicationsDTO();
                                    organizationApplicationsDTO.setOrganization(organization);
                                    organizationApplicationsDTO.setApplications(applicationList);

                                    organizationApplicationsDTOS.add(organizationApplicationsDTO);
                                }
                                return organizationApplicationsDTOS;
                            });
                });
    }
}