package com.appsmith.server.publish.packages.internal;

import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import reactor.core.publisher.Mono;

public class PublishPackageCECompatibleServiceImpl implements PublishPackageCECompatibleService {
    @Override
    public Mono<Boolean> publishPackage(String packageId) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }
}
