import { MongoClient } from "mongodb";
import pg from "pg";
import { transformFields } from "./utils.mjs";

function isArchivedObject(doc) {
  return doc.deleted === true || doc.deletedAt != null;
}

/**
 * Verifies data integrity between MongoDB and PostgreSQL
 * @param {string} mongoUrl - MongoDB connection URL
 * @param {string} pgUrl - PostgreSQL connection URL
 * @returns {Promise<void>}
 */
// usage node verify-migration.mjs --mongodb-url="mongodb://localhost:27017/dbname" --postgres-url="postgresql://user:password@localhost:5432/dbname"
async function verifyMigration(mongoUrl, pgUrl) {
  const mongoClient = new MongoClient(mongoUrl);
  const pgClient = new pg.Client(pgUrl);

  try {
    await mongoClient.connect();
    await pgClient.connect();
    
    const mongoDb = mongoClient.db();
    const collections = await mongoDb
      .listCollections({}, { nameOnly: true })
      .toArray();
    
    let hasDiscrepancy = false;
    const verificationResults = [];

    for (const collection of collections) {
      const collectionName = collection.name;
      
      if (collectionName.startsWith('mongock')) {
        continue;
      }

      console.log(`\nVerifying collection: ${collectionName}`);
      const pgTableName = collectionName.toLowerCase();
      
      // Get all MongoDB documents and filter out archived ones
      const allMongoDocs = await mongoDb
        .collection(collectionName)
        .find({})
        .toArray();
        
      const mongoDocs = allMongoDocs.filter(doc => !isArchivedObject(doc));

      const missingInPostgres = [];
      
      // Verify each document exists in PostgreSQL
      for (const mongoDoc of mongoDocs) {
        transformFields(mongoDoc);

        const pgRecord = await pgClient.query(
          `SELECT id FROM ${pgTableName} WHERE id = $1 AND "deletedAt" IS NULL`,
          [mongoDoc.id]
        );

        if (pgRecord.rows.length === 0) {
          missingInPostgres.push(mongoDoc.id);
          hasDiscrepancy = true;
        }
      }

      // Get PostgreSQL documents not in MongoDB
      const pgDocs = await pgClient.query(
        `SELECT id FROM ${pgTableName} WHERE "deletedAt" IS NULL`
      );
      
      const pgIds = new Set(pgDocs.rows.map(row => row.id));
      const mongoIds = new Set(mongoDocs.map(doc => doc.id));
      
      const missingInMongo = [...pgIds].filter(id => !mongoIds.has(id));
      
      if (missingInMongo.length > 0 || missingInPostgres.length > 0) {
        verificationResults.push({
          collectionName,
          mongoCount: mongoDocs.length,
          pgCount: pgIds.size,
          missingInPostgres,
          missingInMongo
        });
      }
    }

    // Print verification summary
    if (verificationResults.length > 0) {
      console.error('\n❌ Data verification failed: Discrepancies found');
      
      verificationResults.forEach(result => {
        console.error(`\nCollection: ${result.collectionName}`);
        console.error(`MongoDB count: ${result.mongoCount}, PostgreSQL count: ${result.pgCount}`);
        
        if (result.missingInPostgres.length > 0) {
          console.error('\nDocuments missing in PostgreSQL:');
          result.missingInPostgres.forEach(id => console.error(`- ${id}`));
        }
        
        if (result.missingInMongo.length > 0) {
          console.error('\nDocuments missing in MongoDB:');
          result.missingInMongo.forEach(id => console.error(`- ${id}`));
        }
      });
      
      process.exit(1);
    } else {
      console.log('\n✓ Data verification successful: All records match');
    }

  } catch (error) {
    console.error('Error during verification:', error);
    process.exit(1);
  } finally {
    await mongoClient.close();
    await pgClient.end();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
let mongoUrl, pgUrl;

for (const arg of args) {
  if (arg.startsWith('--mongodb-url=')) {
    mongoUrl = arg.split('=')[1];
  } else if (arg.startsWith('--postgres-url=')) {
    pgUrl = arg.split('=')[1];
  }
}

if (!mongoUrl || !pgUrl) {
  console.error('Usage: node verify-migration.mjs --mongodb-url=<url> --postgres-url=<url>');
  process.exit(1);
}

verifyMigration(mongoUrl, pgUrl).catch(console.error); 