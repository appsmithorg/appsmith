package com.appsmith.server.dtos;

import lombok.Data;

import java.io.Serializable;
import java.time.Instant;

@Data
public class CacheableApplicationJson implements Serializable {

    String applicationJson;

    Instant lastUpdated;
}
