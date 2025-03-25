package com.appsmith.server.configurations;

import io.micrometer.core.instrument.Meter;
import io.micrometer.core.instrument.Tag;
import io.micrometer.core.instrument.Tags;
import io.micrometer.core.instrument.config.MeterFilter;

import java.util.List;
import java.util.Map;

import static com.appsmith.external.constants.spans.ce.ActionSpanCE.ACTION_EXECUTION_DATASOURCE_CONTEXT;
import static com.appsmith.external.constants.spans.ce.ActionSpanCE.ACTION_EXECUTION_PLUGIN_EXECUTION;
import static com.appsmith.external.constants.spans.ce.ActionSpanCE.ACTION_EXECUTION_SERVER_EXECUTION;
import static com.appsmith.external.git.constants.ce.GitSpanCE.FS_FETCH_REMOTE;
import static com.appsmith.external.git.constants.ce.GitSpanCE.FS_RESET;
import static com.appsmith.external.git.constants.ce.GitSpanCE.FS_STATUS;
import static com.appsmith.external.git.constants.ce.GitSpanCE.JGIT_FETCH_REMOTE;
import static com.appsmith.external.git.constants.ce.GitSpanCE.JGIT_RESET_HARD;
import static com.appsmith.external.git.constants.ce.GitSpanCE.JGIT_STATUS;

public class NoTagsMeterFilter implements MeterFilter {
    private static final Map<String, List<String>> seriesExceptionMap = Map.of(
            ACTION_EXECUTION_PLUGIN_EXECUTION, List.of("plugin"),
            ACTION_EXECUTION_SERVER_EXECUTION, List.of("plugin"),
            ACTION_EXECUTION_DATASOURCE_CONTEXT, List.of("plugin"),
            FS_STATUS, List.of(),
            JGIT_STATUS, List.of(),
            FS_RESET, List.of(),
            JGIT_RESET_HARD, List.of(),
            FS_FETCH_REMOTE, List.of(),
            JGIT_FETCH_REMOTE, List.of());

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
