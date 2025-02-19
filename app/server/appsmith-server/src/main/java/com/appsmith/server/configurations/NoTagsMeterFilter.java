package com.appsmith.server.configurations;

import io.micrometer.core.instrument.Meter;
import io.micrometer.core.instrument.Tags;
import io.micrometer.core.instrument.config.MeterFilter;

import java.util.List;

public class NoTagsMeterFilter implements MeterFilter {
    private static final List<String> seriesExceptionList = List.of(
            "appsmith.total.plugin.execution", "appsmith.total.server.execution", "appsmith.get.datasource.context");

    @Override
    public Meter.Id map(Meter.Id id) {
        // Remove all tags from the metric
        if (id.getName().startsWith("appsmith") && !startsWithPrefix(id.getName())) {
            return id.replaceTags(Tags.empty());
        }
        return id;
    }

    private boolean startsWithPrefix(String metricName) {
        for (String prefix : seriesExceptionList) {
            if (metricName.startsWith(prefix)) {
                return true;
            }
        }
        return false;
    }
}
