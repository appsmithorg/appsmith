package com.appsmith.server.domains;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Setter
@Getter
@Document
public class InviteUser extends User {

    String inviterUserId;

    @Indexed(unique = true, expireAfterSeconds = 3600)
    String token;
}
