package com.appsmith.server.domains.ce;

import com.appsmith.external.models.BaseDomain;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.FieldNameConstants;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.Instant;

@Getter
@Setter
@ToString
@FieldNameConstants
public class UserMcpTokenCE extends BaseDomain {

    @Indexed(unique = true)
    private String tokenId;

    private String userId;

    @ToString.Exclude
    private String tokenHash;

    // Absolute expiry; a token stops authenticating after this instant. Bounds the blast radius of a leaked token.
    private Instant expiresAt;
}
