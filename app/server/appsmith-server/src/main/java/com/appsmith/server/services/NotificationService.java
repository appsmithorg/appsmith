package com.appsmith.server.services;

import com.appsmith.server.domains.Notification;
import com.appsmith.server.dtos.ResponseDTO;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;

import java.util.List;

public interface NotificationService extends CrudService<Notification, String> {
    Mono<ResponseDTO<List<Notification>>> getAll(MultiValueMap<String, String> params);
}
