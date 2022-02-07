package com.appsmith.server.helpers;

import com.appsmith.server.dtos.DslActionDTO;

import java.io.Serializable;
import java.util.Comparator;

public class CompareDslActionDTO implements Comparator<DslActionDTO>, Serializable {
    // Method to compare DslActionDTO based on id
    @Override
    public int compare(DslActionDTO action1, DslActionDTO action2)
    {
        return action1.getId().compareTo(action2.getId());
    }
}
