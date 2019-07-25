package com.mobtools.server.services;

import com.mobtools.server.domains.Setting;
import reactor.core.publisher.Mono;

public interface SettingService extends CrudService<Setting, String> {

    Mono<Setting> getByKey(String key);
}
