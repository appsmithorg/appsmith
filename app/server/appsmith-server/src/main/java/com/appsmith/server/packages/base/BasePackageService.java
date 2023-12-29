package com.appsmith.server.packages.base;

import com.appsmith.server.domains.Package;
import com.appsmith.server.dtos.PackageDTO;
import reactor.core.publisher.Mono;

public interface BasePackageService extends BasePackageServiceCECompatible {

    Mono<PackageDTO> setTransientFieldsFromPackageToPackageDTO(Package aPackage, PackageDTO packageDTO);
}
