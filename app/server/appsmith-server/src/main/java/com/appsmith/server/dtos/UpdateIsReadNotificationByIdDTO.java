package com.appsmith.server.dtos;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

@Getter
@Setter
@EqualsAndHashCode(callSuper = true)
public class UpdateIsReadNotificationByIdDTO extends UpdateIsReadNotificationDTO {
    @NotNull
    @NotEmpty
    @JsonView(Views.Public.class)
    private List<String> idList;
}
