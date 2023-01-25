package com.appsmith.server.dtos;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UsagePulseDTO {
    @JsonView(Views.Api.class)
    String anonymousUserId;
    
    @JsonView(Views.Api.class)
    Boolean viewMode;
}
