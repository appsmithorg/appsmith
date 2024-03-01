package com.appsmith.server.workflows.constants;

public class WorkflowDefaultExecutables {
    public static final String MAIN_JS_OBJECT_BODY = "export default {"
            + "\n" + "\t/**"
            + "\n" + "\t* Entry point for Workflow execution. All activities to be executed should be defined here."
            + "\n"
            + "\t* @param data  This function takes in a json object as arguments (data) which can be passed when you trigger the workflow."
            + "\n" + "\t* @returns boolean Shall return true or false."
            + "\n" + "\t*/"
            + "\n" + "\tasync executeWorkflow(data) {"
            + "\n" + "\t\t// start writing your code here."
            + "\n" + "\n"
            + "\t\treturn true;"
            + "\n" + "\t}"
            + "\n" + "}"
            + "\n";
    public static final String EXECUTE_WORKFLOW_ACTION_BODY = "\tasync executeWorkflow(data) {"
            + "\n" + "\t\t// start writing your code here."
            + "\n" + "\n"
            + "\t\treturn true;"
            + "\n" + "\t}"
            + "\n";
}
