package com.appsmith.server.domains;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * LayoutSystem captures widget positioning Mode of the application
 */
@Data
@NoArgsConstructor
@Getter
@Setter
@EqualsAndHashCode
public class LayoutSystem {
    @JsonView(Views.Public.class)
    LayoutType type;

    public LayoutSystem(LayoutType type) {
        this.type = type;
    }
}
