package com.appsmith.server.applications.jslibs;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.dtos.CustomJSLibContextDTO;
import com.appsmith.server.jslibs.context.ContextBasedJsLibServiceCE;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RequiredArgsConstructor
@Service
public class ApplicationJsLibServiceCEImpl implements ContextBasedJsLibServiceCE<Application> {

    protected final ApplicationService applicationService;

    @Override
    public Mono<Set<CustomJSLibContextDTO>> getAllVisibleJSLibContextDTOFromContext(
            String branchedContextId, Boolean isViewMode) {
        return applicationService
                .findByBranchedId(
                        branchedContextId,
                        List.of(
                                isViewMode
                                        ? Application.Fields.publishedCustomJSLibs
                                        : Application.Fields.unpublishedCustomJSLibs))
                .map(application -> {
                    if (isViewMode) {
                        return application.getPublishedCustomJSLibs() == null
                                ? new HashSet<>()
                                : application.getPublishedCustomJSLibs();
                    }

                    return application.getUnpublishedCustomJSLibs() == null
                            ? new HashSet<>()
                            : application.getUnpublishedCustomJSLibs();
                });
    }

    @Override
    public Mono<Integer> updateJsLibsInContext(
            String branchedContextId, Set<CustomJSLibContextDTO> updatedJSLibDTOSet) {
        Map<String, Object> fieldNameValueMap = Map.of(Application.Fields.unpublishedCustomJSLibs, updatedJSLibDTOSet);
        return applicationService.updateByBranchedIdAndFieldsMap(branchedContextId, fieldNameValueMap);
    }
}
