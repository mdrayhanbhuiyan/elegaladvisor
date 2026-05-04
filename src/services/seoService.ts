import { GoogleGenAI, Type } from "@google/genai";

export interface SEOAuditResult {
  score: number;
  readabilityScore: number;
  grammarScore: number;
  keywordDensityScore: number;
  tips: {
    category: 'readability' | 'grammar' | 'seo' | 'quality';
    message: string;
    impact: 'high' | 'medium' | 'low';
  }[];
  summary: string;
}

export async function performSEOAudit(content: string, title: string, focusKeyword: string): Promise<SEOAuditResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  
  const prompt = `Perform a comprehensive SEO and content quality audit on the following blog post article.
  
  TITLE: ${title}
  FOCUS KEYWORD: ${focusKeyword}
  CONTENT (Analyzed Segment):
  ${content.substring(0, 30000)}
  
  Analyze:
  1. Readability: Sentence structure, simplicity, flow.
  2. Grammar: Spelling, punctuation, syntax errors.
  3. SEO: Keyword integration, headline usage, meta potential.
  4. Overall Quality: Value provided, institutional tone (financial/legal), engagement.
  
  Provide a detailed audit in JSON format.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["score", "readabilityScore", "grammarScore", "keywordDensityScore", "tips", "summary"],
          properties: {
            score: { type: Type.NUMBER, description: "Overall SEO and quality score (0-100)" },
            readabilityScore: { type: Type.NUMBER, description: "Readability score (0-100)" },
            grammarScore: { type: Type.NUMBER, description: "Grammar and syntax score (0-100)" },
            keywordDensityScore: { type: Type.NUMBER, description: "Focus keyword integration score (0-100)" },
            summary: { type: Type.STRING, description: "Clear executive summary of the content quality" },
            tips: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["category", "message", "impact"],
                properties: {
                  category: { type: Type.STRING, enum: ["readability", "grammar", "seo", "quality"] },
                  message: { type: Type.STRING, description: "Actionable advice to improve the post" },
                  impact: { type: Type.STRING, enum: ["high", "medium", "low"], description: "Priority level of the tip" }
                }
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error: any) {
    console.error("SEO Audit Error:", error);
    if (error.message?.includes('429') || error.message?.includes('quota')) {
      throw new Error("🚀 AI Service Busy! Please wait a moment before running the audit again.");
    }
    throw error;
  }
}

export interface SEOOpportunities {
  metaTitle: {
    current: string;
    suggestion: string;
    reason: string;
  };
  metaDescription: {
    current: string;
    suggestion: string;
    reason: string;
  };
  focusKeyword: {
    current: string;
    suggestion: string;
    reason: string;
  };
}

export async function getSEOOpportunities(content: string, title: string, currentMetaTitle: string, currentMetaDescription: string, currentFocusKeyword: string): Promise<SEOOpportunities> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  
  const prompt = `Critically analyze the current SEO metadata for the following legal/financial blog post and suggest specific improvements.
  
  POST CONTENT (First 2000 chars): ${content.substring(0, 2000)}
  CURRENT TITLE: ${title}
  CURRENT META TITLE: ${currentMetaTitle}
  CURRENT META DESCRIPTION: ${currentMetaDescription}
  CURRENT FOCUS KEYWORD: ${currentFocusKeyword}
  
  Requirements:
  1. Suggest a higher-impact, search-optimized Meta Title.
  2. Suggest a more compelling, action-oriented Meta Description (max 160 chars).
  3. Suggest a more effective Focus Keyword based on the actual content topic.
  4. Provide a brief reason for each change.
  
  Respond in JSON format.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["metaTitle", "metaDescription", "focusKeyword"],
          properties: {
            metaTitle: {
              type: Type.OBJECT,
              required: ["current", "suggestion", "reason"],
              properties: {
                current: { type: Type.STRING },
                suggestion: { type: Type.STRING },
                reason: { type: Type.STRING }
              }
            },
            metaDescription: {
              type: Type.OBJECT,
              required: ["current", "suggestion", "reason"],
              properties: {
                current: { type: Type.STRING },
                suggestion: { type: Type.STRING },
                reason: { type: Type.STRING }
              }
            },
            focusKeyword: {
              type: Type.OBJECT,
              required: ["current", "suggestion", "reason"],
              properties: {
                current: { type: Type.STRING },
                suggestion: { type: Type.STRING },
                reason: { type: Type.STRING }
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error: any) {
    console.error("SEO Opportunities Error:", error);
    if (error.message?.includes('429') || error.message?.includes('quota')) {
      throw new Error("🚀 AI Rate Limit Hit! Unable to fetch SEO suggestions. Please retry in 60s.");
    }
    throw error;
  }
}

export async function getRelatedSuggestions(category: string, focusKeyword: string): Promise<string[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  
  const prompt = `Based on the financial/legal category "${category}" and the focus keyword "${focusKeyword}", suggest 5 high-value related keywords or micro-topics that would be relevant for a blog post. 
  The suggestions should be professional, SEO-friendly, and specific to North American markets (USA/Canada).

  Provide the result as a simple JSON array of strings.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error: any) {
    console.error("Related Suggestions Error:", error);
    if (error.message?.includes('429') || error.message?.includes('quota')) {
      throw new Error("🚀 AI busy. Please wait a moment for keyword suggestions.");
    }
    throw error;
  }
}

export interface InternalLinkSuggestion {
  title: string;
  url: string;
  reason: string;
}

export interface ContextualSuggestions {
  relatedTopics: string[];
  keywords: string[];
  internalLinks: InternalLinkSuggestion[];
}

/**
 * Rephrases content to sound more human and natural while maintaining SEO value.
 */
export async function humanizeContent(content: string): Promise<string> {
  if (!content || content.length < 50) return content;

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  
  const prompt = `You are a world-class copywriter specializing in legal and financial topics. 
  Your goal is to "humanize" the following Markdown content.
  
  RULES:
  1. Remove robotic, repetitive, or "AI-sounding" phrases (e.g., "In conclusion," "It is important to note," "Furthermore," etc. unless used naturally).
  2. Improve the flow and rhythm of sentences.
  3. USE ACTIVE VOICE.
  4. Ensure the content feels authoritative yet accessible, like a real expert talking to a client.
  5. PRESERVE ALL MARKDOWN FORMATTING (headers, lists, bolding).
  6. PRESERVE ALL SEO KEYWORDS AND CONTEXT.
  7. Do not change the underlying meaning or facts.
  
  CONTENT TO HUMANIZE:
  ${content}
  
  Respond with ONLY the rephrased Markdown content.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text.trim() || content;
  } catch (error: any) {
    console.error("Humanize Content Error:", error);
    return content;
  }
}

