package com.appsmith.server.domains;

import com.appsmith.external.models.Views;
import com.appsmith.server.acl.AppsmithRole;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.mongodb.core.mapping.Document;

@Setter
@Getter
@Document
public class InviteUser extends User {

    @JsonView(Views.Api.class)
    String inviterUserId;

    @JsonView(Views.Api.class)
    String token;

    @JsonView(Views.Api.class)
    AppsmithRole role;
}
