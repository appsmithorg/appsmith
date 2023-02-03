package com.appsmith.server.dtos;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GitDeployKeyDTO {
    @JsonView(Views.Public.class)
    String protocolName;

    @JsonView(Views.Public.class)
    String platFormSupported;

    @JsonView(Views.Public.class)
    int keySize;
}
