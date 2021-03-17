package com.appsmith.server.solutions;

import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIONamespace;
import com.corundumstudio.socketio.SocketIOServer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class RealTimeComponent {

    private final SocketIONamespace namespace;

    @Autowired
    public RealTimeComponent(SocketIOServer server) {
        namespace = server.addNamespace("/chat");
        namespace.addConnectListener(this::onConnect);
        // server.start();
    }

    private void onConnect(SocketIOClient client) {
        log.info("Socket connected {}", client.getHandshakeData().getHttpHeaders().get("Cookie"));
        client.sendEvent("ping");
    }

}
