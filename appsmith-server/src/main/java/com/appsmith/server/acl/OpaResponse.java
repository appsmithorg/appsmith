package com.appsmith.server.acl;

import lombok.Setter;
import lombok.ToString;

@Setter
@ToString
public class OpaResponse {
    Boolean result;

    public boolean isSuccessful() {
        return Boolean.TRUE.equals(result);
    }
}
