package com.appsmith.server.controllers;

import com.appsmith.server.controllers.ce.IndexControllerCE;
import com.appsmith.server.services.SessionUserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("")
public class IndexController extends IndexControllerCE {

    public IndexController(SessionUserService service,
                           ReactiveRedisTemplate<String,
                           String> reactiveTemplate,
                           ChannelTopic topic) {

        super(service, reactiveTemplate, topic);
    }
}
