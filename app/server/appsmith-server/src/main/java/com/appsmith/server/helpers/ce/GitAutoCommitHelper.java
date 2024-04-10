package com.appsmith.server.helpers.ce;

import com.appsmith.server.dtos.AutoCommitProgressDTO;
import reactor.core.publisher.Mono;

public interface GitAutoCommitHelper {
    Mono<AutoCommitProgressDTO> getAutoCommitProgress(String applicationId);

    Mono<Boolean> autoCommitApplication(String defaultApplicationId, String branchName);

    Mono<Boolean> autoCommitClientMigration(String defaultApplicationId, String branchName);

    Mono<Boolean> autoCommitServerMigration(String defaultApplicationId, String branchName);

    Mono<Boolean> autoCommitApplicationV2(String defaultApplicationId, String branchName, Boolean isClientMigration);
}
