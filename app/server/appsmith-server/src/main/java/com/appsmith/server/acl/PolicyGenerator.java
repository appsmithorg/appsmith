package com.appsmith.server.acl;

import com.appsmith.server.acl.ce.PolicyGeneratorCE;

import javax.annotation.PostConstruct;

import org.springframework.stereotype.Component;


@Component
public class PolicyGenerator extends PolicyGeneratorCE {

    @PostConstruct
    @Override
    public void createPolicyGraph() {
        super.createPolicyGraph();
    }
}
