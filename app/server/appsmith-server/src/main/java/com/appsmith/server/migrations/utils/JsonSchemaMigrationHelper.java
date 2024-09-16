package com.appsmith.server.migrations.utils;

import com.appsmith.external.constants.PluginConstants;
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

                                boolean reverseFlag = StringUtils.hasText(action.getUnpublishedAction()
                                                .getDatasource()
                                                .getId())
                                        || !PluginConstants.DEFAULT_REST_DATASOURCE.equals(action.getUnpublishedAction()
                                                .getDatasource()
                                                .getName());

                                return !reverseFlag;
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
