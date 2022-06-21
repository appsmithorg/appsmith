package com.appsmith.server.domains;

import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode
@Data
public class UserInGroup {

    String id;

    String username;

    // Default constructor to generate the object using User object.
    public UserInGroup(User user) {
        this.id = user.getId();
        this.username = user.getUsername();
    }

}
