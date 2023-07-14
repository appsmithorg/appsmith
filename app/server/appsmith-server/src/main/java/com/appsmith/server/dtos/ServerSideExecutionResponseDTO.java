package com.appsmith.server.dtos;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Data;

@Data
public class ServerSideExecutionResponseDTO {

    @JsonView(Views.Public.class)
    String serverSideExecutionEndpoint;

    @JsonView(Views.Public.class)
    String actionCollectionId;

    @JsonView(Views.Public.class)
    String actionId;
}
