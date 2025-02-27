package com.appsmith.server.configurations;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.web.embedded.netty.NettyReactiveWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.stereotype.Component;

import java.util.function.Function;

@RequiredArgsConstructor
@Component
public class ReactorNettyConfiguration implements WebServerFactoryCustomizer<NettyReactiveWebServerFactory> {

    private final CommonConfig commonConfig;

    @Override
    public void customize(NettyReactiveWebServerFactory factory) {
        factory.addServerCustomizers(httpServer -> httpServer.metrics(true, Function.identity()));
    }
}
