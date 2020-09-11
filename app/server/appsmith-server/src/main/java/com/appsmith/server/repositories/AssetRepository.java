package com.appsmith.server.repositories;

import com.appsmith.server.domains.Asset;
import org.springframework.stereotype.Repository;

@Repository
public interface AssetRepository extends BaseRepository<Asset, String> {
}
