package com.appsmith.server.configurations;

import org.springframework.boot.web.embedded.netty.NettyReactiveWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.stereotype.Component;

import java.util.function.Function;

@Component
public class ReactorNettyConfiguration implements WebServerFactoryCustomizer<NettyReactiveWebServerFactory> {
    @Override
    public void customize(NettyReactiveWebServerFactory factory) {
        factory.addServerCustomizers(httpServer -> httpServer.metrics(true, Function.identity()));
    }
}
