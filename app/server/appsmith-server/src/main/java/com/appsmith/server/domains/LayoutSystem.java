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
    LayoutSystem.Type type;

    public LayoutSystem(LayoutSystem.Type type) {
        this.type = type;
    }

    public enum Type {
        FIXED,
        AUTO,
        ANVIL
    }
}
