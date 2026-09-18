package com.appsmith.server.domains.ce;

import com.appsmith.external.models.BaseDomain;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.FieldNameConstants;

import java.time.Instant;

@Getter
@Setter
@ToString
@FieldNameConstants
public class McpKeyCE extends BaseDomain {

    private String userId;

    // User-facing label so a user can tell their keys apart (e.g. "Claude Desktop", "CI pipeline").
    private String name;

    // Chosen lifetime in days; allowed values are 30, 60, 90, 180, 365. Used to compute token expiresAt on
    // create and rotate (from now).
    private Integer keySpanDays;

    private Instant revokedAt;
}
