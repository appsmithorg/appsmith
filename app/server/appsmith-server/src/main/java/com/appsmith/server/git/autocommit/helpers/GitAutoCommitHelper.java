package com.appsmith.server.git.autocommit.helpers;

import com.appsmith.server.dtos.AutoCommitResponseDTO;
import com.appsmith.server.dtos.AutoCommitTriggerDTO;
import reactor.core.publisher.Mono;

public interface GitAutoCommitHelper {

    Mono<AutoCommitResponseDTO> getAutoCommitProgress(String defaultApplicationId, String branchName);

    Mono<Boolean> autoCommitClientMigration(String defaultApplicationId, String branchName);

    Mono<Boolean> autoCommitServerMigration(String defaultApplicationId, String branchName);

    Mono<Boolean> publishAutoCommitEvent(
            AutoCommitTriggerDTO autoCommitTriggerDTO, String defaultApplicationId, String branchName);
}
