package com.appsmith.server.git.autocommit.helpers;

import com.appsmith.server.events.AutoCommitEvent;

public interface AutoCommitAsyncEventManager {

    void publishAsyncEvent(AutoCommitEvent autoCommitEvent);

    void autoCommitPublishEventListener(AutoCommitEvent event);
}
