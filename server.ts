import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
let db: Firestore | null = null;
let adminAvailable = false;

try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // Trimming to avoid trailing space issues
    const projectId = (config.projectId || process.env.GOOGLE_CLOUD_PROJECT || "").trim();
    const databaseId = config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)' 
      ? config.firestoreDatabaseId.trim() 
      : undefined;

    console.log(`[Firebase] Initializing Admin SDK for Project: "${projectId}", Database: "${databaseId || '(default)'}"`);

    // Initialize with explicit project ID
    const adminApp = initializeApp({
      projectId: projectId || undefined
    }, 'admin-app'); // Using named app to avoid collisions
    
    try {
      db = databaseId ? getFirestore(adminApp, databaseId) : getFirestore(adminApp);
      
      // Verification function
      const verifyAdmin = async () => {
        try {
          if (!db) return;
          // Simple read check
          await db.collection('posts').limit(1).get();
          adminAvailable = true;
          console.log("[Firebase] Admin SDK verified successfully.");
        } catch (err: any) {
          console.log(`[Firebase] Admin SDK access restricted (IAM/API limitation). Falling back to Client SDK. Reason: ${err.message || 'Permission Denied'}`);
          adminAvailable = false;
        }
      };
      verifyAdmin();

    } catch (dbError: any) {
      console.warn(`[Firebase] Admin targeting failed:`, dbError.message);
      db = getFirestore(adminApp);
    }
  }
} catch (e: any) {
  console.log("[Firebase] Admin SDK initialization skipped or failed:", e.message);
}

// Initialize Firebase Client SDK for Scheduler (fallback for IAM issues)
import { initializeApp as initializeClientApp } from "firebase/app";
import { getFirestore as getClientFirestore, collection as clientCollection, query as clientQuery, where as clientWhere, getDocs, updateDoc, doc as clientDoc } from "firebase/firestore";

let clientDb: any = null;
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const clientApp = initializeClientApp(config);
    clientDb = getClientFirestore(clientApp, config.firestoreDatabaseId);
    console.log("Firebase Client SDK initialized for backup scheduler.");
  }
} catch (e) {
  console.error("Firebase Client SDK initialization failed:", e);
}

// Background Scheduler
const startScheduler = () => {
  console.log("Post Scheduler started (checking every 60s)...");
  
  setInterval(async () => {
    try {
      const now = new Date().toISOString();
      let snapshot;
      
      // Decide which SDK to use
      if (adminAvailable && db) {
        try {
          snapshot = await db.collection('posts').where('status', '==', 'scheduled').get();
        } catch (adminError: any) {
          // If it fails now despite previous success, log once and degrade
          adminAvailable = false;
          console.warn("[Scheduler] Admin access lost, switching to Client SDK.");
        }
      }

      // Fallback or primary Client SDK use
      if (!adminAvailable || !snapshot) {
        if (clientDb) {
          const q = clientQuery(clientCollection(clientDb, 'posts'), clientWhere('status', '==', 'scheduled'));
          const clientSnap = await getDocs(q);
          snapshot = { 
            empty: clientSnap.empty, 
            docs: clientSnap.docs.map(d => ({ 
              id: d.id, 
              ref: d.ref, 
              data: () => d.data() 
            })) 
          };
        }
      }

      if (!snapshot || snapshot.empty) return;

      let publishedCount = 0;
      for (const postDoc of snapshot.docs) {
        const data = postDoc.data();
        if (data.publishDate && data.publishDate <= now) {
          console.log(`Publishing scheduled post: ${data.title}`);
          
          try {
            if (db && postDoc.ref.update) { // Admin SDK doc
               await postDoc.ref.update({ 
                status: 'published',
                updatedAt: now
              });
            } else if (clientDb) { // Client SDK doc or fallback
              const dRef = clientDoc(clientDb, 'posts', postDoc.id);
              await updateDoc(dRef, {
                status: 'published',
                updatedAt: now
              });
            }
            publishedCount++;
          } catch (updateError: any) {
            console.error(`Failed to publish post ${postDoc.id}:`, updateError.message);
          }
        }
      }

      if (publishedCount > 0) {
        console.log(`Successfully published ${publishedCount} posts.`);
      }
    } catch (error: any) {
      console.error("Scheduler Loop Error:", error.message || error);
    }
  }, 60000); // Check every minute
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // robots.txt
  app.get("/robots.txt", (req, res) => {
    res.type("text/plain");
    res.send("User-agent: *\nAllow: /\nSitemap: " + (process.env.APP_URL || "http://localhost:3000") + "/sitemap.xml");
  });

  // Sitemap.xml (Simplified)
  app.get("/sitemap.xml", (req, res) => {
    res.type("application/xml");
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${process.env.APP_URL || "http://localhost:3000"}/</loc></url>
  <url><loc>${process.env.APP_URL || "http://localhost:3000"}/blog</loc></url>
  <url><loc>${process.env.APP_URL || "http://localhost:3000"}/about</loc></url>
  <url><loc>${process.env.APP_URL || "http://localhost:3000"}/contact</loc></url>
</urlset>`;
    res.send(xml);
  });

  console.log(`Server environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Vite development middleware active.");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static files from dist.");
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      console.warn("Dist folder missing! Falling back to Vite middleware.");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    }
  }

  startScheduler();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
