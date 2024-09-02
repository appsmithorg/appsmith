package com.appsmith.server.git.autocommit.helpers;

import com.appsmith.server.dtos.AutoCommitResponseDTO;
import com.appsmith.server.dtos.AutoCommitTriggerDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Slf4j
@Component
public class GitAutoCommitHelperFallbackImpl implements GitAutoCommitHelper {

    @Override
    public Mono<Boolean> autoCommitClientMigration(String defaultApplicationId, String branchName) {
        log.info("Client auto commit for application {} and branch {} will not succeed because feature flag is off",
            defaultApplicationId, branchName);
        return Mono.just(Boolean.FALSE);
    }

    @Override
    public Mono<Boolean> autoCommitServerMigration(String defaultApplicationId, String branchName) {
        log.info("Server auto commit for application {} and branch {} will not succeed because feature flag is off",
            defaultApplicationId, branchName);
        return Mono.just(Boolean.FALSE);
    }

    @Override
    public Mono<AutoCommitResponseDTO> getAutoCommitProgress(String defaultApplicationId, String branchName) {
        return Mono.just(new AutoCommitResponseDTO(AutoCommitResponseDTO.AutoCommitResponse.IDLE));
    }

    @Override
    public Mono<Boolean> publishAutoCommitEvent(
            AutoCommitTriggerDTO autoCommitTriggerDTO, String defaultApplicationId, String branchName) {
        log.info("Auto commit for application {} and branch {} will not succeed because feature flag is off",
            defaultApplicationId, branchName);
        return Mono.just(Boolean.FALSE);
    }
}
