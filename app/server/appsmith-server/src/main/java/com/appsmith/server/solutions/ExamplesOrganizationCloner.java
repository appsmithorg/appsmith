package com.appsmith.server.solutions;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.Datasource;
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
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.util.Arrays;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class ExamplesOrganizationCloner {

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

    public Mono<Void> cloneExamplesOrganization() {
        return sessionUserService
                .getCurrentUser()
                .flatMap(this::cloneExamplesOrganization);
    }

    public Mono<Void> cloneExamplesOrganization(User user) {
        if (user.getExamplesOrganizationId() != null) {
            // This user already has an examples organization, don't have to do anything.
            return Mono.empty();
        }

        return configRepository.findByName("template-organization")
                .doOnSuccess(config -> {
                    if (config == null) {
                        log.error("Couldn't find config by name template-organization.");
                    }
                })
                .flatMap(config -> cloneOrganizationForUser(
                        config.getConfig().getAsString(FieldName.ORGANIZATION_ID),
                        user
                ))
                .then();
    }

    public Mono<Void> cloneOrganizationForUser(String templateOrganizationId, User user) {
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
                    organization.getUserRoles().clear();
                    organization.setName(user.getName().split(" ", 2)[0] + "'s Examples");
                    organization.setSlug(null);
                    return organizationService.create(organization, user);
                })
                .flatMap(newOrganization -> {
                    log.info("Cloned organization id {} {}", newOrganization.getId(), Arrays.toString(newOrganization.getPolicies().toArray()));
                    User userUpdate = new User();
                    userUpdate.setExamplesOrganizationId(newOrganization.getId());
                    userUpdate.setPasswordResetInitiated(user.getPasswordResetInitiated());
                    return Mono.when(
                            userService.update(user.getId(), userUpdate),
                            // cloneDatasources(templateOrganizationId, newOrganization.getId())
                            cloneApplications(templateOrganizationId, newOrganization.getId())
                    );
                })
                .doOnError(error -> log.error("Error cloning examples organization.", error))
                .then();
    }

    private Mono<Void> cloneApplications(String fromOrganizationId, String toOrganizationId) {
        final Mono<Map<String, Datasource>> cloneDatasourcesMono = cloneDatasources(fromOrganizationId, toOrganizationId).cache();
        return applicationRepository
                .findByOrganizationId(fromOrganizationId)
                .flatMap(application -> {
                    final String templateApplicationId = application.getId();
                    log.info("Cloning application {} {}", application.getId(), application.getName());
                    makePristine(application);
                    application.setOrganizationId(toOrganizationId);
                    return Flux.combineLatest(
                            pageRepository.findByApplicationId(templateApplicationId),
                            applicationPageService.createApplication(application).cache(),
                            (page, savedApplication) -> {
                                log.info("Cloned application {} into new application {}", templateApplicationId, savedApplication.getId());
                                page.setApplicationId(savedApplication.getId());
                                return page;
                            }
                    );
                })
                .flatMap(page -> {
                    final String templatePageId = page.getId();
                    log.info("Cloning page {} {}", page.getId(), page.getName());
                    makePristine(page);
                    return Flux.combineLatest(
                            actionRepository.findByPageId(templatePageId),
                            applicationPageService.createPage(page).cache(),
                            (action, savedPage) -> {
                                log.info("Cloned page {} into new page {}", templatePageId, savedPage.getId());
                                action.setPageId(savedPage.getId());
                                return action;
                            }
                    );
                })
                .zipWith(cloneDatasourcesMono)
                .flatMap(tuple -> {
                    final Action action = tuple.getT1();
                    final Map<String, Datasource> newDatasourcesByTemplateId = tuple.getT2();
                    log.info("Cloning action {} {}", action.getId(), action.getName());
                    makePristine(action);
                    action.setOrganizationId(toOrganizationId);
                    action.setCollectionId(null);
                    action.setDatasource(newDatasourcesByTemplateId.get(action.getDatasource().getId()));
                    return actionService.create(action);
                })
                .then();
    }

    private Mono<Map<String, Datasource>> cloneDatasources(String fromOrganizationId, String toOrganizationId) {
        return datasourceRepository
                .findAllByOrganizationId(fromOrganizationId)
                .flatMap(datasource -> {
                    log.info("Clone datasource {} from org {} to org {}", datasource.getId(), fromOrganizationId, toOrganizationId);
                    final String templateDatasourceId = datasource.getId();
                    if (templateDatasourceId == null) {
                        return Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND));
                    }
                    makePristine(datasource);
                    datasource.setOrganizationId(toOrganizationId);
                    datasource.setName(datasource.getName() + " cloned " + Math.random());
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
