package com.appsmith.server.dtos.ce;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class RecentlyUsedEntityCE_DTO {
    String workspaceId;
    List<String> applicationIds;
}
