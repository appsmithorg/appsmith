package com.appsmith.server.migrations.utils;

import com.appsmith.external.constants.PluginConstants;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.PluginType;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.migrations.MigrationHelperMethods;
import com.appsmith.server.newactions.base.NewActionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.Optional;

@Component
@Slf4j
@RequiredArgsConstructor
public class JsonSchemaMigrationHelper {

    private final ApplicationService applicationService;
    private final NewActionService newActionService;

    public Mono<ApplicationJson> addDatasourceConfigurationToDefaultRestApiActions(
            String baseApplicationId, String branchName, ApplicationJson applicationJson) {

        Mono<ApplicationJson> contingencyMigrationJson = Mono.defer(() -> Mono.fromCallable(() -> {
            MigrationHelperMethods.migrateApplicationJsonToVersionTen(applicationJson, Map.of());
            return applicationJson;
        }));

        if (!StringUtils.hasText(baseApplicationId) || !StringUtils.hasText(branchName)) {
            return contingencyMigrationJson;
        }

        Mono<Application> applicationMono = applicationService
                .findByBranchNameAndBaseApplicationId(branchName, baseApplicationId, null)
                .cache();

        return applicationMono
                .flatMap(branchedApplication -> {
                    return newActionService
                            .findAllByApplicationIdAndViewMode(
                                    branchedApplication.getId(), Boolean.FALSE, Optional.empty(), Optional.empty())
                            .filter(action -> {
                                if (action.getUnpublishedAction() == null
                                        || action.getUnpublishedAction().getDatasource() == null) {
                                    return false;
                                }

                                Datasource actionDatasource =
                                        action.getUnpublishedAction().getDatasource();

                                // lenient probable check for the  default rest datasource action is.
                                // As we don't have any harm in the allowing API actions present in db.
                                // it has no datasource id and action's plugin type is API
                                boolean probableCheckForDefaultRestDatasource =
                                        !org.springframework.util.StringUtils.hasText(actionDatasource.getId())
                                                && PluginType.API.equals(action.getPluginType());

                                // condition to check if the action is default rest datasource.
                                // it has no datasource id and name is equal to DEFAULT_REST_DATASOURCE
                                boolean certainCheckForDefaultRestDatasource =
                                        !org.springframework.util.StringUtils.hasText(actionDatasource.getId())
                                                && PluginConstants.DEFAULT_REST_DATASOURCE.equals(
                                                        actionDatasource.getName());

                                // Two separate types of checks over here, it's either the obvious certain way to
                                // identify or
                                // the likely chance that the datasource is present.
                                return certainCheckForDefaultRestDatasource || probableCheckForDefaultRestDatasource;
                            })
                            .collectMap(NewAction::getGitSyncId);
                })
                .map(newActionMap -> {
                    MigrationHelperMethods.migrateApplicationJsonToVersionTen(applicationJson, newActionMap);
                    return applicationJson;
                })
                .switchIfEmpty(contingencyMigrationJson)
                .onErrorResume(error -> {
                    log.error("Error occurred while migrating actions of application json. {}", error.getMessage());
                    return contingencyMigrationJson;
                });
    }
}
