import { GoogleGenAI, Type } from "@google/genai";
import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  setDoc,
  serverTimestamp 
} from "firebase/firestore";
import slugify from 'slugify';

export interface HighCPCTopic {
  title: string;
  focusKeyword: string;
  reason: string;
}

export interface GeneratedContent {
  metaTitle: string;
  metaDescription: string;
  title: string;
  content: string;
  tags: string[];
}

export interface AutoBlogConfig {
  isEnabled: boolean;
  lastRun: string | null;
  generationCountPerDay: number;
  targetRegion: string;
  categories: string[];
  publishDirectly: boolean;
}

const DEFAULT_CONFIG: AutoBlogConfig = {
  isEnabled: false,
  lastRun: null,
  generationCountPerDay: 5,
  targetRegion: "USA & Canada",
  categories: ["Loans", "Insurance", "Education", "Law"],
  publishDirectly: true
};

export async function getAutoBlogConfig(): Promise<AutoBlogConfig> {
  const configDoc = await getDoc(doc(db, 'settings', 'autoblog'));
  if (configDoc.exists()) {
    return configDoc.data() as AutoBlogConfig;
  }
  return DEFAULT_CONFIG;
}

export async function saveAutoBlogConfig(config: Partial<AutoBlogConfig>) {
  await setDoc(doc(db, 'settings', 'autoblog'), config, { merge: true });
}

export async function discoverHighCPCTopics(category: string, region: string = "USA & Canada"): Promise<HighCPCTopic[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  
  const prompt = `You are a niche topical research expert for high-CPC advertising (AdSense).
  Based on the category "${category}" and targeting the region "${region}", suggest 5 trending, high-value, and high-CPC (Cost Per Click) blog post topics.
  
  Requirements:
  1. Topics must be specific and address real problems (e.g., "Best Debt Consolidation Loans for Bad Credit in California").
  2. Topics should have high commercial intent and attract advertisers.
  3. Include a suggested Focus Keyword for each topic.
  4. Include a brief reason why this is High-CPC.

  Respond strictly in JSON format as an array of objects.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ["title", "focusKeyword", "reason"],
            properties: {
              title: { type: Type.STRING },
              focusKeyword: { type: Type.STRING },
              reason: { type: Type.STRING }
            }
          }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error: any) {
    if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      console.warn("Topical discovery skipped - AI Quota reached.");
    } else {
      console.error("Discovery error:", error);
    }
    return [];
  }
}

export async function generateAutoContent(topic: string, focusKeyword: string, category: string): Promise<GeneratedContent | null> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

  const prompt = `You are an elite financial and legal content creator. Write a comprehensive, SEO-optimized blog post.
  
  TOPIC: ${topic}
  FOCUS KEYWORD: ${focusKeyword}
  CATEGORY: ${category}
  TARGET REGION: USA & Canada
  
  Requirements:
  1. Format: Markdown.
  2. Tone: Professional, authoritative, institutional.
  3. Structure: 
     - Catchy Title
     - Detailed Intro
     - 4-6 Subheadings (H2, H3)
     - High-value professional advice
     - Conclusion
     - 3-5 FAQs
  4. Length: Long-form high-quality content.
  5. Include meta title, meta description, and tags.
 
  Respond strictly in JSON format.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["metaTitle", "metaDescription", "title", "content", "tags"],
          properties: {
            metaTitle: { type: Type.STRING },
            metaDescription: { type: Type.STRING },
            title: { type: Type.STRING },
            content: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error: any) {
    if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      console.warn("Content generation skipped - AI Quota reached.");
    } else {
      console.error("Generation error:", error);
    }
    return null;
  }
}

export function getStaggeredPublishDates(count: number) {
  const dates = [];
  const startHour = 12; // 8 AM EST (12 PM UTC)
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const d = new Date(now);
    // If we're before peak, start at 12 UTC
    if (now.getUTCHours() < startHour) {
      d.setUTCHours(startHour + (i * 2), Math.floor(Math.random() * 60), 0, 0);
    } else {
      // Stagger from now, but keep within peak if possible
      d.setUTCHours(now.getUTCHours() + (i * 2) + 1, Math.floor(Math.random() * 60), 0, 0);
    }
    dates.push(d.toISOString());
  }
  return dates;
}

export async function processAutoBlogCycle(authorId: string, authorName: string) {
  const config = await getAutoBlogConfig();
  if (!config.isEnabled) return { success: false, message: "Auto Blog is disabled" };

  const today = new Date().toISOString().split('T')[0];
  if (config.lastRun && config.lastRun.startsWith(today)) {
    return { success: false, message: "Already run today" };
  }

  const results = [];
  const staggeredDates = getStaggeredPublishDates(config.generationCountPerDay);

  for (let i = 0; i < config.generationCountPerDay; i++) {
    // Pick a random category from the list
    const category = config.categories[Math.floor(Math.random() * config.categories.length)];
    
    // 1. Discover Topic
    const topics = await discoverHighCPCTopics(category, config.targetRegion);
    if (topics.length === 0) continue;
    
    const topic = topics[0]; // Take the best one
    
    // 2. Generate Content
    const content = await generateAutoContent(topic.title, topic.focusKeyword, category);
    if (!content) continue;

    // 3. Save to Firestore
    const postSlug = slugify(content.title, { lower: true, strict: true });
    const publishDate = staggeredDates[i];
    const status = new Date(publishDate) <= new Date() ? 'published' : 'scheduled';

    const postData = {
      ...content,
      slug: postSlug,
      category,
      authorId,
      authorName,
      status: config.publishDirectly ? status : 'draft',
      publishDate,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      focusKeyword: topic.focusKeyword,
      thumbnail: `https://picsum.photos/seed/${postSlug}/1200/675`
    };

    const docRef = await addDoc(collection(db, 'posts'), postData);
    results.push({ id: docRef.id, title: content.title });
  }

  // Update last run
  await saveAutoBlogConfig({ lastRun: new Date().toISOString() });

  return { success: true, count: results.length, posts: results };
}
