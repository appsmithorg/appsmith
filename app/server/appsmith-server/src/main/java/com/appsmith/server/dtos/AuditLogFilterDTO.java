package com.appsmith.server.dtos;

import lombok.Data;

import java.util.List;
import java.util.Set;

@Data
public class AuditLogFilterDTO {
    List<String> emails;

    List<String> eventName;
}
