package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.Setter;
import reactor.core.publisher.Mono;

import java.time.Instant;

@Getter
@Setter
public class GitConnectionLimitDTO {

    int repoLimit;

    Instant expiryTime;
}
