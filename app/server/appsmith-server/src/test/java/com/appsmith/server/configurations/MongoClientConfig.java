package com.appsmith.server.configurations;

import com.mongodb.client.MongoClient;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.context.annotation.Configuration;

import javax.annotation.PostConstruct;
import javax.annotation.Resource;
import java.util.concurrent.TimeUnit;

import static org.awaitility.Awaitility.await;

@Slf4j
@Configuration
public class MongoClientConfig {

    @Resource
    private MongoClient mongoClient;

    final String ADMIN_DB = "admin";

    @PostConstruct
    public void waitForReplicaSetStatusOk() {
        mongoClient
                .getDatabase(ADMIN_DB)
                // init replica set, aka rs.initiate()
                .runCommand(new Document("replSetInitiate", new Document()));

        await().atMost(30, TimeUnit.SECONDS)
                .pollInterval(1, TimeUnit.SECONDS)
                .until(() -> isReplicaSetReady(mongoClient));
    }

    private Boolean isReplicaSetReady(MongoClient mongoClient) {

        double replSetStatusOk = (double) mongoClient
                .getDatabase(ADMIN_DB)
                .runCommand(new Document("replSetGetStatus", 1))
                .get("ok");

        if (replSetStatusOk == 1.0) {
            log.debug("ReplStatusOK is 1.0");
            boolean currentIsMaster = (boolean) mongoClient
                    .getDatabase(ADMIN_DB)
                    .runCommand(new Document("isMaster", 1)).get("ismaster");

            if (!currentIsMaster) {
                log.debug("Replica set is not ready. Waiting for node to become master.");
            } else {
                log.debug("Replica set is ready. Node is now master.");
            }
            return currentIsMaster;
        } else {
            log.debug("Replica set is not ready. Waiting for replStatusOK to be 1.0. Currently {}", replSetStatusOk);
            return false;
        }
    }
}
