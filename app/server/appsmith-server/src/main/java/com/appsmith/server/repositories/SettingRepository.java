package com.appsmith.server.repositories;

import com.appsmith.server.domains.Setting;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface SettingRepository extends BaseRepository<Setting, String>, CustomSettingRepository {

    Mono<Setting> findByKey(String key);
}
