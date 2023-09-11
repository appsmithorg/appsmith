package com.appsmith.server.repositories;

import com.appsmith.server.domains.Package;
import org.springframework.stereotype.Repository;

@Repository
public interface PackageRepository extends BaseRepository<Package, String>, CustomPackageRepository {}
