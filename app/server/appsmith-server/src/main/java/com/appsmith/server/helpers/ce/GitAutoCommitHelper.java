package com.appsmith.server.helpers.ce;

import com.appsmith.server.dtos.AutoCommitProgressDTO;
import reactor.core.publisher.Mono;

public interface GitAutoCommitHelper extends GitAutoCommitHelperCECompatible {

    Mono<Boolean> autoCommitApplication(String defaultApplicationId, String branchName, Boolean isClientMigration);

    Mono<AutoCommitProgressDTO> getAutoCommitProgress(String applicationId);
}
