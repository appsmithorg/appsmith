package com.appsmith.server.helpers.ce.autocommit;

import com.appsmith.server.dtos.AutoCommitProgressDTO;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
public class GitAutoCommitHelperFallbackImpl implements GitAutoCommitHelper {

    @Override
    public Mono<Boolean> autoCommitClientMigration(String defaultApplicationId, String branchName) {
        return Mono.just(Boolean.FALSE);
    }

    @Override
    public Mono<Boolean> autoCommitServerMigration(String defaultApplicationId, String branchName) {
        return Mono.just(Boolean.FALSE);
    }

    @Override
    public Mono<AutoCommitProgressDTO> getAutoCommitProgress(String applicationId) {
        return Mono.empty();
    }

    @Override
    public Mono<Boolean> autoCommitApplication(
            AutoCommitTriggerDTO autoCommitTriggerDTO, String defaultApplicationId, String branchName) {
        return Mono.just(Boolean.FALSE);
    }
}
