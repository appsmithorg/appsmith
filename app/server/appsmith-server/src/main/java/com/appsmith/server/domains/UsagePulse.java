package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@Document
public class UsagePulse extends BaseDomain {

    @JsonView(Views.Api.class)
    private String email;

    // Hashed user email
    @JsonView(Views.Api.class)
    private String user;

    @JsonView(Views.Api.class)
    private String instanceId;

    @JsonView(Views.Api.class)
    private String tenantId;

    @JsonView(Views.Api.class)
    private Boolean viewMode;

    @JsonView(Views.Api.class)
    private Boolean isAnonymousUser;

}
