package com.appsmith.server.packages.publish;

import reactor.core.publisher.Mono;

public interface PublishPackageCECompatibleService {
    Mono<Boolean> publishPackage(String packageId);
}
