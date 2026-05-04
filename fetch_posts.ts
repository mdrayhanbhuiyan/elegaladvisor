
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, orderBy, limit, query } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json' assert { type: 'json' };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);

async function fetchRecentPosts() {
  try {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(5));
    const snapshot = await getDocs(q);
    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      title: doc.data().title,
      content: doc.data().content,
      category: doc.data().category,
      focusKeyword: doc.data().focusKeyword,
      metaTitle: doc.data().metaTitle,
      metaDescription: doc.data().metaDescription
    }));
    console.log(JSON.stringify(posts, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }
  process.exit(0);
}

fetchRecentPosts();
