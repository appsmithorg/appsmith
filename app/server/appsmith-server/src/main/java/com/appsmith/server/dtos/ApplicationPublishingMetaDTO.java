package com.appsmith.server.dtos;

import com.appsmith.external.models.PluginType;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.ApplicationPage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class ApplicationPublishingMetaDTO {
    String applicationId;
    boolean isPublishedManually;

    // Required for analytics
    Mono<List<ApplicationPage>> applicationPagesMono;
    Mono<Map<PluginType, Integer>> actionCountByPluginTypeMapMono;
    Mono<List<ActionCollection>> publishedActionCollectionsListMono;
    Mono<Set<CustomJSLibContextDTO>> updatedPublishedJSLibDTOsMono;
}
