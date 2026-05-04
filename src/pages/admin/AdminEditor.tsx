import { useState, useEffect, useDeferredValue, useMemo, memo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, getDocs, setDoc, collection, addDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Save, ArrowLeft, Eye, Sparkles, Wand2, Search, Gauge, CheckCircle2, 
  AlertCircle, Info, BarChart3, Loader2, Lightbulb, Plus,
  Bold, Italic, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, 
  Heading2, Heading3, Palette, Type, Quote
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { GoogleGenAI, Type as GenAIType } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { 
  performSEOAudit, 
  SEOAuditResult, 
  getRelatedSuggestions, 
  getSEOOpportunities, 
  SEOOpportunities,
  getEditorSuggestions,
  ContextualSuggestions,
  humanizeContent
} from '@/services/seoService';
import { 
  Link as LinkIcon, 
  Hash, 
  Layers,
  Smile
} from 'lucide-react';

// Memoized Preview component to prevent re-renders when other post fields change
const PostPreview = memo(({ title, content, thumbnail, viewMode }: any) => {
  return (
    <div className={`m-0 p-8 bg-slate-50/30 h-full overflow-y-auto`}>
      <article className="prose prose-slate max-w-none prose-indigo prose-headings:font-heading prose-headings:font-black prose-headings:tracking-tighter prose-img:rounded-2xl prose-img:shadow-lg">
        {viewMode !== 'split' && <h1 className="text-4xl mb-8">{title || "Untitled Preview"}</h1>}
        {thumbnail && viewMode !== 'split' && (
          <div className="mb-8 rounded-2xl overflow-hidden shadow-xl aspect-video border-4 border-white">
            <img src={thumbnail} alt="Featured" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
        )}
        <div className="markdown-preview">
          <ReactMarkdown rehypePlugins={[rehypeRaw]}>
            {content || "_Start typing to see preview..._"}
          </ReactMarkdown>
        </div>
      </article>
    </div>
  );
});

const SEOPanel = memo(({ 
  auditResult, 
  seoOpportunities, 
  handleAudit, 
  handleSEOAnalysis, 
  generateSEOMetadata, 
  loading, 
  analyzing, 
  analyzingOpportunities, 
  optimizingSEO,
  humanizing,
  handleHumanize,
  post,
  setPost,
  contextualAdvice,
  analyzingContext
}: any) => {
  return (
    <div className="space-y-6">
      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">SEO Intelligence</CardTitle>
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleHumanize} 
            disabled={humanizing || loading}
            title="Humanize Content (AI)"
            className="h-8 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
          >
            {humanizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smile className="w-4 h-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={generateSEOMetadata} 
            disabled={optimizingSEO || loading}
            title="Auto-Generate SEO Metadata"
            className="h-8 px-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
          >
            {optimizingSEO ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSEOAnalysis} 
            disabled={analyzingOpportunities || loading}
            title="Advanced SEO Analysis"
            className="h-8 px-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
          >
            {analyzingOpportunities ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleAudit} 
            disabled={analyzing}
            title="Run Content Audit"
            className="h-8 px-2 text-slate-600 hover:text-slate-700 hover:bg-slate-50"
          >
            {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gauge className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {auditResult && (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Content Score</span>
                <span className={`text-3xl font-black italic tracking-tighter ${auditResult.score >= 80 ? 'text-green-600' : auditResult.score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                  {auditResult.score}/100
                </span>
              </div>
              <div className="flex gap-2">
                <div className="flex flex-col items-center">
                  <span className="text-[8px] font-bold uppercase text-slate-400">Read</span>
                  <span className="text-xs font-black">{auditResult.readabilityScore}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[8px] font-bold uppercase text-slate-400">Gram</span>
                  <span className="text-xs font-black">{auditResult.grammarScore}</span>
                </div>
              </div>
            </div>
            
            <p className="text-[10px] text-slate-500 italic leading-relaxed">{auditResult.summary}</p>

            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Actionable Tips</span>
              {auditResult.tips.slice(0, 3).map((tip: any, i: number) => (
                <div key={i} className="flex gap-2 items-start group">
                  {tip.impact === 'high' ? <AlertCircle className="w-3 h-3 text-red-500 mt-0.5 shrink-0" /> : <CheckCircle2 className="w-3 h-3 text-indigo-500 mt-0.5 shrink-0" />}
                  <p className="text-[10px] font-medium text-slate-600 leading-snug group-hover:text-slate-900 transition-colors">{tip.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {seoOpportunities && (
          <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-4 animate-in slide-in-from-right-4 duration-500">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">SEO Opportunities</span>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Meta Title', data: seoOpportunities.metaTitle, field: 'metaTitle' },
                { label: 'Meta Description', data: seoOpportunities.metaDescription, field: 'metaDescription' },
                { label: 'Focus Keyword', data: seoOpportunities.focusKeyword, field: 'focusKeyword' }
              ].map((item, i) => (
                <div key={i} className="space-y-1.5 p-2 rounded-lg hover:bg-white/50 transition-colors group">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-tight">{item.label}</span>
                    <button 
                      onClick={() => setPost({ ...post, [item.field]: item.data.suggestion })}
                      className="text-[8px] font-black uppercase text-indigo-600 hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Apply Suggestion
                    </button>
                  </div>
                  <p className="text-[10px] font-bold text-slate-900 italic line-through decoration-slate-300 opacity-50">{item.data.current || "(Empty)"}</p>
                  <p className="text-[11px] font-black text-indigo-700 leading-tight">“{item.data.suggestion}”</p>
                  <div className="flex gap-1.5 items-start mt-1">
                    <Info className="w-2.5 h-2.5 text-indigo-400 mt-0.5 shrink-0" />
                    <p className="text-[9px] text-slate-500 font-medium italic">{item.data.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>

      {/* Contextual AI Advice Panel */}
      <Card className="border-none shadow-sm bg-indigo-50/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Live AI Copilot</CardTitle>
            {analyzingContext && <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!contextualAdvice ? (
            <div className="py-8 text-center space-y-2">
              <Sparkles className="w-6 h-6 text-indigo-200 mx-auto" />
              <p className="text-[10px] text-slate-400 font-medium italic">Type more to receive real-time contextual advice...</p>
            </div>
          ) : (
            <div className="space-y-5 animate-in fade-in duration-500">
              {/* Related Topics */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-indigo-500" />
                  <span className="text-[9px] font-black uppercase text-slate-500 tracking-tight">Expand the Story</span>
                </div>
                <div className="grid gap-2">
                  {contextualAdvice.relatedTopics.map((topic: string, i: number) => (
                    <button 
                      key={i}
                      onClick={() => setPost({ ...post, content: post.content + `\n\n## ${topic}\n` })}
                      className="text-[10px] font-bold text-slate-700 bg-white p-2 rounded-xl border border-indigo-100/50 text-left hover:border-indigo-400 hover:bg-indigo-50 transition-all group w-full"
                    >
                      <div className="flex items-center justify-between">
                        <span className="line-clamp-1">{topic}</span>
                        <Plus className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 text-indigo-600" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Keywords */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Hash className="w-3 h-3 text-emerald-500" />
                  <span className="text-[9px] font-black uppercase text-slate-500 tracking-tight">Semantic Keywords</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {contextualAdvice.keywords.map((kw: string, i: number) => (
                    <span key={i} className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[9px] font-black rounded-lg border border-emerald-100 italic">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* Internal Links */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <LinkIcon className="w-3 h-3 text-amber-500" />
                  <span className="text-[9px] font-black uppercase text-slate-500 tracking-tight">Internal Link Wins</span>
                </div>
                <div className="space-y-2">
                  {contextualAdvice.internalLinks.map((link: any, i: number) => (
                    <div key={i} className="p-2.5 bg-white rounded-xl border border-amber-100/50 space-y-1 group">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-900 line-clamp-1 italic">“{link.title}”</span>
                        <button 
                          onClick={() => setPost({ ...post, content: post.content + `\n\n[Read more: ${link.title}](${link.url})\n` })}
                          className="p-1 rounded-md hover:bg-amber-50 text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-[9px] text-slate-500 leading-tight font-medium italic">{link.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

export default function AdminEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [optimizingSEO, setOptimizingSEO] = useState(false);
  const [analyzingOpportunities, setAnalyzingOpportunities] = useState(false);
  const [analyzingContext, setAnalyzingContext] = useState(false);
  const [humanizing, setHumanizing] = useState(false);
  const [auditResult, setAuditResult] = useState<SEOAuditResult | null>(null);
  const [seoOpportunities, setSeoOpportunities] = useState<SEOOpportunities | null>(null);
  const [contextualAdvice, setContextualAdvice] = useState<ContextualSuggestions | null>(null);
  const [existingPosts, setExistingPosts] = useState<{title: string, slug: string}[]>([]);
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('edit' as any);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [post, setPost] = useState<any>({
    title: '',
    slug: '',
    category: 'Loans',
    content: '',
    status: 'draft',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    focusKeyword: '',
    thumbnail: '',
    tags: '',
  });

  // Performance Optimization: Use deferred value for heavy Markdown rendering
  const deferredContent = useDeferredValue(post.content);
  const deferredTitle = useDeferredValue(post.title);

  useEffect(() => {
    const fetchAllPosts = async () => {
      try {
        const postsRef = collection(db, 'posts');
        const snapshot = await getDocs(postsRef);
        const posts = snapshot.docs.map(doc => ({
          title: doc.data().title || '',
          slug: doc.data().slug || ''
        }));
        setExistingPosts(posts);
      } catch (err) {
        console.error("Fetch existing posts failed:", err);
      }
    };
    fetchAllPosts();
  }, []);

  // Real-time Contextual AI Logic
  useEffect(() => {
    if (!post.content || post.content.length < 300) return;
    
    const timeoutId = setTimeout(async () => {
      setAnalyzingContext(true);
      try {
        const advice = await getEditorSuggestions(post.content, post.category, existingPosts);
        setContextualAdvice(advice);
      } catch (err) {
        console.error("Contextual advice failed:", err);
      } finally {
        setAnalyzingContext(false);
      }
    }, 5000); // 5s debounce to keep it helpful but not noisy

    return () => clearTimeout(timeoutId);
  }, [post.content, post.category, existingPosts]);

  useEffect(() => {
    if (id) {
      const fetchPost = async () => {
        const docRef = doc(db, 'posts', id);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          setPost(prev => ({ ...prev, ...snapshot.data() }));
        }
      };
      fetchPost();
    }
  }, [id]);

  const handleSave = useCallback(async () => {
    setLoading(true);
    try {
      // Clean data for Firestore
      const data = {
        title: post.title || '',
        slug: post.slug || '',
        category: post.category || 'Loans',
        content: post.content || '',
        status: post.status || 'draft',
        metaTitle: post.metaTitle || '',
        metaDescription: post.metaDescription || '',
        metaKeywords: post.metaKeywords || '',
        focusKeyword: post.focusKeyword || '',
        thumbnail: post.thumbnail || '',
        tags: post.tags || '',
        updatedAt: new Date().toISOString(),
        publishDate: post.status === 'published' && !post.publishDate ? new Date().toISOString() : (post.publishDate || new Date().toISOString())
      };

      if (id) {
        await updateDoc(doc(db, 'posts', id), data);
      } else {
        await addDoc(collection(db, 'posts'), {
          ...data,
          createdAt: new Date().toISOString(),
          authorId: auth.currentUser?.uid,
          authorName: auth.currentUser?.displayName || 'Admin'
        });
      }
      toast.success("Post saved!");
      navigate('/admin/posts');
    } catch (error: any) {
      console.error("Save failed detail:", error);
      let errorMsg = "Save failed: Document might be too large (> 1MB)";
      
      if (error.message?.includes('quota') || error.code === 'resource-exhausted') {
        errorMsg = "🔥 Firestore quota reached for today! You can still edit, but changes won't save until it resets tomorrow.";
      } else if (error.message?.includes('permission-denied')) {
        errorMsg = "Access denied: You don't have permission to save this post.";
      }

      toast.error(errorMsg, { duration: 5000 });
    } finally {
      setLoading(false);
    }
  }, [id, navigate, post]);

  const handleAudit = useCallback(async () => {
    if (!post.content) {
      toast.error("Please add content first");
      return;
    }
    setAnalyzing(true);
    try {
      const result = await performSEOAudit(post.content, post.title, post.focusKeyword || "");
      setAuditResult(result);
      toast.success("SEO Audit completed!");
    } catch (error: any) {
      toast.error("Audit failed: " + error.message);
    } finally {
      setAnalyzing(false);
    }
  }, [post]);

  const handleGetSuggestions = useCallback(async () => {
    if (!post.focusKeyword || !post.category) {
      toast.error("Please add a focus keyword and category first");
      return;
    }
    setSuggesting(true);
    try {
      const result = await getRelatedSuggestions(post.category, post.focusKeyword);
      setSuggestions(result);
      toast.success("AI Suggestions ready!");
    } catch (error: any) {
      toast.error("Suggestions failed: " + error.message);
    } finally {
      setSuggesting(false);
    }
  }, [post]);

  const generateFullPostWithAI = useCallback(async () => {
    if (!post.title && !post.focusKeyword) {
      toast.error("Please provide a Title or Focus Keyword to generate content.");
      return;
    }
    setGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
      const prompt = `Generate a comprehensive, high-quality, SEO-optimized blog post for a legal/financial website.
      
      TOPIC: ${post.title || post.focusKeyword}
      CATEGORY: ${post.category}
      FOCUS KEYWORD: ${post.focusKeyword || post.title}

      Requirements:
      1. Use professional, authoritative, yet accessible tone (North American legal/financial standard).
      2. Format strictly in clean Markdown with H2 and H3 headings. Do not use raw HTML.
      3. Include bullet points and practical advice.
      4. Content must be high-CPC oriented and high quality.
      5. SEO Metadata: Provide a high-CTR Meta Title, a concise Meta Description, and a prime Focus Keyword.
      
      Respond only with JSON containing 'content', 'metaDescription', 'metaTitle', and 'focusKeyword' fields.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: GenAIType.OBJECT,
            required: ["content", "metaDescription", "metaTitle", "focusKeyword"],
            properties: {
              content: { type: GenAIType.STRING, description: "Full blog post content in Markdown" },
              metaDescription: { type: GenAIType.STRING, description: "SEO Meta Description" },
              metaTitle: { type: GenAIType.STRING, description: "SEO Meta Title (max 60 chars)" },
              focusKeyword: { type: GenAIType.STRING, description: "Primary SEO Keyword" }
            }
          }
        }
      });
      
      const result = JSON.parse(response.text);
      setPost({ 
        ...post, 
        content: result.content, 
        metaDescription: result.metaDescription,
        metaTitle: result.metaTitle,
        focusKeyword: result.focusKeyword,
        title: post.title || result.focusKeyword, // Use keyword as title if not set
        thumbnail: post.thumbnail || 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=1200&auto=format&fit=crop' // Fallback image
      });
      toast.success("AI Post Generated successfully!");
    } catch (error: any) {
      console.error("AI Generation Error:", error);
      if (error.message?.includes('429') || error.message?.includes('quota')) {
        toast.error("🚀 AI Quota Exceeded! Please wait a minute before trying again.", { duration: 5000 });
      } else {
        toast.error("AI Generation failed. Please check your content and try again.");
      }
    } finally {
      setGenerating(false);
    }
  }, [post]);

  const handleHumanize = useCallback(async () => {
    if (!post.content || post.content.length < 50) {
      toast.error("Add more content before humanizing");
      return;
    }
    
    setHumanizing(true);
    try {
      const humanizedContent = await humanizeContent(post.content);
      setPost((prev: any) => ({ ...prev, content: humanizedContent }));
      toast.success("Content humanized successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to humanize content");
    } finally {
      setHumanizing(false);
    }
  }, [post.content]);

  const generateSEOMetadata = useCallback(async () => {
    if (!post.title && !post.content) {
      toast.error("Please add a title or content first to generate SEO metadata.");
      return;
    }
    setOptimizingSEO(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
      const prompt = `Based on the following blog post title and content, generate optimized SEO metadata for a legal/financial blog.
      
      TITLE: ${post.title}
      CONTENT SUMMARY: ${post.content.substring(0, 1500)}

      Requirements:
      1. Meta Title: High impact, catchy, search-optimized (max 60 chars).
      2. Meta Description: Action-oriented summary (max 160 chars).
      3. Focus Keyword: The single most relevant keyword phrase for this content.
      4. Meta Keywords: A comma-separated list of 5-8 relevant semantic SEO keywords.

      Respond only with JSON containing 'metaTitle', 'metaDescription', 'focusKeyword', and 'metaKeywords' fields.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: GenAIType.OBJECT,
            required: ["metaTitle", "metaDescription", "focusKeyword", "metaKeywords"],
            properties: {
              metaTitle: { type: GenAIType.STRING },
              metaDescription: { type: GenAIType.STRING },
              focusKeyword: { type: GenAIType.STRING },
              metaKeywords: { type: GenAIType.STRING }
            }
          }
        }
      });
      
      const result = JSON.parse(response.text);
      setPost({ 
        ...post, 
        metaTitle: result.metaTitle,
        metaDescription: result.metaDescription,
        focusKeyword: result.focusKeyword,
        metaKeywords: result.metaKeywords
      });
      toast.success("SEO Metadata optimized by AI!");
    } catch (error: any) {
      console.error("AI SEO Error:", error);
      if (error.message?.includes('429') || error.message?.includes('quota')) {
        toast.error("🚀 AI Rate Limit Hit! Please wait 60 seconds.", { duration: 4000 });
      } else {
        toast.error("SEO generation failed. " + (error.message || ""));
      }
    } finally {
      setOptimizingSEO(false);
    }
  }, [post]);

  const handleSEOAnalysis = useCallback(async () => {
    if (!post.content) {
      toast.error("Please add content first");
      return;
    }
    setAnalyzingOpportunities(true);
    try {
      const result = await getSEOOpportunities(
        post.content, 
        post.title, 
        post.metaTitle || "", 
        post.metaDescription || "", 
        post.focusKeyword || ""
      );
      setSeoOpportunities(result);
      toast.success("Advanced SEO Analysis complete!");
    } catch (error: any) {
      toast.error("Analysis failed: " + error.message);
    } finally {
      setAnalyzingOpportunities(false);
    }
  }, [post]);

  const insertFormat = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    
    // Default dummy text if nothing is selected
    const contentToInsert = selectedText || (before.includes('<') ? 'Styled Text' : 'text');
    const newText = text.substring(0, start) + before + contentToInsert + after + text.substring(end);
    
    setPost({ ...post, content: newText });
    
    // Refocus and set selection (async to wait for re-render)
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + contentToInsert.length);
    }, 0);
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-primary/10 transition-colors">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/admin/posts')} 
            className="w-12 h-12 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-500 hover:text-indigo-600 transition-all group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </Button>
          <div className="flex flex-col">
             <Badge className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-none px-4 py-1.5 rounded-full uppercase text-[9px] font-black tracking-widest mb-2 block w-fit">
               Content Architecture
             </Badge>
             <h1 className="text-2xl font-heading text-secondary dark:text-white leading-tight uppercase tracking-tight">
               {id ? 'Refine Strategy Asset' : 'Engineer New Dispatch'}
             </h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" onClick={generateFullPostWithAI} disabled={loading || generating} className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 border-emerald-100 dark:border-emerald-900/40 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 h-12 rounded-xl px-6">
              {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
              AI Constructor
            </Button>
            <Button variant="outline" size="sm" onClick={handleHumanize} disabled={loading || humanizing || generating} className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600 border-purple-100 dark:border-purple-900/40 hover:bg-purple-50 dark:hover:bg-purple-900/10 h-12 rounded-xl px-6">
              {humanizing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Naturalize
            </Button>
            <Button size="sm" onClick={handleSave} disabled={loading || generating} className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-[0.3em] h-12 px-10 rounded-xl shadow-xl shadow-indigo-100 dark:shadow-none ml-auto sm:ml-0">
              <Save className="w-4 h-4 mr-2" /> {id ? 'Commit Update' : 'Initialize Asset'}
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border border-primary/5 shadow-none overflow-hidden bg-white dark:bg-slate-950 rounded-[3rem] transition-all duration-500">
            <CardContent className="p-0">
               <div className="p-10 pb-0 space-y-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                      <Type className="w-3 h-3" /> Core Asset Title
                    </Label>
                    <Input 
                      value={post.title || ""} 
                      onChange={e => setPost({...post, title: e.target.value})} 
                      placeholder="Mastering Legal Frameworks & Strategic Advantage..."
                      className="text-2xl font-heading font-black tracking-tight h-16 bg-muted/20 border-primary/5 rounded-2xl italic px-6 focus:ring-indigo-600"
                    />
                  </div>
               </div>

               <div className={`mt-8 border-t border-primary/5 ${viewMode === 'split' ? 'md:h-[85vh] h-[750px]' : ''}`}>
                 <div className="px-10 border-b border-primary/5 flex flex-wrap items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 h-14">
                    <div className="flex items-center h-full gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setViewMode('edit')}
                        className={`text-[9px] uppercase font-black tracking-[0.2em] rounded-none h-full border-b-2 transition-all px-6 ${viewMode === 'edit' ? 'border-indigo-600 text-indigo-600 bg-white dark:bg-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                      >
                        Source Editor
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setViewMode('preview')}
                        className={`text-[9px] uppercase font-black tracking-[0.2em] rounded-none h-full border-b-2 transition-all px-6 ${viewMode === 'preview' ? 'border-indigo-600 text-indigo-600 bg-white dark:bg-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                      >
                        Visual Preview
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setViewMode('split')}
                        className={`hidden md:flex text-[9px] uppercase font-black tracking-[0.2em] rounded-none h-full border-b-2 transition-all px-6 ${viewMode === 'split' ? 'border-indigo-600 text-indigo-600 bg-white dark:bg-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                      >
                        Duo Matrix
                      </Button>
                    </div>
                    <div className="hidden lg:flex items-center gap-3">
                       <div className="flex items-center gap-2 px-3 py-1 bg-white/50 dark:bg-slate-800 rounded-full border border-primary/5">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
                          <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Marked Logic Engaged</span>
                       </div>
                    </div>
                 </div>

                 {/* Proper Formatting Toolbar */}
                 <div className="px-10 py-3 border-b border-primary/5 bg-white dark:bg-slate-950 flex flex-wrap items-center gap-2 overflow-x-auto no-scrollbar shadow-sm sticky top-0 z-10 transition-colors">
                   {/* Basic Formatting */}
                   <div className="flex items-center gap-1 border-r border-primary/5 pr-4 mr-2 shrink-0">
                      <Button variant="ghost" size="icon" disabled={viewMode === 'preview'} onClick={() => insertFormat('**', '**')} className="h-10 w-10 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-all"><Bold className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" disabled={viewMode === 'preview'} onClick={() => insertFormat('*', '*')} className="h-10 w-10 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-all"><Italic className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" disabled={viewMode === 'preview'} onClick={() => insertFormat('> ')} className="h-10 w-10 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-all"><Quote className="w-4 h-4" /></Button>
                   </div>

                   {/* Headings */}
                   <div className="flex items-center gap-1 border-r border-primary/5 pr-4 mr-2 shrink-0">
                      <Button variant="ghost" size="sm" disabled={viewMode === 'preview'} onClick={() => insertFormat('## ')} className="h-10 px-4 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-all text-[10px] font-black tracking-widest uppercase"><Heading2 className="w-4 h-4 mr-2" /> Heading 2</Button>
                      <Button variant="ghost" size="sm" disabled={viewMode === 'preview'} onClick={() => insertFormat('### ')} className="h-10 px-4 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-all text-[10px] font-black tracking-widest uppercase"><Heading3 className="w-4 h-4 mr-2" /> Heading 3</Button>
                   </div>

                   {/* Lists */}
                   <div className="flex items-center gap-1 border-r border-primary/5 pr-4 mr-2 shrink-0">
                      <Button variant="ghost" size="icon" disabled={viewMode === 'preview'} onClick={() => insertFormat('- ')} className="h-10 w-10 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-all"><List className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" disabled={viewMode === 'preview'} onClick={() => insertFormat('1. ')} className="h-10 w-10 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-all"><ListOrdered className="w-4 h-4" /></Button>
                   </div>

                   {/* Size & Palette */}
                   <div className="flex items-center gap-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger disabled={viewMode === 'preview'} className="h-10 w-10 text-slate-500 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-all outline-none disabled:opacity-30">
                          <Palette className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-primary/5 p-2">
                          {[
                            { name: 'Corporate Indigo', hex: '#4f46e5' },
                            { name: 'Legal Crimson', hex: '#dc2626' },
                            { name: 'Advisory Blue', hex: '#2563eb' },
                            { name: 'System Emerald', hex: '#16a34a' },
                            { name: 'Strategic Amber', hex: '#d97706' },
                            { name: 'Neutral Slate', hex: '#475569' },
                          ].map((color) => (
                            <DropdownMenuItem key={color.name} onClick={() => insertFormat(`<span style="color: ${color.hex}">`, '</span>')} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest cursor-pointer rounded-xl p-3">
                              <div className="w-4 h-4 rounded-full border border-black/5" style={{ backgroundColor: color.hex }} /> {color.name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <DropdownMenu>
                        <DropdownMenuTrigger disabled={viewMode === 'preview'} className="h-10 w-10 text-slate-500 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-all outline-none disabled:opacity-30">
                          <Type className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-primary/5 p-2">
                          {[
                            { label: 'Minor Detail', val: '12px' },
                            { label: 'Standard Protocol', val: '18px' },
                            { label: 'Segment Callout', val: '24px' },
                            { label: 'Header Emphasis', val: '32px' },
                            { label: 'Core Command', val: '48px' },
                          ].map((size) => (
                            <DropdownMenuItem key={size.label} onClick={() => insertFormat(`<span style="font-size: ${size.val}; line-height: 1.2; display: inline-block;">`, '</span>')} className="text-[10px] font-black uppercase tracking-widest cursor-pointer rounded-xl p-3">
                              <span className="line-clamp-1">{size.label}</span> <span className="ml-auto opacity-40 font-mono italic">{size.val}</span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                   </div>
                 </div>
                 
                 <div className={`grid h-full ${viewMode === 'split' ? 'grid-cols-2 divide-x divide-primary/5 overflow-hidden' : 'grid-cols-1'}`}>
                    {(viewMode === 'edit' || viewMode === 'split') && (
                      <div className={`m-0 p-10 bg-white dark:bg-slate-950 shrink-0 ${viewMode === 'split' ? 'h-full overflow-y-auto' : 'min-h-[700px]'}`}>
                        <Textarea 
                          ref={textareaRef}
                          value={post.content || ""} 
                          onChange={e => setPost({...post, content: e.target.value})} 
                          className="min-h-full border-none focus-visible:ring-0 font-mono text-base leading-loose p-0 resize-none shadow-none bg-transparent dark:text-slate-300"
                          placeholder="Construct your institutional insights using semantic Markdown logic..."
                        />
                      </div>
                    )}

                    {(viewMode === 'preview' || viewMode === 'split') && (
                      <div className={viewMode === 'split' ? 'h-full overflow-y-auto' : ''}>
                        <PostPreview 
                          title={deferredTitle} 
                          content={deferredContent} 
                          thumbnail={post.thumbnail}
                          viewMode={viewMode}
                        />
                      </div>
                    )}
                 </div>
               </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8 animate-in slide-in-from-right-4 duration-700">
          <Card className="border border-primary/5 shadow-none bg-white dark:bg-slate-950 rounded-[2.5rem] overflow-hidden transition-all">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-primary/5 p-6">
              <div className="flex items-center gap-3">
                 <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-primary/5">
                    <Gauge className="w-4 h-4 text-indigo-600" />
                 </div>
                 <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Asset Parameters</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Electronic Slug</Label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs opacity-50">/</span>
                  <Input 
                    value={post.slug || ""} 
                    onChange={e => setPost({...post, slug: e.target.value})} 
                    placeholder="url-friendly-slug" 
                    className="h-12 pl-8 border-primary/10 bg-muted/20 focus:ring-indigo-600 rounded-xl font-mono text-xs font-bold"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Deployment Logic</Label>
                <Select value={post.category || ""} onValueChange={val => setPost({...post, category: val})}>
                  <SelectTrigger className="h-12 border-primary/5 bg-muted/20 rounded-xl text-xs font-bold font-heading uppercase tracking-widest px-4">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-primary/5 shadow-2xl">
                    <SelectItem value="Loans" className="text-[10px] font-black uppercase tracking-widest p-4">Loans Protocol</SelectItem>
                    <SelectItem value="Insurance" className="text-[10px] font-black uppercase tracking-widest p-4">Insurance Matrix</SelectItem>
                    <SelectItem value="Scholarships" className="text-[10px] font-black uppercase tracking-widest p-4">Grant Intelligence</SelectItem>
                    <SelectItem value="Credit-Cards" className="text-[10px] font-black uppercase tracking-widest p-4">Credit Analysis</SelectItem>
                    <SelectItem value="Travel" className="text-[10px] font-black uppercase tracking-widest p-4">Global Mobility</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Operational State</Label>
                <Select value={post.status || ""} onValueChange={val => setPost({...post, status: val})}>
                  <SelectTrigger className="h-12 border-primary/5 bg-muted/20 rounded-xl text-xs font-bold font-heading uppercase tracking-widest px-4">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-primary/5 shadow-2xl">
                    <SelectItem value="draft" className="text-[10px] font-black uppercase tracking-widest p-4">Stasis (Draft)</SelectItem>
                    <SelectItem value="published" className="text-[10px] font-black uppercase tracking-widest p-4">Active Deploy</SelectItem>
                    <SelectItem value="scheduled" className="text-[10px] font-black uppercase tracking-widest p-4">Tactical Timer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {post.status === 'scheduled' && (
                <div className="space-y-3 p-5 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 animate-in slide-in-from-top-4 duration-500">
                  <div className="flex items-center gap-2 mb-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></div>
                     <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-600">Precision Timer Enabled</Label>
                  </div>
                  <Input 
                    type="datetime-local" 
                    value={post.publishDate ? post.publishDate.substring(0, 16) : ''} 
                    onChange={e => setPost({...post, publishDate: new Date(e.target.value).toISOString()})}
                    className="h-12 bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-900/20 rounded-xl text-xs font-black uppercase"
                  />
                  <p className="text-[8px] text-indigo-400 font-bold tracking-widest uppercase mt-2">Relational sync engaged for automated release.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <SEOPanel 
            auditResult={auditResult}
            seoOpportunities={seoOpportunities}
            handleAudit={handleAudit}
            handleSEOAnalysis={handleSEOAnalysis}
            generateSEOMetadata={generateSEOMetadata}
            loading={loading}
            analyzing={analyzing}
            analyzingOpportunities={analyzingOpportunities}
            optimizingSEO={optimizingSEO}
            humanizing={humanizing}
            handleHumanize={handleHumanize}
            post={post}
            setPost={setPost}
            contextualAdvice={contextualAdvice}
            analyzingContext={analyzingContext}
          />

          <Card className="border border-primary/5 shadow-none bg-white dark:bg-slate-950 rounded-[2.5rem] overflow-hidden">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-primary/5 p-6 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-primary/5 text-emerald-600">
                    <BarChart3 className="w-4 h-4" />
                 </div>
                 <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Search Logic</CardTitle>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={generateSEOMetadata}
                disabled={optimizingSEO || loading}
                className="h-8 px-4 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 rounded-full text-[9px] font-black uppercase tracking-widest transition-all"
              >
                {optimizingSEO ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Sparkles className="w-3 h-3 mr-2" />}
                Sync
              </Button>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Focus Vector</Label>
                <div className="flex gap-2">
                  <Input 
                    value={post.focusKeyword || ""} 
                    onChange={e => setPost({...post, focusKeyword: e.target.value})} 
                    placeholder="e.g. strategic loans 2024"
                    className="h-12 border-primary/5 bg-muted/20 rounded-xl text-xs font-bold px-4"
                  />
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={handleGetSuggestions} 
                    disabled={suggesting}
                    className="h-12 w-12 shrink-0 border-primary/5 hover:border-indigo-600 text-indigo-600 bg-muted/20 hover:bg-indigo-50 rounded-xl transition-all shadow-sm"
                  >
                    {suggesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
                  </Button>
                </div>

                {suggestions.length > 0 && (
                  <div className="pt-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Tactical Expansions detected:</span>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.map((s, i) => (
                        <button 
                          key={i} 
                          onClick={() => setPost({...post, content: post.content + `\n\n## ${s}\n`})}
                          className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-primary/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-600 hover:border-indigo-600 hover:text-indigo-600 transition-all flex items-center gap-2 group"
                        >
                          <Plus className="w-3 h-3 group-hover:rotate-90 transition-transform" /> {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Semantic Meta Title</Label>
                <Input 
                  value={post.metaTitle || ""} 
                  onChange={e => setPost({...post, metaTitle: e.target.value})} 
                  placeholder="SEO Optimized Dispatch Title"
                  className="h-12 border-primary/5 bg-muted/20 rounded-xl text-xs font-bold px-4"
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Abstract Intelligence (Meta)</Label>
                  <span className={`text-[9px] font-black uppercase ${post.metaDescription?.length > 160 ? 'text-rose-500' : 'text-emerald-500'} bg-muted/50 px-2 py-0.5 rounded-full border border-primary/5 tracking-tighter`}>
                    {post.metaDescription?.length || 0} / 160
                  </span>
                </div>
                <Textarea 
                  value={post.metaDescription || ""} 
                  onChange={e => setPost({...post, metaDescription: e.target.value})} 
                  placeholder="Summarize the strategic value of this asset for search crawlers..."
                  className={`min-h-32 border-primary/5 bg-muted/20 rounded-2xl text-xs font-medium p-4 resize-none leading-relaxed italic ${post.metaDescription?.length > 160 ? 'border-rose-200' : ''}`}
                />
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-70 italic">Strategy: Aim for 155-160 characters for maximum CTR engagement.</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Visual Identification Asset</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={async () => {
                      if (!post.title) {
                        toast.error("Add a title first to generate visual identity.");
                        return;
                      }
                      setGenerating(true);
                      try {
                        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
                        const prompt = `Suggest a professional, high-quality Unsplash image URL for a blog post about: "${post.title}". Return only the URL.`;
                        const response = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: prompt });
                        const urlMatch = response.text.match(/https:\/\/images\.unsplash\.com\/photo-[^?\s"']+/);
                        if (urlMatch) {
                          setPost({ ...post, thumbnail: urlMatch[0] + "?q=80&w=1200&auto=format&fit=crop" });
                          toast.success("AI Visual Identity identified!");
                        } else {
                          setPost({ ...post, thumbnail: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=1200&auto=format&fit=crop' });
                        }
                      } catch (error: any) {
                        toast.error("Visual generation logic failed.");
                      } finally {
                        setGenerating(false);
                      }
                    }}
                    disabled={generating}
                    className="h-8 px-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-full text-[9px] font-black uppercase tracking-widest transition-all"
                  >
                    {generating ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Wand2 className="w-3 h-3 mr-2" />}
                    Generate Axis
                  </Button>
                </div>
                <Input 
                  value={post.thumbnail || ""} 
                  onChange={e => setPost({...post, thumbnail: e.target.value})} 
                  placeholder="https://..."
                  className="h-12 border-primary/5 bg-muted/20 rounded-xl text-[10px] font-mono font-bold px-4 truncate"
                />
                {post.thumbnail && (
                  <div className="aspect-[16/9] rounded-[2rem] overflow-hidden border-4 border-white dark:border-slate-900 shadow-2xl mt-4 relative group">
                    <img src={post.thumbnail} alt="Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                       <span className="text-[10px] font-black uppercase text-white tracking-[0.3em]">Active Visual Lock</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
