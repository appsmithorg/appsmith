package com.appsmith.server.events;

import com.appsmith.server.domains.User;
import lombok.Data;

@Data
public class UserChangedEvent {

    private final User user;

}
