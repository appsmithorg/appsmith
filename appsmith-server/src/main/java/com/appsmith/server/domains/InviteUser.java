package com.appsmith.server.domains;

import com.appsmith.server.acl.AppsmithRole;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.mongodb.core.mapping.Document;

@Setter
@Getter
@Document
public class InviteUser extends User {

    String inviterUserId;

    String token;

    AppsmithRole role;
}
