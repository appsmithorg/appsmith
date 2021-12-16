package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.NotificationControllerCE;
import com.appsmith.server.services.NotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping(Url.NOTIFICATION_URL)
public class NotificationController extends NotificationControllerCE {

    public NotificationController(NotificationService service) {
        super(service);
    }

}
