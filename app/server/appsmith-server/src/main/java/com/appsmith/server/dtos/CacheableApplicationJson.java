package com.appsmith.server.dtos;

import lombok.Data;

import java.time.Instant;

@Data
public class CacheableApplicationJson {

    ApplicationJson applicationJson;

    Instant cacheExpiryTime;
}
