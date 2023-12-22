package com.appsmith.server.publish.packages.internal;

import reactor.core.publisher.Mono;

public interface PublishPackageCECompatibleService {
    Mono<Boolean> publishPackage(String packageId);
}
