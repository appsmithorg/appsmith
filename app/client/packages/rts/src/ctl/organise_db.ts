import * as utils from "./utils";

// Main application workflow
export async function run(forceOption) {
    console.log("Organising database  ....");
    const dbUrl = utils.getDburl();
    const redisUrl = utils.getRedisUrl();

    await utils.ensureSupervisorIsRunning();
  
    try {
      console.log("stop backend & rts application before organise database");
      await utils.stop(["backend", "rts"]);
      let mongoShellCmdResult: string;
  
      try {
        mongoShellCmdResult = await utils.execCommandReturningOutput([
          "mongo",
          dbUrl,
          "--quiet",
          "--eval",
          "db.organization.updateOne({slug:'default'}, {$set:{'organizationConfiguration.isFormLoginEnabled':true}})",
        ]);
      } catch (error) {
        console.error("Failed to execute mongo command:", error);
        throw error;
      }
      try {
      const organizationId = await utils.execCommandReturningOutput([
        "mongo",
        dbUrl,
        "--quiet",
        "--eval",
        "db.organization.findOne({slug:'default'},{_id:1})",
      ]);
    } catch (error) {
      console.error("Failed to execute mongo command:", error);
      throw error;
    }
    try {
      await utils.execCommand([
        "redis-cli",
        "-h",
        redisUrl,
        "-p",
        "6379",
        "--eval",
        `del organization:${organizationId}`
      ]);
    } catch (error) {
      console.error("Failed to execute redis command:", error);
      throw error;
    }
      console.log(`Organising database done for organization: ${organizationId}`);
    } catch (error) {
      console.error("Failed to execute redis command:", error);
      throw error;
    }
    console.log("Organising database done");
}