package com.appsmith.server.helpers;

import com.appsmith.external.dtos.DslExecutableDTO;
import org.apache.commons.lang.StringUtils;

import java.io.Serializable;
import java.util.Comparator;

public class CompareDslActionDTO implements Comparator<DslExecutableDTO>, Serializable {
    // Method to compare DslActionDTO based on id
    @Override
    public int compare(DslExecutableDTO action1, DslExecutableDTO action2) {
        if (action1 != null
                && !StringUtils.isEmpty(action1.getName())
                && action2 != null
                && !StringUtils.isEmpty(action2.getName())) {
            return action1.getName().compareTo(action2.getName());
        }
        return 1;
    }
}
