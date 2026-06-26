package com.appsmith.server.helpers.ce;

import com.mongodb.reactivestreams.client.MongoClient;

public interface EnterpriseDowngradeGuardCE {

    void assertNotEnterpriseDatabase(MongoClient mongoClient, String databaseName);
}
