package com.appsmith.server.solutions.ce;

import com.appsmith.server.events.AutoCommitEvent;

public interface AutoCommitEventHandlerCE {
    void publish(AutoCommitEvent autoCommitEvent);

    void handle(AutoCommitEvent event);
}
