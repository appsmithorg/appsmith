package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.dtos.NotificationsResponseDTO;
import com.appsmith.server.services.NotificationService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@Slf4j
@RestController
@RequestMapping(Url.NOTIFICATION_URL)
@AllArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("")
    public Mono<NotificationsResponseDTO> getAll(@RequestParam MultiValueMap<String, String> params) {
        log.debug("Going to get all resources");
        return notificationService.getAll(params);
    }

}
