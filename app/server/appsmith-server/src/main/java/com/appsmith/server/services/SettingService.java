package com.appsmith.server.services;

import com.appsmith.server.domains.Setting;
import reactor.core.publisher.Mono;

public interface SettingService extends CrudService<Setting, String> {

    Mono<Setting> getByKey(String key);
}
