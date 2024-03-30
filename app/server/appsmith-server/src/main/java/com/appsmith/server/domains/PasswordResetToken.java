package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.Where;

import java.time.Instant;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Entity
@Where(clause = "deleted_at IS NULL")
public class PasswordResetToken extends BaseDomain {
    String tokenHash;
    String email;
    int requestCount; // number of requests in last 24 hours
    Instant firstRequestTime; // when a request was first generated in last 24 hours
}
