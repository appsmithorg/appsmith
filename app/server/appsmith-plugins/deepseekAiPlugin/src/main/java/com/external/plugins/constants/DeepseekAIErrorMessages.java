package com.external.plugins.constants;

public class DeepseekAIErrorMessages {

    public static final String STRING_APPENDER = "%s %s";
    public static final String EXECUTION_FAILURE = "Query failed to execute because";
    public static final String QUERY_FAILED_TO_EXECUTE = "Your query failed to execute";
    public static final String MODEL_NOT_SELECTED = "model hasn't been selected. Please select a model";
    public static final String INPUT_NOT_CONFIGURED = "embeddings input has not been configured properly";
    public static final String ENCODING_CONVERSION_ERROR = "embeddings' encoding format is not configured properly";
    public static final String QUERY_NOT_CONFIGURED = "query is not configured.";
    public static final String BAD_TEMPERATURE_CONFIGURATION =
            "temperature value doesn't conform to the contract. Please enter a real number between 0 and 2";
    public static final String BAD_TOP_P_CONFIGURATION =
            "top_p value doesn't conform to the contract. Please enter a real number between 0 and 1";
    public static final String BAD_FREQUENCY_PENALTY_CONFIGURATION =
            "frequency penalty value doesn't conform to the contract. Please enter a real number between -2 and 2";
    public static final String BAD_PRESENCE_PENALTY_CONFIGURATION =
            "presence penalty value doesn't conform to the contract. Please enter a real number between -2 and 2";
    public static final String BAD_STREAM_CONFIGURATION  ="stream value is not a boolean";
    public static final String BAD_MAX_TOKEN_CONFIGURATION = "max token value is not an integer number";
    public static final String INCORRECT_ROLE_VALUE =
            "role value is incorrect. Please choose a role value which conforms to the OpenAI contract";
    public static final String INCORRECT_MESSAGE_FORMAT =
            "messages object is not correctly configured. Please provide a list of messages";
    public static final String INCORRECT_USER_MESSAGE_FORMAT =
            "user messages object is not correctly configured. Please provide a list of user messages";
    public static final String INCORRECT_SYSTEM_MESSAGE_FORMAT =
            "system messages object is not correctly configured. Please provide a list of system messages";

    public static final String EMPTY_BEARER_TOKEN = "Bearer token should not be empty, Please add a bearer token";
}

//     public static final String STRING_APPENDER = "%s %s";
//     public static final String EXECUTION_FAILURE = "查询执行失败，原因是";
//     public static final String QUERY_FAILED_TO_EXECUTE = "您的查询执行失败";
//     public static final String MODEL_NOT_SELECTED = "尚未选择模型。请选择一个模型";
//     public static final String INPUT_NOT_CONFIGURED = "嵌入向量输入未正确配置";
//     public static final String ENCODING_CONVERSION_ERROR = "嵌入向量的编码格式未正确配置";
//     public static final String QUERY_NOT_CONFIGURED = "查询未配置。";
//     public static final String BAD_TEMPERATURE_CONFIGURATION =
//             "temperature值不符合要求。请输入0到2之间的实数";
//     public static final String BAD_MAX_TOKEN_CONFIGURATION = "最大token值不是整数";
//     public static final String INCORRECT_ROLE_VALUE =
//             "角色值不正确。请选择符合OpenAI规范的角色值";
//     public static final String INCORRECT_MESSAGE_FORMAT =
//             "消息对象配置不正确。请提供消息列表";
//     public static final String INCORRECT_USER_MESSAGE_FORMAT =
//             "用户消息对象配置不正确。请提供用户消息列表";
//     public static final String INCORRECT_SYSTEM_MESSAGE_FORMAT =
//             "系统消息对象配置不正确。请提供系统消息列表";

//     public static final String EMPTY_BEARER_TOKEN = "Bearer token不能为空，请添加Bearer token";