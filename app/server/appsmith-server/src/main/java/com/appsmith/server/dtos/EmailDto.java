package com.appsmith.server.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class EmailDto {
    String subject;
    String emailTemplate;
}
