package com.appsmith.server.solutions;

import com.appsmith.server.services.SessionUserService;
import com.corundumstudio.socketio.Configuration;
import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIONamespace;
import com.corundumstudio.socketio.SocketIOServer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;
import reactor.core.scheduler.Schedulers;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;

@Slf4j
@Component
public class RealTimeComponent {

    private final SocketIOServer server;

    private final SessionUserService sessionUserService;

    @Autowired
    public RealTimeComponent(SocketIOServer server, SessionUserService sessionUserService) {
        this.server = server;
        this.server.addConnectListener(this::onConnect);
        SocketIONamespace namespace = this.server.addNamespace("/chat");
        namespace.addConnectListener(this::onConnect);
        this.sessionUserService = sessionUserService;
    }

    @PostConstruct
    public void startServer() {
        log.info("Starting socket.io server.");
        // server.start();
    }

    @PreDestroy
    public void stopServer() {
        log.info("Stopping socket.io server.");
        // server.stop();
    }

    private void onConnect(SocketIOClient client) {
        sessionUserService.getCurrentUser()
                .map(user -> {
                    System.out.println("user in socket onConnect " + user);
                    return user;
                })
                .subscribeOn(Schedulers.elastic())
                .subscribe();
        log.info("Socket connected {}", client.getHandshakeData().getHttpHeaders().get("Cookie"));
        client.sendEvent("ping");
    }

    @Bean
    public static SocketIOServer socketIOServer() {
        System.out.println("Creating socket io server.");
        Configuration configuration = new Configuration();
        configuration.setHostname("localhost");
        configuration.setPort(8091);
        return new SocketIOServer(configuration);
    }

}
