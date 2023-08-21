package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Package;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomPackageRepository;

public interface PackageRepositoryCE extends BaseRepository<Package, String>, CustomPackageRepository {}
