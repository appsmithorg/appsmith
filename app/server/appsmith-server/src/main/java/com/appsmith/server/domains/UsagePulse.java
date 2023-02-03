package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@Document
public class UsagePulse extends BaseDomain {

    @JsonView(Views.Public.class)
    private String email;

    // Hashed user email
    @JsonView(Views.Public.class)
    private String user;

    @JsonView(Views.Public.class)
    private String instanceId;

    @JsonView(Views.Public.class)
    private String tenantId;

    @JsonView(Views.Public.class)
    private Boolean viewMode;

    @JsonView(Views.Public.class)
    private Boolean isAnonymousUser;

}
