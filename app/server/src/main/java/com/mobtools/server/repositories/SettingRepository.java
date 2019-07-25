package com.mobtools.server.repositories;

import com.mobtools.server.domains.Setting;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface SettingRepository extends BaseRepository<Setting, String> {

    Mono<Setting> findByKey(String key);
}
