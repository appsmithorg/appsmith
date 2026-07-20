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

    // User-facing label so a user can tell their tokens apart (e.g. "Claude Desktop", "CI pipeline"). Optional at
    // creation; the service defaults a blank one to "Token created <date>". Not a credential — safe to display and
    // return in the token list.
    private String name;

    @ToString.Exclude
    private String tokenHash;

    // Absolute expiry; a token stops authenticating after this instant. Bounds the blast radius of a leaked token.
    private Instant expiresAt;
}
