package com.appsmith.server.dtos;

import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
public class CacheableApplicationTemplate {

    List<ApplicationTemplate> applicationTemplateList;

    Instant cacheExpiryTime;
}
