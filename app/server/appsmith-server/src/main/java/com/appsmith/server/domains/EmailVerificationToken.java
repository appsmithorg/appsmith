package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
public class EmailVerificationToken extends BaseDomain {
    String tokenHash;
    String email;
    Instant tokenGeneratedAt;
    String organizationId;
}
