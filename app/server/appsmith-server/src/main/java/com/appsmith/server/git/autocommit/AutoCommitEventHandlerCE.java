package com.appsmith.server.git.autocommit;

import com.appsmith.server.events.AutoCommitEvent;
import reactor.core.publisher.Mono;

public interface AutoCommitEventHandlerCE {
    void publish(AutoCommitEvent autoCommitEvent);

    void handle(AutoCommitEvent event);

    Mono<Boolean> autoCommitDSLMigration(AutoCommitEvent autoCommitEvent);

    Mono<Boolean> autoCommitServerMigration(AutoCommitEvent autoCommitEvent);
}
