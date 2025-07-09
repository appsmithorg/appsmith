import * as utils from "./utils";

export async function run() {
  const dbUrl = utils.getDburl();
  const redisUrl = utils.getRedisUrl();

  // Validate required configuration
  if (!dbUrl) {
    throw new Error(
      "Database URL not found. Please check APPSMITH_DB_URL or APPSMITH_MONGODB_URI configuration.",
    );
  }

  if (!redisUrl) {
    throw new Error(
      "Redis URL not found. Please check APPSMITH_REDIS_URL configuration.",
    );
  }

  await utils.ensureSupervisorIsRunning();

  let organizationId: string;

  try {
    // First, check if the organization exists
    const orgCheckResult = await utils.execCommandReturningOutput([
      "mongosh",
      dbUrl,
      "--eval",
      "db.organization.findOne({slug:'default'},{_id:1,slug:1})",
      "--json",
    ]);

    const orgData = JSON.parse(orgCheckResult);

    if (!orgData || !orgData._id) {
      throw new Error("Organization with slug 'default' not found in database");
    }

    console.log("Found organization:", orgData.slug);

    // Update the organization to enable form login
    await utils.execCommand([
      "mongosh",
      dbUrl,
      "--eval",
      "db.organization.updateOne({slug:'default'}, {$set:{'organizationConfiguration.isFormLoginEnabled':true}})",
      "--json",
    ]);

    organizationId = orgData._id.$oid;
    console.log("Organization ID:", organizationId);

    console.log("Successfully updated organization configuration");
  } catch (error) {
    console.error("Failed to execute mongo command:", error);
    throw error;
  }

  // Clear Redis cache for the organization
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
    console.log("Successfully cleared organization cache from Redis");
  } catch (error) {
    console.error("Failed to execute redis command:", error);
    // Don't throw here as the main operation (enabling form login) was successful
    console.warn(
      "Warning: Failed to clear cache, but form login was enabled successfully",
    );
  }
}
