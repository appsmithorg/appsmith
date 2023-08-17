package com.appsmith.server.cron;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;

import java.io.IOException;

@Slf4j
public class RenewCertificate {

    @Scheduled(cron = "* * * * 0")
    public void renewCertificate() throws IOException {
        log.info("Renewing certificate");
        Runtime.getRuntime().exec(new String[] {
            "/opt/appsmith/renew-certificate.sh",
        });
    }
}
