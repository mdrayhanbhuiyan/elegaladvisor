import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

async function diagnose() {
  console.log("--- Firebase Admin Diagnostic ---");
  
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (!fs.existsSync(configPath)) {
    console.error("Config file not found!");
    return;
  }
  
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const projectId = config.projectId;
  const databaseId = config.firestoreDatabaseId;
  
  console.log(`Config Project: ${projectId}`);
  console.log(`Config Database: ${databaseId}`);
  console.log(`Ambient Project: ${process.env.GOOGLE_CLOUD_PROJECT}`);

  try {
    const app = initializeApp({
      projectId: projectId,
      // No credential specified to use applicationDefault
    });
    
    console.log("App initialized.");
    
    const db = databaseId && databaseId !== '(default)' 
      ? getFirestore(app, databaseId) 
      : getFirestore(app);
      
    console.log(`Targeting database: ${db.databaseId || '(default)'}`);
    
    console.log("Testing read on 'posts'...");
    const snap = await db.collection('posts').limit(1).get();
    console.log(`Read successful! Found ${snap.size} posts.`);
    
  } catch (err: any) {
    console.error("DIAGNOSTIC FAILED:");
    console.error(`Code: ${err.code}`);
    console.error(`Message: ${err.message}`);
    
    if (err.message && err.message.includes("not been used in project")) {
      console.log("\nPOSSIBLE CAUSE: Firestore API not enabled in the TARGET project.");
    } else if (err.code === 7) {
      console.log("\nPOSSIBLE CAUSE: IAM Permissions missing for the service account.");
    }
  }
}

diagnose();
