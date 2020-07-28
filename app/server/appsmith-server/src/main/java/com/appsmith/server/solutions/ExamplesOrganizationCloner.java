package com.appsmith.server.solutions;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.Page;
import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.ActionRepository;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.ConfigRepository;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.OrganizationRepository;
import com.appsmith.server.repositories.PageRepository;
import com.appsmith.server.services.ActionService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class ExamplesOrganizationCloner {

    public static final String TEMPLATE_ORGANIZATION_CONFIG_NAME = "template-organization";

    private final OrganizationService organizationService;
    private final OrganizationRepository organizationRepository;
    private final DatasourceService datasourceService;
    private final PageRepository pageRepository;
    private final ActionService actionService;
    private final DatasourceRepository datasourceRepository;
    private final ApplicationRepository applicationRepository;
    private final ActionRepository actionRepository;
    private final ConfigRepository configRepository;
    private final SessionUserService sessionUserService;
    private final UserService userService;
    private final ApplicationPageService applicationPageService;

    public Mono<Organization> cloneExamplesOrganization() {
        return sessionUserService
                .getCurrentUser()
                .flatMap(this::cloneExamplesOrganization);
    }

    /**
     * Clones the template organization (as specified in config collection) for the given user. The given user will be
     * the owner of the cloned organization. This method also assumes that the given user is the same as the user in
     * the current Spring session.
     * @param user User who will be the owner of the cloned organization.
     * @return Empty Mono.
     */
    private Mono<Organization> cloneExamplesOrganization(User user) {
        if (user.getExamplesOrganizationId() != null) {
            // This user already has an examples organization, don't have to do anything.
            return Mono.empty();
        }

        return configRepository.findByName(TEMPLATE_ORGANIZATION_CONFIG_NAME)
                .doOnSuccess(config -> {
                    if (config == null) {
                        // If the template organization could not be found, that's okay, the login should not fail. We
                        // will try again the next time the user logs in.
                        log.error(
                                "Couldn't find config by name {}. Skipping creating example organization for user {}.",
                                TEMPLATE_ORGANIZATION_CONFIG_NAME,
                                user.getEmail()
                        );
                    }
                })
                .flatMap(config ->
                        cloneOrganizationForUser(config.getConfig().getAsString(FieldName.ORGANIZATION_ID), user)
                );
    }

    /**
     * Given an organization ID and a user, clone the organization and make the given user the owner of the cloned
     * organization. This recursively clones all objects inside the organization. This method also assumes that the
     * given user is the same as the user in the current Spring session.
     * @param templateOrganizationId Organization ID of the organization to create a clone of.
     * @param user The user who will own the new cloned organization.
     * @return Publishes the newly created organization.
     */
    public Mono<Organization> cloneOrganizationForUser(String templateOrganizationId, User user) {
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
                    organization.setName(user.computeFirstName() + "'s Examples");
                    organization.setSlug(null);
                    return organizationService.create(organization, user);
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
                                    cloneApplications(templateOrganizationId, newOrganization.getId())
                            )
                            .thenReturn(newOrganization);
                })
                .doOnError(error -> log.error("Error cloning examples organization.", error));
    }

    /**
     * Clone all applications (except deleted ones), including it's pages and actions from one organization into
     * another. Also clones all datasources (not just the ones used by any applications) in the given organizations.
     * @param fromOrganizationId ID of the organization that is the source to copy objects from.
     * @param toOrganizationId ID of the organization that is the target to copy objects to.
     * @return Empty Mono.
     */
    private Mono<Void> cloneApplications(String fromOrganizationId, String toOrganizationId) {
        final Mono<Map<String, Datasource>> cloneDatasourcesMono = cloneDatasources(fromOrganizationId, toOrganizationId).cache();
        return applicationRepository
                .findByOrganizationIdAndIsPublicTrue(fromOrganizationId)
                .flatMap(application -> {
                    final String templateApplicationId = application.getId();
                    application.setOrganizationId(toOrganizationId);
                    return doCloneApplication(application, templateApplicationId);
                })
                .flatMap(page -> {
                    final String templatePageId = page.getId();
                    makePristine(page);
                    return applicationPageService
                            .createPage(page)
                            .flatMap(page1 -> {
                                log.info("Cloned into new page {}", page1);
                                return applicationRepository.findById(page.getApplicationId())
                                        .map(application -> {
                                            log.info("Application after page got cloned: {}", application);
                                            return page1;
                                        });
                            })
                            .flatMapMany(
                                    savedPage -> actionRepository
                                            .findByPageId(templatePageId)
                                            .map(action -> {
                                                log.info("Preparing action for cloning {} {}.", action.getName(), action.getId());
                                                action.setPageId(savedPage.getId());
                                                return action;
                                            })
                            );
                })
                .flatMap(action -> {
                    log.info("Creating clone of action {}", action.getId());
                    makePristine(action);
                    action.setOrganizationId(toOrganizationId);
                    action.setCollectionId(null);
                    Mono<Action> actionMono = Mono.just(action);
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
                    return actionMono.flatMap(actionService::create);
                })
                .then(cloneDatasourcesMono)  // Run the datasource cloning mono if it isn't already done.
                .then();
    }

    private Flux<Page> doCloneApplication(Application application, String templateApplicationId) {
        return applicationPageService
                .cloneApplication(application)
                .flatMapMany(
                        savedApplication -> pageRepository
                                .findByApplicationId(templateApplicationId)
                                .map(page -> {
                                    log.info("Preparing page for cloning {} {}.", page.getName(), page.getId());
                                    page.setApplicationId(savedApplication.getId());
                                    return page;
                                })
                );
    }

    /**
     * Clone all the datasources (except deleted ones) from one organization to another. Publishes a map where the keys
     * are IDs of datasources that were copied (source IDs), and the values are the cloned datasource objects which
     * contain the new ID.
     * @param fromOrganizationId ID of the organization that is the source to copy datasources from.
     * @param toOrganizationId ID of the organization that is the target to copy datasources to.
     * @return Mono of a mapping with old datasource IDs as keys and new datasource objects as values.
     */
    private Mono<Map<String, Datasource>> cloneDatasources(String fromOrganizationId, String toOrganizationId) {
        return datasourceRepository
                .findAllByOrganizationId(fromOrganizationId)
                .flatMap(datasource -> {
                    final String templateDatasourceId = datasource.getId();
                    if (templateDatasourceId == null) {
                        return Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND));
                    }
                    makePristine(datasource);
                    datasource.setOrganizationId(toOrganizationId);
                    datasource.setName(datasource.getName());
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
