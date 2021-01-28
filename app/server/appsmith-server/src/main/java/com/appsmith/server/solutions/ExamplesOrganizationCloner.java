package com.appsmith.server.solutions;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.DslActionDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.OrganizationRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.DatasourceContextService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class ExamplesOrganizationCloner {

    private final OrganizationService organizationService;
    private final OrganizationRepository organizationRepository;
    private final DatasourceService datasourceService;
    private final DatasourceRepository datasourceRepository;
    private final ConfigService configService;
    private final SessionUserService sessionUserService;
    private final UserService userService;
    private final ApplicationPageService applicationPageService;
    private final DatasourceContextService datasourceContextService;
    private final NewPageRepository newPageRepository;
    private final NewActionService newActionService;

    public Mono<Organization> cloneExamplesOrganization() {
        return sessionUserService
                .getCurrentUser()
                .flatMap(this::cloneExamplesOrganization);
    }

    /**
     * Clones the template organization (as specified in config collection) for the given user. The given user will be
     * the owner of the cloned organization. This method also assumes that the given user is the same as the user in
     * the current Spring session.
     *
     * @param user User who will be the owner of the cloned organization.
     * @return Empty Mono.
     */
    private Mono<Organization> cloneExamplesOrganization(User user) {
        if (user.getExamplesOrganizationId() != null) {
            // This user already has an examples organization, don't have to do anything.
            return Mono.empty();
        }

        return configService.getTemplateOrganizationId()
                .doOnSuccess(id -> {
                    if (id == null) {
                        log.error("Missing template organization id in config.");
                    }
                })
                .doOnError(error -> log.error("Error loading template organization id config.", error))
                .doOnSuccess(config -> {
                    if (config == null) {
                        // If the template organization could not be found, that's okay, the login should not fail. We
                        // will try again the next time the user logs in.
                        log.error(
                                "Template organization ID not found. Skipping creating example organization for user {}.",
                                user.getEmail()
                        );
                    }
                })
                .flatMap(templateOrganizationId -> cloneOrganizationForUser(templateOrganizationId, user));
    }

    public Mono<Organization> cloneOrganizationForUser(String templateOrganizationId, User user) {
        return cloneOrganizationForUser(templateOrganizationId, user, null);
    }

    /**
     * Given an organization ID and a user, clone the organization and make the given user the owner of the cloned
     * organization. This recursively clones all objects inside the organization. This method also assumes that the
     * given user is the same as the user in the current Spring session.
     *
     * @param templateOrganizationId Organization ID of the organization to create a clone of.
     * @param user                   The user who will own the new cloned organization.
     * @return Publishes the newly created organization.
     */
    public Mono<Organization> cloneOrganizationForUser(String templateOrganizationId, User user, Flux<Application> applicationsFlux) {
        log.info("Cloning organization id {}", templateOrganizationId);
        return organizationRepository
                .findById(templateOrganizationId)
                .doOnSuccess(organization -> {
                    if (organization == null) {
                        log.error(
                                "Template examples organization not found. Not creating a clone for user {}.",
                                user.getEmail()
                        );
                    }
                })
                .flatMap(organization -> {
                    makePristine(organization);
                    if (!CollectionUtils.isEmpty(organization.getUserRoles())) {
                        organization.getUserRoles().clear();
                    }
                    organization.setSlug(null);
                    return organizationService.createDefault(organization, user);
                })
                .flatMap(newOrganization -> {
                    User userUpdate = new User();
                    userUpdate.setExamplesOrganizationId(newOrganization.getId());
                    userUpdate.setPasswordResetInitiated(user.getPasswordResetInitiated());
                    userUpdate.setSource(user.getSource());
                    userUpdate.setGroupIds(null);
                    userUpdate.setPolicies(null);
                    return Mono
                            .when(
                                    userService.update(user.getId(), userUpdate),
                                    applicationsFlux == null
                                            ? cloneApplications(templateOrganizationId, newOrganization.getId())
                                            : cloneApplications(templateOrganizationId, newOrganization.getId(), applicationsFlux)
                            )
                            .thenReturn(newOrganization);
                })
                .doOnError(error -> log.error("Error cloning examples organization.", error));
    }

    private Mono<Void> cloneApplications(String fromOrganizationId, String toOrganizationId) {
        return cloneApplications(fromOrganizationId, toOrganizationId, configService.getTemplateApplications());
    }

    /**
     * Clone all applications (except deleted ones), including it's pages and actions from one organization into
     * another. Also clones all datasources (not just the ones used by any applications) in the given organizations.
     *
     * @param fromOrganizationId ID of the organization that is the source to copy objects from.
     * @param toOrganizationId   ID of the organization that is the target to copy objects to.
     * @return Empty Mono.
     */
    private Mono<Void> cloneApplications(String fromOrganizationId, String toOrganizationId, Flux<Application> applicationsFlux) {
        final Mono<Map<String, Datasource>> cloneDatasourcesMono = cloneDatasources(fromOrganizationId, toOrganizationId).cache();
        final List<NewPage> clonedPages = new ArrayList<>();
        final List<String> newApplicationIds = new ArrayList<>();

        return applicationsFlux
                .flatMap(application -> {
                    application.setOrganizationId(toOrganizationId);

                    final String defaultPageId = application.getPages().stream()
                            .filter(ApplicationPage::isDefault)
                            .map(ApplicationPage::getId)
                            .findFirst()
                            .orElse("");

                    return doOnlyCloneApplicationObjectWithoutItsDependenciesAndReturnPages(application, newApplicationIds)
                            .flatMap(page ->
                                    Mono.zip(
                                            Mono.just(page),
                                            Mono.just(defaultPageId.equals(page.getId()))
                                    )
                            );
                })
                .flatMap(tuple -> {
                    final NewPage newPage = tuple.getT1();
                    final boolean isDefault = tuple.getT2();
                    final String templatePageId = newPage.getId();

                    makePristine(newPage);
                    PageDTO page = newPage.getUnpublishedPage();

                    if (page.getLayouts() != null) {
                        for (final Layout layout : page.getLayouts()) {
                            layout.setId(new ObjectId().toString());
                        }
                    }

                    page.setApplicationId(newPage.getApplicationId());

                    return applicationPageService
                            .createPage(page)
                            .flatMap(savedPage ->
                                    isDefault
                                            ? applicationPageService.makePageDefault(savedPage).thenReturn(savedPage)
                                            : Mono.just(savedPage))
                            .flatMap(savedPage -> newPageRepository.findById(savedPage.getId()))
                            .flatMapMany(savedPage -> {
                                clonedPages.add(savedPage);
                                return newActionService
                                        .findByPageId(templatePageId)
                                        .map(newAction -> {
                                            ActionDTO action = newAction.getUnpublishedAction();
                                            log.info("Preparing action for cloning {} {}.", action.getName(), newAction.getId());
                                            action.setPageId(savedPage.getId());
                                            return newAction;
                                        });
                            });
                })
                .flatMap(newAction -> {
                    final String originalActionId = newAction.getId();
                    log.info("Creating clone of action {}", originalActionId);
                    makePristine(newAction);
                    newAction.setOrganizationId(toOrganizationId);
                    ActionDTO action = newAction.getUnpublishedAction();
                    action.setCollectionId(null);

                    Mono<ActionDTO> actionMono = Mono.just(action);
                    final Datasource datasourceInsideAction = action.getDatasource();
                    if (datasourceInsideAction != null) {
                        if (datasourceInsideAction.getId() != null) {
                            actionMono = cloneDatasourcesMono
                                    .map(newDatasourcesByTemplateId -> {
                                        action.setDatasource(newDatasourcesByTemplateId.get(datasourceInsideAction.getId()));
                                        return action;
                                    });
                        } else {
                            datasourceInsideAction.setOrganizationId(toOrganizationId);
                        }
                    }
                    return actionMono
                            .flatMap(newActionService::createAction)
                            .map(ActionDTO::getId)
                            .zipWith(Mono.just(originalActionId));
                })
                // This call to `collectMap` will wait for all actions in all pages to have been processed, and so the
                // `clonedPages` list will also contain all pages cloned.
                .collectMap(Tuple2::getT2, Tuple2::getT1)
                .flatMapMany(actionIdsMap -> updateActionIdsInClonedPages(clonedPages, actionIdsMap))
                .then(cloneDatasourcesMono)  // Run the datasource cloning mono if it isn't already done.
                // Now publish all the example applications which have been cloned to ensure that there is a
                // view mode for the newly created user.
                .then(Mono.just(newApplicationIds))
                .flatMapMany(applicationIds -> Flux.fromIterable(applicationIds))
                .flatMap(appId -> applicationPageService.publish(appId))
                .collectList()
                .then();
    }

    private Flux<NewPage> updateActionIdsInClonedPages(List<NewPage> clonedPages, Map<String, String> actionIdsMap) {
        final List<Mono<NewPage>> pageSaveMonos = new ArrayList<>();

        for (final NewPage page : clonedPages) {
            // If there are no unpublished layouts, there would be no published layouts either.
            // Move on to the next page.
            if (page.getUnpublishedPage().getLayouts() == null) {
                continue;
            }

            boolean shouldSave = false;

            for (final Layout layout : page.getUnpublishedPage().getLayouts()) {
                if (layout.getLayoutOnLoadActions() != null) {
                    shouldSave = updateOnLoadActionsWithNewActionIds(actionIdsMap, page.getId(), shouldSave, layout);
                }
            }

            if (shouldSave) {
                pageSaveMonos.add(newPageRepository.save(page));
            }
        }

        return Flux.concat(pageSaveMonos);
    }

    private boolean updateOnLoadActionsWithNewActionIds(Map<String, String> actionIdsMap, String pageId, boolean shouldSave, Layout layout) {
        for (final Set<DslActionDTO> actionSet : layout.getLayoutOnLoadActions()) {
            for (final DslActionDTO actionDTO : actionSet) {
                if (actionIdsMap.containsKey(actionDTO.getId())) {
                    actionDTO.setId(actionIdsMap.get(actionDTO.getId()));
                    shouldSave = true;
                } else {
                    log.error(
                            "Couldn't find cloned action ID for publishedLayoutOnLoadAction {} in page {}",
                            actionDTO.getId(),
                            pageId
                    );
                }
            }
        }
        return shouldSave;
    }

    /**
     * This function simply creates a clone of the Application object without cloning its children (page and actions)
     * Once the new application object is created, it adds the new application's id into the list applicationIds
     * 
     * @param application : Application to be cloned
     * @param applicationIds : List where the cloned new application's id would be stored
     * @return
     */
    private Flux<NewPage> doOnlyCloneApplicationObjectWithoutItsDependenciesAndReturnPages(Application application, List<String> applicationIds) {
        final String templateApplicationId = application.getId();
        return applicationPageService
                .cloneExampleApplication(application)
                .flatMapMany(
                        savedApplication -> {
                            applicationIds.add(savedApplication.getId());
                            return newPageRepository
                                    .findByApplicationId(templateApplicationId)
                                    .map(newPage -> {
                                        log.info("Preparing page for cloning {} {}.", newPage.getUnpublishedPage().getName(), newPage.getId());
                                        newPage.setApplicationId(savedApplication.getId());
                                        return newPage;
                                    });
                        }
                );
    }

    /**
     * Clone all the datasources (except deleted ones) from one organization to another. Publishes a map where the keys
     * are IDs of datasources that were copied (source IDs), and the values are the cloned datasource objects which
     * contain the new ID.
     *
     * @param fromOrganizationId ID of the organization that is the source to copy datasources from.
     * @param toOrganizationId   ID of the organization that is the target to copy datasources to.
     * @return Mono of a mapping with old datasource IDs as keys and new datasource objects as values.
     */
    private Mono<Map<String, Datasource>> cloneDatasources(String fromOrganizationId, String toOrganizationId) {
        return datasourceRepository
                .findAllByOrganizationId(fromOrganizationId)
                .flatMap(datasource -> {
                    final String templateDatasourceId = datasource.getId();
                    if (templateDatasourceId == null) {
                        return Mono.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR));
                    }
                    makePristine(datasource);
                    datasource.setOrganizationId(toOrganizationId);
                    datasource.setName(datasource.getName());
                    if (datasource.getDatasourceConfiguration() != null) {
                        datasourceContextService.decryptSensitiveFields(datasource.getDatasourceConfiguration().getAuthentication());
                    }
                    return Mono.zip(
                            Mono.just(templateDatasourceId),
                            datasourceService.create(datasource)
                    );
                })
                .collectMap(Tuple2::getT1, Tuple2::getT2);
    }

    private void makePristine(BaseDomain domain) {
        // Set the ID to null for this domain object so that it is saved a new document in the database (as opposed to
        // updating an existing document). If it contains any policies, they are also reset.
        domain.setId(null);
        if (domain.getPolicies() != null) {
            domain.getPolicies().clear();
        }
    }

}
