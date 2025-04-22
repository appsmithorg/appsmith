package com.appsmith.server.refactors;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.constants.ArtifactType;
import lombok.Builder;
import lombok.Data;

/**
 * DTO class that holds context information used for analytics
 */
@Data
@Builder
public class AnalyticsContextDTO {
    private String username;
    private ArtifactType artifactType;
    private String artifactId;
    private BaseDomain domain;
}
