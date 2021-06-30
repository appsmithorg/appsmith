package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Set;

/**
 * This class will hold the fields that will be consumed by the server, which will be received
 * from the clients request body
 */
@NoArgsConstructor
@Getter
@Setter
public class CRUDPageResourceDTO {

    String applicationId;

    String datasourceId;

    String tableName;

    Set<String> columnNames;
}
