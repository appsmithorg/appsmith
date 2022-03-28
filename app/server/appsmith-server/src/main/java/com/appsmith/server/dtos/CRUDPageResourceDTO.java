package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Map;
import java.util.Set;

/**
 * This class will hold the fields that will be consumed by the server, which will be received
 * from the clients request body
 */
@NoArgsConstructor
@Getter
@Setter
public class CRUDPageResourceDTO {

    // This will be defaultApplicationId if the application is connected with git
    String applicationId;

    String datasourceId;

    String tableName;

    String searchColumn;

    Set<String> columns;

    Map<String, String> pluginSpecificParams;
}
