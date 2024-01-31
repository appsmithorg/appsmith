package com.external.plugins.dtos;

import lombok.Data;

import java.util.List;

@Data
public class AssociateDTO {
    private String datasourceId;
    private String workspaceId;
    private List<String> fileIds;
}
