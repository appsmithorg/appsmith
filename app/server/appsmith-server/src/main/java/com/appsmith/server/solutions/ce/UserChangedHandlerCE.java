package com.appsmith.server.solutions.ce;

import com.appsmith.server.domains.User;
import com.appsmith.server.events.UserChangedEvent;
import com.appsmith.server.events.UserPhotoChangedEvent;


public interface UserChangedHandlerCE {

    User publish(User user);

    void publish(String userId, String photoAssetId);

    void handle(UserChangedEvent event);

    void handle(UserPhotoChangedEvent event);

}
