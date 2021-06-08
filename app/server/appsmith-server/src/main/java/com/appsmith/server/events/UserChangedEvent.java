package com.appsmith.server.events;

import com.appsmith.server.domains.User;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@Data
public class UserChangedEvent {

    private final User user;

}
