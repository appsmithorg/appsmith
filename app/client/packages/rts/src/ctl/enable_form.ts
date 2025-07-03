import * as utils from "./utils";

export async function run() {
    console.log("Enabling form login");
    const dbUrl = utils.getDburl();
    const redisUrl = utils.getRedisUrl();

    await utils.ensureSupervisorIsRunning();
    try {
        await utils.execCommand([
            "mongosh",
            dbUrl,
            "--eval",
            "db.organization.updateOne({slug:'default'}, {$set:{'organizationConfiguration.isFormLoginEnabled':true}})",
            "--json",
        ]);
    } catch (error) {
        console.error("Failed to execute mongo command:", error);
        throw error;
    }
    const organizationData = await utils.execCommandReturningOutput(
        [
            "mongosh",
            dbUrl,
            "--eval",
            "db.organization.findOne({slug:'default'},{_id:1})",
            "--json",
        ]
    );
    const organizationId = JSON.parse(organizationData)._id.$oid;
    console.log("Organization ID:", organizationId);
    try {
        await utils.execCommand([
            "redis-cli",
            "--quoted-input",
            "-h",
            redisUrl,
            "-p",
            "6379",
            "DEL",
            `organization:${organizationId}`,
        ]);
    } catch (error) {
        console.error("Failed to execute redis command:", error);
        throw error;
    }
}