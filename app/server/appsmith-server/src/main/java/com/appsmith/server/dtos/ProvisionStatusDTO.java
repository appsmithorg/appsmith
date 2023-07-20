package com.appsmith.server.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@Builder
@Data
@NoArgsConstructor
public class ProvisionStatusDTO {
    private String lastUpdatedAt = null;
    private String provisionStatus;
    private long provisionedUsers = 0;
    private long provisionedGroups = 0;
}
