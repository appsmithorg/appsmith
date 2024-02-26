package com.appsmith.server.dtos.ce;

import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;

import java.util.List;

@Getter
@Setter
@FieldNameConstants
public class RecentlyUsedEntityCE_DTO {
    String workspaceId;
    List<String> applicationIds;

    public static class Fields {}
}
