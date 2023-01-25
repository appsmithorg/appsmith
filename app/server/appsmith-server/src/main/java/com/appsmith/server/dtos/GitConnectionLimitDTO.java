package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.Setter;
import reactor.core.publisher.Mono;

import java.time.Instant;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

@Getter
@Setter
public class GitConnectionLimitDTO {

    @JsonView(Views.Api.class)
    int repoLimit;

    @JsonView(Views.Api.class)
    Instant expiryTime;
}
