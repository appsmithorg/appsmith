package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.enums.McpTokenStatus;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.FieldNameConstants;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Getter
@Setter
@ToString
@Document
@FieldNameConstants
public class McpToken extends BaseDomain {

    // Denormalized for authentication without a join to McpKey.
    private String userId;

    // McpKey.id (Mongo `_id`).
    private String mcpKeyId;

    @ToString.Exclude
    private String tokenHash;

    // A given McpKey should have at most one ACTIVE token. Rotate marks that row ROTATED and inserts a new ACTIVE
    // row; revoke marks it REVOKED. Historical ROTATED/REVOKED rows are kept on purpose.
    private McpTokenStatus status;

    private Instant expiresAt;

    // Last rotate or revoke on this token row.
    private Instant actedAt;
}
