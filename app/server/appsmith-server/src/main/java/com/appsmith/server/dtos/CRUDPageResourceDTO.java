package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Map;
import java.util.Set;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

/**
 * This class will hold the fields that will be consumed by the server, which will be received
 * from the clients request body
 */
@NoArgsConstructor
@Getter
@Setter
public class CRUDPageResourceDTO {

    // This will be defaultApplicationId if the application is connected with git
    @JsonView(Views.Api.class)
    String applicationId;

    @JsonView(Views.Api.class)
    String datasourceId;

    @JsonView(Views.Api.class)
    String tableName;

    @JsonView(Views.Api.class)
    String searchColumn;

    @JsonView(Views.Api.class)
    Set<String> columns;

    @JsonView(Views.Api.class)
    Map<String, String> pluginSpecificParams;
}
