import { useState, useEffect, useDeferredValue, useMemo, memo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, getDocs, setDoc, collection, addDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

      Respond only with JSON containing 'metaTitle', 'metaDescription', and 'focusKeyword' fields.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: GenAIType.OBJECT,
            required: ["metaTitle", "metaDescription", "focusKeyword"],
            properties: {
              metaTitle: { type: GenAIType.STRING },
              metaDescription: { type: GenAIType.STRING },
              focusKeyword: { type: GenAIType.STRING }
            }
          }
        }
      });
      
      const result = JSON.parse(response.text);
      setPost({ 
        ...post, 
        metaTitle: result.metaTitle,
        metaDescription: result.metaDescription,
        focusKeyword: result.focusKeyword
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <Button variant="ghost" onClick={() => navigate('/admin/posts')} className="w-fit text-slate-500 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={generateFullPostWithAI} disabled={loading || generating} className="text-[10px] font-black uppercase tracking-widest text-emerald-600 border-emerald-100 hover:bg-emerald-50 h-9">
              {generating ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5 mr-1.5" />}
              AI Write
            </Button>
            <Button variant="outline" size="sm" onClick={handleHumanize} disabled={loading || humanizing || generating} className="text-[10px] font-black uppercase tracking-widest text-purple-600 border-purple-100 hover:bg-purple-50 h-9">
              {humanizing ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
              Humanize
            </Button>
            <Button size="sm" onClick={handleSave} disabled={loading || generating} className="bg-indigo-600 hover:bg-indigo-700 text-[10px] font-black uppercase tracking-widest h-9 px-6 ml-auto sm:ml-0">
              <Save className="w-3.5 h-3.5 mr-1.5" /> {id ? 'Update' : 'Publish'}
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardContent className="p-0">
               <div className="p-6 pb-0 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Article Title</Label>
                    <Input 
                      value={post.title || ""} 
                      onChange={e => setPost({...post, title: e.target.value})} 
                      placeholder="Mastering Legal Frameworks..."
                      className="text-xl font-black tracking-tight h-14 bg-slate-50/50 border-slate-100 italic"
                    />
                  </div>
               </div>

               <div className={`border-t border-slate-100 ${viewMode === 'split' ? 'md:h-[85vh] h-[750px]' : 'mt-4'}`}>
                 <div className="px-6 border-b border-slate-100 flex flex-wrap items-center justify-between bg-slate-50/50 py-2 md:py-0">
                    <div className="flex items-center h-12 gap-1 overflow-x-auto lg:overflow-visible no-scrollbar">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setViewMode('edit')}
                        className={`text-[10px] uppercase font-black tracking-widest rounded-none h-full border-b-2 transition-all px-4 shrink-0 ${viewMode === 'edit' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                      >
                        Editor
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setViewMode('preview')}
                        className={`text-[10px] uppercase font-black tracking-widest rounded-none h-full border-b-2 transition-all px-4 shrink-0 ${viewMode === 'preview' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                      >
                        Preview
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setViewMode('split')}
                        className={`hidden md:flex text-[10px] uppercase font-black tracking-widest rounded-none h-full border-b-2 transition-all px-4 shrink-0 ${viewMode === 'split' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                      >
                        Split View
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 pb-2 md:pb-0">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-white/50 border border-slate-100 px-2 py-0.5 rounded cursor-help" title="Markdown + HTML Enabled">Advanced Editor</span>
                    </div>
                 </div>

                 {/* Proper Formatting Toolbar */}
                 <div className="px-6 py-2 border-b border-slate-100 bg-white flex flex-wrap items-center gap-1 overflow-x-auto no-scrollbar shadow-sm sticky top-0 z-10">
                   {/* Basic Formatting */}
                   <div className="flex items-center gap-0.5 border-r border-slate-100 pr-2 mr-2 shrink-0">
                      <Button variant="ghost" size="icon" disabled={viewMode === 'preview'} onClick={() => insertFormat('**', '**')} className="h-8 w-8 text-slate-600"><Bold className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" disabled={viewMode === 'preview'} onClick={() => insertFormat('*', '*')} className="h-8 w-8 text-slate-600"><Italic className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" disabled={viewMode === 'preview'} onClick={() => insertFormat('> ')} className="h-8 w-8 text-slate-600"><Quote className="w-4 h-4" /></Button>
                   </div>

                   {/* Headings */}
                   <div className="flex items-center gap-0.5 border-r border-slate-100 pr-2 mr-2 shrink-0">
                      <Button variant="ghost" size="sm" disabled={viewMode === 'preview'} onClick={() => insertFormat('## ')} className="h-8 px-2 text-slate-600 text-[10px] font-black tracking-tighter uppercase"><Heading2 className="w-4 h-4 mr-1" /> H2</Button>
                      <Button variant="ghost" size="sm" disabled={viewMode === 'preview'} onClick={() => insertFormat('### ')} className="h-8 px-2 text-slate-600 text-[10px] font-black tracking-tighter uppercase"><Heading3 className="w-4 h-4 mr-1" /> H3</Button>
                   </div>

                   {/* Lists */}
                   <div className="flex items-center gap-0.5 border-r border-slate-100 pr-2 mr-2 shrink-0">
                      <Button variant="ghost" size="icon" disabled={viewMode === 'preview'} onClick={() => insertFormat('- ')} className="h-8 w-8 text-slate-600"><List className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" disabled={viewMode === 'preview'} onClick={() => insertFormat('1. ')} className="h-8 w-8 text-slate-600"><ListOrdered className="w-4 h-4" /></Button>
                   </div>

                   {/* Alignment */}
                   <div className="flex items-center gap-0.5 border-r border-slate-100 pr-2 mr-2 shrink-0">
                      <Button variant="ghost" size="icon" disabled={viewMode === 'preview'} onClick={() => insertFormat('<div style="text-align: left">\n', '\n</div>')} className="h-8 w-8 text-slate-600"><AlignLeft className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" disabled={viewMode === 'preview'} onClick={() => insertFormat('<div style="text-align: center">\n', '\n</div>')} className="h-8 w-8 text-slate-600"><AlignCenter className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" disabled={viewMode === 'preview'} onClick={() => insertFormat('<div style="text-align: right">\n', '\n</div>')} className="h-8 w-8 text-slate-600"><AlignRight className="w-4 h-4" /></Button>
                   </div>

                   {/* Color Picker */}
                   <div className="flex items-center gap-0.5 border-r border-slate-100 pr-2 mr-2">
                     <DropdownMenu>
                       <DropdownMenuTrigger disabled={viewMode === 'preview'} className="h-8 w-8 text-slate-600 flex items-center justify-center hover:bg-slate-100 rounded-md transition-colors outline-none focus:ring-1 focus:ring-slate-200 disabled:opacity-50 disabled:cursor-not-allowed">
                         <Palette className="w-4 h-4" />
                       </DropdownMenuTrigger>
                       <DropdownMenuContent align="start" className="w-32 bg-white rounded-xl shadow-xl border-slate-100">
                         {[
                           { name: 'Red', hex: '#dc2626' },
                           { name: 'Blue', hex: '#2563eb' },
                           { name: 'Green', hex: '#16a34a' },
                           { name: 'Indigo', hex: '#4f46e5' },
                           { name: 'Amber', hex: '#d97706' },
                           { name: 'Slate', hex: '#475569' },
                         ].map((color) => (
                           <DropdownMenuItem key={color.name} onClick={() => insertFormat(`<span style="color: ${color.hex}">`, '</span>')} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest cursor-pointer">
                             <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color.hex }} /> {color.name}
                           </DropdownMenuItem>
                         ))}
                       </DropdownMenuContent>
                     </DropdownMenu>
                   </div>

                   {/* Size Picker */}
                   <div className="flex items-center gap-0.5">
                     <DropdownMenu>
                       <DropdownMenuTrigger disabled={viewMode === 'preview'} className="h-8 w-8 text-slate-600 flex items-center justify-center hover:bg-slate-100 rounded-md transition-colors outline-none focus:ring-1 focus:ring-slate-200 disabled:opacity-50 disabled:cursor-not-allowed">
                         <Type className="w-4 h-4" />
                       </DropdownMenuTrigger>
                       <DropdownMenuContent align="start" className="w-32 bg-white rounded-xl shadow-xl border-slate-100">
                         {[
                           { label: 'Small', val: '12px' },
                           { label: 'Medium', val: '18px' },
                           { label: 'Large', val: '24px' },
                           { label: 'Extra Large', val: '32px' },
                           { label: 'Giga', val: '48px' },
                         ].map((size) => (
                           <DropdownMenuItem key={size.label} onClick={() => insertFormat(`<span style="font-size: ${size.val}; line-height: 1.2; display: inline-block;">`, '</span>')} className="text-[10px] font-bold uppercase tracking-widest cursor-pointer">
                             {size.label} ({size.val})
                           </DropdownMenuItem>
                         ))}
                       </DropdownMenuContent>
                     </DropdownMenu>
                   </div>
                 </div>
                 
                 <div className={`grid h-full ${viewMode === 'split' ? 'grid-cols-2 divide-x divide-slate-100 overflow-hidden' : 'grid-cols-1'}`}>
                    {(viewMode === 'edit' || viewMode === 'split') && (
                      <div className={`m-0 p-6 bg-white shrink-0 ${viewMode === 'split' ? 'h-full overflow-y-auto' : 'min-h-[600px]'}`}>
                        <Textarea 
                          ref={textareaRef}
                          value={post.content || ""} 
                          onChange={e => setPost({...post, content: e.target.value})} 
                          className="min-h-full border-none focus-visible:ring-0 font-mono text-sm leading-relaxed p-0 resize-none shadow-none bg-transparent"
                          placeholder="Write your institutional insights using Markdown..."
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

        <div className="space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader><CardTitle className="text-sm">Post Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={post.slug || ""} onChange={e => setPost({...post, slug: e.target.value})} placeholder="url-friendly-slug" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={post.category || ""} onValueChange={val => setPost({...post, category: val})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Loans">Loans</SelectItem>
                    <SelectItem value="Insurance">Insurance</SelectItem>
                    <SelectItem value="Scholarships">Scholarships</SelectItem>
                    <SelectItem value="Credit-Cards">Credit Cards</SelectItem>
                    <SelectItem value="Travel">Travel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={post.status || ""} onValueChange={val => setPost({...post, status: val})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {post.status === 'scheduled' && (
                <div className="space-y-2 p-4 bg-blue-50 rounded-xl border border-blue-100 animate-in slide-in-from-top-2 duration-300">
                  <Label className="text-primary font-bold">Schedule Publication</Label>
                  <Input 
                    type="datetime-local" 
                    value={post.publishDate ? post.publishDate.substring(0, 16) : ''} 
                    onChange={e => setPost({...post, publishDate: new Date(e.target.value).toISOString()})}
                    className="bg-white border-blue-200"
                  />
                  <p className="text-[10px] text-primary/60 font-medium italic">Post will automatically go live at this time.</p>
                </div>
              )}
              <div className="space-y-2">
                <Label>Thumbnail URL</Label>
                <Input value={post.thumbnail || ""} onChange={e => setPost({...post, thumbnail: e.target.value})} placeholder="https://..." />
              </div>
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

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Content Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Focus Keyword</Label>
                <div className="flex gap-2">
                  <Input 
                    value={post.focusKeyword || ""} 
                    onChange={e => setPost({...post, focusKeyword: e.target.value})} 
                    placeholder="e.g. personal loan usa"
                    className="h-10 bg-slate-50/50 border-slate-100 text-[11px] font-medium"
                  />
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={handleGetSuggestions} 
                    disabled={suggesting}
                    className="h-10 w-10 shrink-0 border-slate-100 text-indigo-600 hover:bg-indigo-50"
                  >
                    {suggesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Lightbulb className="w-3 h-3" />}
                  </Button>
                </div>

                {suggestions.length > 0 && (
                  <div className="pt-2 animate-in slide-in-from-top-2 duration-300">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">AI Topic Ideas</span>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestions.map((s, i) => (
                        <button 
                          key={i} 
                          onClick={() => setPost({...post, content: post.content + `\n\n## Related Topic: ${s}\n`})}
                          className="px-2 py-1 bg-white border border-slate-100 rounded-lg text-[9px] font-medium text-slate-600 hover:border-indigo-200 hover:text-indigo-600 transition-all flex items-center gap-1"
                        >
                          <Plus className="w-2 h-2" /> {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Meta Title</Label>
                <Input 
                  value={post.metaTitle || ""} 
                  onChange={e => setPost({...post, metaTitle: e.target.value})} 
                  placeholder="SEO Optimized Title"
                  className="h-10 bg-slate-50/50 border-slate-100 text-[11px] font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Meta Description</Label>
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] font-bold ${post.metaDescription?.length > 160 ? 'text-rose-500' : 'text-slate-400'}`}>
                    {post.metaDescription?.length || 0} / 160
                  </span>
                </div>
                <Textarea 
                  value={post.metaDescription || ""} 
                  onChange={e => setPost({...post, metaDescription: e.target.value})} 
                  placeholder="Brief summary for search results..."
                  className={`min-h-20 bg-slate-50/50 border-slate-100 text-[11px] font-medium resize-none ${post.metaDescription?.length > 160 ? 'border-rose-200' : ''}`}
                />
                <p className="text-[9px] text-slate-400 italic">Target: 155-160 characters for maximum search visibility.</p>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Meta Keywords</Label>
                <Input 
                  value={post.metaKeywords || ""} 
                  onChange={e => setPost({...post, metaKeywords: e.target.value})} 
                  placeholder="legal, finance, usa loans"
                  className="h-10 bg-slate-50/50 border-slate-100 text-[11px] font-medium"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Featured Image URL</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={async () => {
                      if (!post.title) {
                        toast.error("Please add a title first to generate an image.");
                        return;
                      }
                      setGenerating(true);
                      try {
                        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
                        const prompt = `Suggest a professional, high-quality Unsplash image URL for a blog post about: "${post.title}". 
                        Return only a valid Unsplash URL from their source API format like: https://images.unsplash.com/photo-[id]?q=80&w=1200&auto=format&fit=crop`;
                        
                        const response = await ai.models.generateContent({
                          model: "gemini-3-flash-preview",
                          contents: prompt
                        });
                        
                        // Extract URL from response
                        const urlMatch = response.text.match(/https:\/\/images\.unsplash\.com\/photo-[^?\s"']+/);
                        if (urlMatch) {
                          setPost({ ...post, thumbnail: urlMatch[0] + "?q=80&w=1200&auto=format&fit=crop" });
                          toast.success("AI Featured Image suggested!");
                        } else {
                          // Fallback to a nice legal/finance image
                          setPost({ ...post, thumbnail: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=1200&auto=format&fit=crop' });
                          toast.info("Used a professional legal-themed fallback image.");
                        }
                      } catch (error: any) {
                        console.error("Featured image failed", error);
                        if (error.message?.includes('429') || error.message?.includes('quota')) {
                          toast.error("🚀 AI Quota Exceeded! Using fallback image.");
                          setPost({ ...post, thumbnail: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=1200&auto=format&fit=crop' });
                        } else {
                          toast.error("Failed to generate image idea.");
                        }
                      } finally {
                        setGenerating(false);
                      }
                    }}
                    disabled={generating}
                    className="h-6 px-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 text-[9px] font-black uppercase tracking-widest"
                  >
                    {generating ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                    AI Suggest Image
                  </Button>
                </div>
                <Input 
                  value={post.thumbnail || ""} 
                  onChange={e => setPost({...post, thumbnail: e.target.value})} 
                  placeholder="https://images.unsplash.com/..."
                  className="h-10 bg-slate-50/50 border-slate-100 text-[11px] font-medium"
                />
                {post.thumbnail && (
                  <div className="aspect-video rounded-xl overflow-hidden border border-slate-100 mt-2">
                    <img src={post.thumbnail} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tags (comma separated)</Label>
                <Input 
                  value={post.tags || ""} 
                  onChange={e => setPost({...post, tags: e.target.value})} 
                  placeholder="finance, legal, tips"
                  className="h-10 bg-slate-50/50 border-slate-100 text-[11px] font-medium"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
