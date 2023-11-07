package com.appsmith.server.datasourcestorages.base;

import reactor.core.publisher.Mono;

public interface DatasourceStorageServiceCECompatible extends DatasourceStorageServiceCE {

    Mono<Long> getDatasourceStorageDTOsAllowed();
}
