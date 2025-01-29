package com.appsmith.server.r2dbc;

import com.appsmith.server.domains.Asset;
import com.appsmith.server.r2dbc.base.BaseR2DBCRepository;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface AssetRepositoryR2DBC extends BaseR2DBCRepository<Asset, String> {

    @Query("SELECT * FROM asset WHERE file_name = :fileName AND deleted_at IS NULL")
    Mono<Asset> findByFileName(String fileName);
}
