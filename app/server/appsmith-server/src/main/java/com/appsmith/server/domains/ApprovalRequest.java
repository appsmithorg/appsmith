package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.views.Views;
import com.appsmith.server.constants.ApprovalRequestStatus;
import com.fasterxml.jackson.annotation.JsonView;
import com.querydsl.core.annotations.QueryEntity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.Map;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@Document
@QueryEntity
@FieldNameConstants
public class ApprovalRequest extends BaseDomain {
    @JsonView(Views.Public.class)
    String requestName;

    @JsonView(Views.Public.class)
    String message;

    @JsonView(Views.Public.class)
    String workflowId;

    @JsonView(Views.Public.class)
    String runId;

    @JsonView(Views.Public.class)
    ApprovalRequestStatus resolutionStatus = ApprovalRequestStatus.PENDING;

    @JsonView(Views.Public.class)
    String resolutionReason;

    @JsonView(Views.Public.class)
    Instant resolvedAt;

    @JsonView(Views.Public.class)
    String resolvedBy;

    @JsonView(Views.Public.class)
    Set<String> allowedResolutions;

    @JsonView(Views.Public.class)
    String resolution;

    @JsonView(Views.Public.class)
    Map<String, Object> resolutionMetadata;

    @JsonView(Views.Public.class)
    Map<String, Object> creationMetadata;

    @JsonView(Views.Public.class)
    public Instant getCreationTime() {
        return this.createdAt;
    }

    public static class Fields extends BaseDomain.Fields {}
}
