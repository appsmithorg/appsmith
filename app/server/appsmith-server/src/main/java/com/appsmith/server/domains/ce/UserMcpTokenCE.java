package com.appsmith.server.domains.ce;

import com.appsmith.external.models.BaseDomain;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.FieldNameConstants;
import org.springframework.data.mongodb.core.index.Indexed;

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
}
