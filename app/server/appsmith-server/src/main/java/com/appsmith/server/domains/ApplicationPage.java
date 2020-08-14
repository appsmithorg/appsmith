package com.appsmith.server.domains;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import net.minidev.json.annotate.JsonIgnore;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationPage {

    String id;

    Boolean isDefault;

    @JsonIgnore
    public boolean isDefault() {
        return Boolean.TRUE.equals(isDefault);
    }

}
