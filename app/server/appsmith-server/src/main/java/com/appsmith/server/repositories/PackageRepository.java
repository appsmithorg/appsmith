package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.PackageRepositoryCE;
import org.springframework.stereotype.Repository;

@Repository
public interface PackageRepository extends PackageRepositoryCE, CustomPackageRepository {}
