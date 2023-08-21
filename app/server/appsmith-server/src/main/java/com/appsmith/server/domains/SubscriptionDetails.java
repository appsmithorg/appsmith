package com.appsmith.server.domains;

import lombok.Data;

import java.time.Instant;

@Data
public class SubscriptionDetails {
    private Instant startDate;
    private Instant endDate;
    private Instant currentCycleStartDate;
    private String subscriptionStatus;
    private Integer users;
    private Integer sessions;
    private Integer freeSessions;
    private Payment payment;
    private String customerEmail;

    @Data
    private static class Payment {
        private Status status;
        // in cents
        private Long dueAmount;

        public enum Status {
            PAID,
            DUE
        }
    }
}
