package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.time.Instant;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Entity
public class EmailVerificationToken extends BaseDomain {
    String tokenHash;
    String email;
    Instant tokenGeneratedAt;
}
