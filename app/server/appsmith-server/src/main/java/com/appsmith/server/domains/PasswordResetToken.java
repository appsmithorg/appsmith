package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;

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
public class PasswordResetToken extends BaseDomain {
    @JsonView(Views.Public.class)
    String tokenHash;
    @JsonView(Views.Public.class)
    String email;
    @JsonView(Views.Public.class)
    int requestCount; // number of requests in last 24 hours
    @JsonView(Views.Public.class)
    Instant firstRequestTime; // when a request was first generated in last 24 hours
}
