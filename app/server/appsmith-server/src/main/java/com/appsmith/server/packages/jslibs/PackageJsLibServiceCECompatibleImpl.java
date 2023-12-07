package com.appsmith.server.packages.jslibs;

import com.appsmith.server.domains.Package;
import com.appsmith.server.dtos.CustomJSLibContextDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.jslibs.context.ContextBasedJsLibServiceCE;
import com.mongodb.client.result.UpdateResult;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.Set;

@Service
public class PackageJsLibServiceCECompatibleImpl implements ContextBasedJsLibServiceCE<Package> {
    @Override
    public Mono<Set<CustomJSLibContextDTO>> getAllVisibleJSLibContextDTOFromContext(
            String contextId, String branchName, Boolean isViewMode) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<UpdateResult> updateJsLibsInContext(
            String contextId, String branchName, Set<CustomJSLibContextDTO> customJSLibContextDTOS) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }
}
