package com.appsmith.server.packages.metadata;

import com.appsmith.server.domains.Package;
import reactor.core.publisher.Mono;

public interface PackageMetadataService {
    Mono<Package> saveLastEditInformation(String packageId);
}
