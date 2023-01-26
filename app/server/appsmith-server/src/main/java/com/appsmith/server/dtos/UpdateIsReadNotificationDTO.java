package com.appsmith.server.dtos;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import jakarta.validation.constraints.NotNull;

@Getter
@Setter
@EqualsAndHashCode
public class UpdateIsReadNotificationDTO {
    @NotNull
    @JsonView(Views.Public.class)
    private Boolean isRead;
}