/**
 * Provides real-time contextual suggestions for the editor.
 */
export async function getEditorSuggestions(
  content: string, 
  category: string,
  existingPosts: { title: string; slug: string }[]
): Promise<ContextualSuggestions> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  
  // Format existing posts for context, limiting to a reasonable amount.
  const postsContext = existingPosts.slice(0, 40).map(p => `- ${p.title} (/blog/${p.slug})`).join('\n');
  
  const prompt = `Analyze this legal/financial blog post fragment and provide contextual suggestions.
  
  CATEGORY: ${category}
  CONTENT:
  ${content.substring(Math.max(0, content.length - 2000))}
  
  EXISTING ARTICLES FOR LINKING:
  ${postsContext}
  
  Provide exactly:
  1. 3 related topics or angles to explore next.
  2. 5 relevant keywords (LSI/Semantic) to include.
  3. 2-3 specific internal linking opportunities from the provided list that fit the current context.
  
  Respond in JSON format.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["relatedTopics", "keywords", "internalLinks"],
          properties: {
            relatedTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
            keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            internalLinks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["title", "url", "reason"],
                properties: {
                  title: { type: Type.STRING },
                  url: { type: Type.STRING },
                  reason: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error: any) {
    console.error("Contextual Suggestions Error:", error);
    return {
      relatedTopics: [],
      keywords: [],
      internalLinks: []
    };
  }
}

/**
 * Analyzes the blog post content and suggests relevant internal links to other existing posts.
 * @param content The content of the current blog post.
 * @param existingPosts A list of existing post titles and slugs to link to.
 * @returns An array of internal link suggestions.
 */
export async function getInternalLinkingSuggestions(
  content: string, 
  existingPosts: { title: string; slug: string }[]
): Promise<InternalLinkSuggestion[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  
  // Format existing posts for context, limiting to a reasonable amount.
  const postsContext = existingPosts.slice(0, 30).map(p => `- Title: ${p.title} (URL: /blog/${p.slug})`).join('\n');
  
  const prompt = `Analyze the following legal/financial blog post content and suggest 3-5 relevant internal links from the list of existing articles provided below.
  
  CURRENT CONTENT (Analyzed Segment):
  ${content.substring(0, 15000)}
  
  LIST OF EXISTING ARTICLES:
  ${postsContext}
  
  Requirements:
  1. Only suggest links that are present in the "LIST OF EXISTING ARTICLES".
  2. Select articles that directly complement or expand upon topics mentioned in the current content.
  3. For each suggestion, return the exact title, the URL, and a 1-sentence reason why it should be linked.
  
  Respond in JSON format as an array of objects mapping to the InternalLinkSuggestion interface.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ["title", "url", "reason"],
            properties: {
              title: { type: Type.STRING },
              url: { type: Type.STRING },
              reason: { type: Type.STRING }
            }
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error: any) {
    console.error("Internal Linking Error:", error);
    if (error.message?.includes('429') || error.message?.includes('quota')) {
      throw new Error("🚀 AI Rate Limit. Linking suggestions temporarily unavailable.");
    }
    throw error;
  }
}

/**
 * Uses AI to rank or filter a list of candidate posts based on their relevance to a target post.
 */
export async function getRelatedPostsByAI(
  targetPost: { title: string; category: string; focusKeyword?: string },
  candidatePosts: { id: string; title: string; category: string; slug: string }[]
): Promise<string[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  
  const candidatesContext = candidatePosts.slice(0, 30).map(p => `- ID: ${p.id}, Title: ${p.title} (Category: ${p.category})`).join('\n');
  
  const prompt = `You are a content recommendation engine for a legal/financial blog.
  Find the top 4 most relevant articles from the "CANDIDATE ARTICLES" list that relate to the "TARGET ARTICLE".
  
  TARGET ARTICLE:
  Title: ${targetPost.title}
  Category: ${targetPost.category}
  Focus Keyword: ${targetPost.focusKeyword || 'N/A'}
  
  CANDIDATE ARTICLES:
  ${candidatesContext}
  
  Requirements:
  1. Priority should be given to conceptual similarity over just matching categories.
  2. Return only the IDs of the top 4 most relevant articles.
  3. If there are fewer than 4 good matches, return the best ones available.
  
  Respond strictly in JSON format as an array of strings (IDs).`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (err) {
    console.error("AI Recommendation Error:", err);
    return [];
  }
}
