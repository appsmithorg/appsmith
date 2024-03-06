package com.appsmith.server.dtos;

import com.appsmith.server.domains.AuditLog;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.util.MultiValueMap;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuditLogExportDTO {
    List<AuditLog> data; // audit logs
    MultiValueMap<String, String> query; // filters
}
