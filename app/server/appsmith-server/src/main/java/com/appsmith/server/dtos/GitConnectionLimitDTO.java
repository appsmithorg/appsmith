/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.dtos;

import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GitConnectionLimitDTO {

  int repoLimit;

  Instant expiryTime;
}
