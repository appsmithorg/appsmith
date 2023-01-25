package com.appsmith.server.dtos;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GitDeployKeyDTO {
    @JsonView(Views.Api.class)
    String protocolName;

    @JsonView(Views.Api.class)
    String platFormSupported;

    @JsonView(Views.Api.class)
    int keySize;
}
