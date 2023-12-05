package com.appsmith.server.applications.jslibs;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.dtos.CustomJSLibContextDTO;
import com.appsmith.server.jslibs.context.ContextBasedJsLibServiceCE;
import com.mongodb.client.result.UpdateResult;
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

    private final ApplicationService applicationService;

    @Override
    public Mono<Set<CustomJSLibContextDTO>> getAllJSLibContextDTOFromContext(
            String contextId, String branchName, Boolean isViewMode) {
        return applicationService
                .findByIdAndBranchName(
                        contextId,
                        List.of(
                                isViewMode
                                        ? FieldName.PUBLISHED_JS_LIBS_IDENTIFIER_IN_APPLICATION_CLASS
                                        : FieldName.UNPUBLISHED_JS_LIBS_IDENTIFIER_IN_APPLICATION_CLASS),
                        branchName)
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
    public Mono<UpdateResult> updateJsLibsInContext(
            String contextId, String branchName, Set<CustomJSLibContextDTO> updatedJSLibDTOSet) {
        Map<String, Object> fieldNameValueMap =
                Map.of(FieldName.UNPUBLISHED_JS_LIBS_IDENTIFIER_IN_APPLICATION_CLASS, updatedJSLibDTOSet);
        return applicationService.update(contextId, fieldNameValueMap, branchName);
    }
}
