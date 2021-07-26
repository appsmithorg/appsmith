package com.appsmith.server.dtos;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotNull;

@Getter
@Setter
@EqualsAndHashCode
public class UpdateIsReadNotificationDTO {
    @NotNull
    private Boolean isRead;
}
