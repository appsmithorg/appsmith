package com.appsmith.server.helpers.ce.autocommit;

import com.appsmith.server.dtos.AutoCommitProgressDTO;
import reactor.core.publisher.Mono;

public interface GitAutoCommitHelper {

    Mono<AutoCommitProgressDTO> getAutoCommitProgress(String applicationId);

    Mono<Boolean> autoCommitClientMigration(String defaultApplicationId, String branchName);

    Mono<Boolean> autoCommitServerMigration(String defaultApplicationId, String branchName);

    Mono<Boolean> autoCommitApplication(
            AutoCommitTriggerDTO autoCommitTriggerDTO, String defaultApplicationId, String branchName);
}
