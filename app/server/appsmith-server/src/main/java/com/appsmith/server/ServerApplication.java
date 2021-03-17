package com.appsmith.server;

import com.corundumstudio.socketio.Configuration;
import com.corundumstudio.socketio.SocketIOServer;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(ServerApplication.class, args);
    }

    @Bean
    public SocketIOServer socketIOServer() {
        System.out.println("Creating socket io server.");
        Configuration configuration = new Configuration();
        configuration.setHostname("localhost");
        configuration.setPort(8081);
        return new SocketIOServer(configuration);
    }

}
