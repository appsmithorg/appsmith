package com.appsmith.server.controllers.ce;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Notification;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.dtos.UpdateIsReadNotificationByIdDTO;
import com.appsmith.server.dtos.UpdateIsReadNotificationDTO;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.NotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.validation.Valid;

import static com.appsmith.server.exceptions.AppsmithError.UNSUPPORTED_OPERATION;

@Slf4j
@RequestMapping(Url.NOTIFICATION_URL)
public class NotificationControllerCE extends BaseController<NotificationService, Notification, String> {

    public NotificationControllerCE(NotificationService service) {
        super(service);
    }

    @GetMapping("count/unread")
    public Mono<ResponseDTO<Long>> getUnreadCount() {
        return service.getUnreadCount()
                .map(response -> new ResponseDTO<>(HttpStatus.OK.value(), response, null));
    }

    @PatchMapping("isRead")
    public Mono<ResponseDTO<UpdateIsReadNotificationByIdDTO>> updateIsRead(
            @RequestBody @Valid UpdateIsReadNotificationByIdDTO body) {
        log.debug("Going to set isRead to notifications by id");
        return service.updateIsRead(body).map(
                dto -> new ResponseDTO<>(HttpStatus.OK.value(), dto, null, true)
        );
    }

    @PatchMapping("isRead/all")
    public Mono<ResponseDTO<UpdateIsReadNotificationDTO>> updateIsRead(
            @RequestBody @Valid UpdateIsReadNotificationDTO body) {
        log.debug("Going to set isRead to all notifications");
        return service.updateIsRead(body).map(
                dto -> new ResponseDTO<>(HttpStatus.OK.value(), dto, null, true)
        );
    }

    @Override
    public Mono<ResponseDTO<Notification>> create(Notification resource, String originHeader, ServerWebExchange exchange) {
        return Mono.error(new AppsmithException(UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<ResponseDTO<Notification>> update(String s, Notification resource, String ignoreBranchName) {
        return Mono.error(new AppsmithException(UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<ResponseDTO<Notification>> delete(String s, String ignoreBranchName) {
        return Mono.error(new AppsmithException(UNSUPPORTED_OPERATION));
    }
}
