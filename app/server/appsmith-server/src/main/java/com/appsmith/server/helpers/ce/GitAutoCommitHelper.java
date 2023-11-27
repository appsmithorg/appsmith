package com.appsmith.server.helpers.ce;

import com.appsmith.server.dtos.AutoCommitProgressDTO;
import reactor.core.publisher.Mono;

public interface GitAutoCommitHelper {
    Mono<AutoCommitProgressDTO> getAutoCommitProgress(String applicationId, String branchName);

    Mono<Boolean> autoCommitApplication(String defaultApplicationId, String branchName);
}
