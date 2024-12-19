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
  const BATCH_SIZE = 1000; // Process 1000 documents at a time

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
      
      // Get total count for progress tracking
      const totalCount = await mongoDb
        .collection(collectionName)
        .countDocuments({ deleted: { $ne: true }, deletedAt: null });
      
      let processedCount = 0;
      const missingInPostgres = [];
      const fieldDiscrepancies = [];

      // Process in batches
      while (processedCount < totalCount) {
        const mongoDocs = await mongoDb
          .collection(collectionName)
          .find({ deleted: { $ne: true }, deletedAt: null })
          .skip(processedCount)
          .limit(BATCH_SIZE)
          .toArray();

        for (const mongoDoc of mongoDocs) {
          transformFields(mongoDoc);
          
          // Get full PostgreSQL record
          const pgRecord = await pgClient.query(
            `SELECT * FROM ${pgTableName} WHERE id = $1 AND "deletedAt" IS NULL`,
            [mongoDoc.id]
          );

          if (pgRecord.rows.length === 0) {
            missingInPostgres.push(mongoDoc.id);
            hasDiscrepancy = true;
            continue;
          }

          // Compare all fields
          const pgDoc = pgRecord.rows[0];
          const differences = compareDocuments(mongoDoc, pgDoc);
          
          if (differences.length > 0) {
            fieldDiscrepancies.push({
              id: mongoDoc.id,
              differences
            });
            hasDiscrepancy = true;
          }
        }

        processedCount += mongoDocs.length;
        console.log(`Progress: ${processedCount}/${totalCount} documents`);
      }

      // Get PostgreSQL documents not in MongoDB
      const pgDocs = await pgClient.query(
        `SELECT id FROM ${pgTableName} WHERE "deletedAt" IS NULL`
      );
      
      const pgIds = new Set(pgDocs.rows.map(row => row.id));
      const mongoIds = new Set(mongoDocs.map(doc => doc.id));
      
      const missingInMongo = [...pgIds].filter(id => !mongoIds.has(id));
      
      if (missingInMongo.length > 0 || missingInPostgres.length > 0 || fieldDiscrepancies.length > 0) {
        verificationResults.push({
          collectionName,
          mongoCount: totalCount,
          pgCount: pgIds.size,
          missingInPostgres,
          missingInMongo,
          fieldDiscrepancies
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

        if (result.fieldDiscrepancies.length > 0) {
          console.error('\nDocuments with field discrepancies:');
          result.fieldDiscrepancies.forEach(({ id, differences }) => {
            console.error(`\nDocument ID: ${id}`);
            differences.forEach(diff => console.error(`- ${diff}`));
          });
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

// Add helper function to compare documents
function compareDocuments(mongoDoc, pgDoc) {
  const differences = [];
  
  // Compare each field in MongoDB document
  for (const [key, mongoValue] of Object.entries(mongoDoc)) {
    // Skip internal MongoDB fields
    if (key === '_id') continue;
    
    const pgValue = pgDoc[key.toLowerCase()]; // PostgreSQL fields are lowercase
    
    if (!isEquivalent(mongoValue, pgValue)) {
      differences.push(`Field '${key}' mismatch - Mongo: ${mongoValue}, Postgres: ${pgValue}`);
    }
  }
  
  // Check for extra fields in PostgreSQL
  for (const [key, pgValue] of Object.entries(pgDoc)) {
    const mongoKey = key.toLowerCase();
    if (!mongoDoc.hasOwnProperty(mongoKey) && pgValue !== null) {
      differences.push(`Extra field in Postgres: '${key}' = ${pgValue}`);
    }
  }
  
  return differences;
}

// Helper function to compare values
function isEquivalent(value1, value2) {
  if (value1 === value2) return true;
  
  // Handle null/undefined
  if (!value1 && !value2) return true;
  if (!value1 || !value2) return false;
  
  // Handle arrays
  if (Array.isArray(value1) && Array.isArray(value2)) {
    return JSON.stringify(value1) === JSON.stringify(value2);
  }
  
  // Handle objects
  if (typeof value1 === 'object' && typeof value2 === 'object') {
    return JSON.stringify(value1) === JSON.stringify(value2);
  }
  
  return false;
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