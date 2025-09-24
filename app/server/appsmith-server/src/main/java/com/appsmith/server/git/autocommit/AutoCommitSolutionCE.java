package com.appsmith.server.git.autocommit;

import com.appsmith.server.events.AutoCommitEvent;
import reactor.core.publisher.Mono;

public interface AutoCommitSolutionCE {

    Mono<Boolean> startApplicationAutoCommit(
            String baseArtifactId, String authorName, String authorEmail, AutoCommitEvent event);

    Mono<Boolean> autoCommitDSLMigration(AutoCommitEvent autoCommitEvent);

    Mono<Boolean> autoCommitServerMigration(AutoCommitEvent autoCommitEvent);
}
