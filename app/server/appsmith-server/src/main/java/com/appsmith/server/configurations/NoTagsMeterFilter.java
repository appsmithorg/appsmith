package com.appsmith.server.configurations;

import io.micrometer.core.instrument.Meter;
import io.micrometer.core.instrument.Tag;
import io.micrometer.core.instrument.Tags;
import io.micrometer.core.instrument.config.MeterFilter;

import java.util.List;
import java.util.Map;

public class NoTagsMeterFilter implements MeterFilter {
    private static final Map<String, List<String>> seriesExceptionMap = Map.of(
            "appsmith.total.plugin.execution", List.of("plugin"),
            "appsmith.total.server.execution", List.of("plugin"),
            "appsmith.get.datasource.context", List.of("plugin"));

    @Override
    public Meter.Id map(Meter.Id id) {
        // Remove all tags from the metric
        if (id.getName().startsWith("appsmith")) {
            List<String> allowedTags = seriesExceptionMap.get(id.getName());

            if (allowedTags != null) {
                Tags filteredTags = Tags.empty();
                for (Tag tag : id.getTags()) {
                    if (allowedTags.contains(tag.getKey())) {
                        filteredTags = filteredTags.and(tag);
                    }
                }
                return id.replaceTags(filteredTags);
            } else {
                // Remove all tags for other metrics
                return id.replaceTags(Tags.empty());
            }
        } else {
            return id;
        }
    }
}
