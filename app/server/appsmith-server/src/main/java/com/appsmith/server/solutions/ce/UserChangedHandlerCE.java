package com.appsmith.server.solutions.ce;

import com.appsmith.server.domains.User;
import com.appsmith.server.events.UserChangedEvent;


public interface UserChangedHandlerCE {
    User publish(User user);
    void handle(UserChangedEvent event);
}
