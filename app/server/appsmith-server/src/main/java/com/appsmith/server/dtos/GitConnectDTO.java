package com.appsmith.server.dtos;

import com.appsmith.external.views.Views;
import com.appsmith.server.domains.GitProfile;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GitConnectDTO {

    @JsonView(Views.Public.class)
    String remoteUrl;

    @JsonView(Views.Public.class)
    GitProfile gitProfile;
}
