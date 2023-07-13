package com.appsmith.server.dtos;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Data;

@Data
public class ServerSideExecutionMetadataDTO {

    @JsonView(Views.Public.class)
    String serverExecutionEndpoint;

    String actionCollectionId;

    String actionId;
}
