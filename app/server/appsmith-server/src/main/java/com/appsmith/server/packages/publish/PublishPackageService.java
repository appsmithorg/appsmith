package com.appsmith.server.packages.publish;

import reactor.core.publisher.Mono;

public interface PublishPackageService extends PublishPackageCECompatibleService {
    Mono<Boolean> publishPackage(String packageId);
}
