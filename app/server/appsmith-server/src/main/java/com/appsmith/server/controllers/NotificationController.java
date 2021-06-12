package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.dtos.NotificationsResponseDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.dtos.UpdateIsReadNotificationByIdDTO;
import com.appsmith.server.dtos.UpdateIsReadNotificationDTO;
import com.appsmith.server.services.NotificationService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import javax.validation.Valid;

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

    @PutMapping("isRead")
    public Mono<ResponseDTO<UpdateIsReadNotificationByIdDTO>> updateIsRead(
            @RequestBody @Valid UpdateIsReadNotificationByIdDTO body) {
        log.debug("Going to set isRead to notifications by id");
        return notificationService.updateIsRead(body);
    }

    @PutMapping("isRead/all")
    public Mono<ResponseDTO<UpdateIsReadNotificationDTO>> updateIsRead(
            @RequestBody @Valid UpdateIsReadNotificationDTO body) {
        log.debug("Going to set isRead to all notifications");
        return notificationService.updateIsRead(body);
    }

}
