package com.appsmith.external.constants.spans.ce;

import com.appsmith.external.constants.spans.BaseSpan;

public class HealthSpanCE {

    public static final String HEALTH = "health.";
    public static final String MONGO_HEALTH = BaseSpan.APPSMITH_SPAN_PREFIX + HEALTH + "mongo";
    public static final String REDIS_HEALTH = BaseSpan.APPSMITH_SPAN_PREFIX + HEALTH + "redis";
}
