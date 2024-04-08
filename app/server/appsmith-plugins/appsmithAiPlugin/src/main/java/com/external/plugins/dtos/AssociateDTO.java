package com.external.plugins.dtos;

import lombok.Data;

import java.util.List;

/**
 * DTO to define datasource association with file ids
 */
@Data
public class AssociateDTO {
    private String datasourceId;
    private String workspaceId;
    private List<String> fileIds;
}
