package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@ToString
@Document
public class AuditLog extends BaseDomain {
    String eventName;

    Instant eventDate;

    ApplicationInfo application;

    Git git;

    WorkspaceInfo workspace;

    Metadata metadata;

    Resource resource;

    UserInfo user;

    public AuditLog() {
        this.application = new ApplicationInfo();
        this.git = new Git();
        this.workspace = new WorkspaceInfo();
        this.metadata = new Metadata();
        this.resource = new Resource();
        this.user = new UserInfo();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public class ApplicationInfo {
        String id;

        String name;

        Git git;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public class Git {
        String branch;

        String defaultBranch;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public class WorkspaceInfo {
        String id;

        String name;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public class Metadata {
        String ipAddress;

        String appsmithVersion;

        Instant createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public class Resource {
        String id;

        String type;

        String name;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public class UserInfo {
        String id;

        String email;

        String name;

        String ipAddress;
    }

}