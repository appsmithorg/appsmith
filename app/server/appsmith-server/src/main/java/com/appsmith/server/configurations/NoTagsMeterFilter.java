package com.appsmith.server.configurations;

import io.micrometer.core.instrument.Meter;
import io.micrometer.core.instrument.Tags;
import io.micrometer.core.instrument.config.MeterFilter;

public class NoTagsMeterFilter implements MeterFilter {
    @Override
    public Meter.Id map(Meter.Id id) {
        // Remove all tags from the metric
        if (id.getName().startsWith("appsmith")) {
            return id.replaceTags(Tags.empty());
        }
        return id;
    }
}
