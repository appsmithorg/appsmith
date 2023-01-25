package com.appsmith.server.dtos;

import com.appsmith.external.models.Views;
import com.appsmith.server.domains.GitProfile;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GitConnectDTO {

    @JsonView(Views.Api.class)
    String remoteUrl;

    @JsonView(Views.Api.class)
    GitProfile gitProfile;
}
