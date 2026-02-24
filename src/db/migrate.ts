import { migrate } from "drizzle-orm/mysql2/migrator";
import { db } from "./index";

async function runMigrations() {
  console.log("Running migrations...");
  
  try {
    await migrate(db, { migrationsFolder: "./src/db/migrations" });
    console.log("Migrations completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

runMigrations();
