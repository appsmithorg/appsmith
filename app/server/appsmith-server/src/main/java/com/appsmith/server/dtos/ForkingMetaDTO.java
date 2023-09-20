package com.appsmith.server.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class ForkingMetaDTO {

    String workspaceId;
    String environmentId;
    String applicationId;
    String pageId;
    Boolean forkWithConfiguration;
}
