import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Sparkles, Brain, Loader2, Download, Save, Image as ImageIcon, 
  Calendar, Search, Eye, Maximize2, Lightbulb, Zap, ArrowRight,
  TrendingUp, Globe, Clock, Layers
} from 'lucide-react';
import { toast } from 'sonner';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { GoogleGenAI, Type } from "@google/genai";
import { Badge } from '@/components/ui/badge';
import { discoverHighCPCTopics, generateAutoContent, AutoBlogConfig, getAutoBlogConfig, saveAutoBlogConfig, processAutoBlogCycle } from '@/services/autoBlogService';
import { motion, AnimatePresence } from 'motion/react';

const PREDEFINED_CATEGORIES = ["Loans", "Insurance", "Scholarships", "Credit Cards", "Travel", "Legal"];

export default function AdminAIGenerator() {
  const [topic, setTopic] = useState('');
  const [numPosts, setNumPosts] = useState('3');
  const [targetCategories, setTargetCategories] = useState<string[]>(['Loans']);
  const [targetCountry, setTargetCountry] = useState('USA');
  const [tone, setTone] = useState('Professional');
  const [generateImages, setGenerateImages] = useState(true);
  const [generateSupportingImages, setGenerateSupportingImages] = useState(true);
  const [seoAutoPilot, setSeoAutoPilot] = useState(true);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().substring(0, 10));
  const [loading, setLoading] = useState(false);
  const [generatedPosts, setGeneratedPosts] = useState<any[]>([]);
  const [previewPost, setPreviewPost] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Topical Discovery State
  const [discoveredTopics, setDiscoveredTopics] = useState<any[]>([]);
  const [discovering, setDiscovering] = useState(false);
  const [discoveryCategory, setDiscoveryCategory] = useState('Loans');
  const [discoveryRegion, setDiscoveryRegion] = useState('USA & Canada');

  const [autoConfig, setAutoConfig] = useState<AutoBlogConfig>({
    isEnabled: false,
    lastRun: null,
    generationCountPerDay: 5,
    targetRegion: "USA & Canada",
    categories: ["Loans", "Insurance", "Education", "Law"],
    publishDirectly: true
  });
  const [processingCycle, setProcessingCycle] = useState(false);

  useEffect(() => {
    getAutoBlogConfig().then(config => setAutoConfig(prev => ({ ...prev, ...config })));
  }, []);

  const handleDiscoverTopics = async () => {
    setDiscovering(true);
    setDiscoveredTopics([]);
    try {
      const topics = await discoverHighCPCTopics(discoveryCategory, discoveryRegion);
      setDiscoveredTopics(topics);
      toast.success(`Discovered ${topics.length} high-CPC topics!`);
    } catch (err) {
      toast.error("Failed to discover topics");
    } finally {
      setDiscovering(false);
    }
  };

  const handleRunAutoCycle = async () => {
    setProcessingCycle(true);
    try {
      const result = await processAutoBlogCycle(auth.currentUser?.uid || 'admin', auth.currentUser?.displayName || 'Admin');
      if (result.success) {
        toast.success(`Successfully generated and published/scheduled ${result.count} posts!`);
      } else {
        toast.info(result.message);
      }
    } catch (err: any) {
      toast.error("Auto-cycle failed: " + err.message);
    } finally {
      setProcessingCycle(false);
    }
  };

  const useTopic = (t: string) => {
    setTopic(t);
    // Scroll to generator
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleCategory = (cat: string) => {
    setTargetCategories(prev => 
      prev.includes(cat) 
        ? prev.filter(c => c !== cat) 
        : [...prev, cat]
    );
  };

  const handleGenerate = async () => {
    if (!topic) {
      toast.error("Please enter a topic");
      return;
    }
    if (targetCategories.length === 0) {
      toast.error("Please select at least one category");
      return;
    }
    if (numPosts === '0') {
      toast.error("Article count must be at least 1");
      return;
    }

    setLoading(true);
    setGeneratedPosts([]);

    try {
      const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const textModel = 'gemini-3-flash-preview';

      const prompt = `You are an elite financial + legal SEO content strategist for E Legal Advisor.
      Generate ${numPosts} MASTERPIECE SEO-optimized blog articles based on this topic:
      TOPIC: ${topic}
      CATEGORIES: ${targetCategories.join(', ')}
      TARGET COUNTRY: ${targetCountry}
      TONE: ${tone}
      SEO OPTIMIZATION: ${seoAutoPilot ? 'MAXIMUM (Semantic silo architecture, LSI clusters, ultra-high CPC keyword focus)' : 'Standard'}

      Requirements for EACH article:
      - 2000+ words of high-utility, institutional-grade authority content.
      - **CRITICAL**: Focus strictly on ULTRA-HIGH CPC sub-niches (e.g., Insurance litigation, mesothelioma law, high-value commercial loans, specialized medical insurance).
      - Strategic Ad Placement: Insert exactly 3 Google Adsense placeholders [GOOGLE_AD_SLOT] inside the article_html (one after the intro, one in the middle, and one before the conclusion).
      - Assign each post to ONLY ONE of the selected categories: ${targetCategories.join(', ')}.
      - ${seoAutoPilot ? 'Strict semantic hierarchy (H1 -> H2 -> H3)' : ''}
      - ${seoAutoPilot ? 'Include a "Key Takeaways" section at the start' : ''}
      - Include 2 specific placeholders inside the article_html where supporting images should go: [SUPPORTING_IMAGE_0] and [SUPPORTING_IMAGE_1].
      - Return output in JSON format (array of objects).
      
      Each JSON object MUST have: 
      - title: A click-magnet search-intent Title
      - slug: URL-friendly search-optimized slug
      - category: The specific category assigned to this post
      - meta_title: 50-60 character SEO title
      - meta_description: 155-160 character meta description
      - focus_keyword: The core SEO keyword (High CPC target)
      - article_html: Comprehensive HTML content with semantic markup and Ad placements
      - image_prompt: High-detail image prompt for Featured Image
      - supporting_image_prompts: Array of 2 prompts for content images

      Writing style: Institutional authority, professional, ${tone}.
      Return ONLY JSON.`;

      const textResponse = await genAI.models.generateContent({
        model: textModel,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                slug: { type: Type.STRING },
                category: { type: Type.STRING },
                meta_title: { type: Type.STRING },
                meta_description: { type: Type.STRING },
                focus_keyword: { type: Type.STRING },
                article_html: { type: Type.STRING },
                image_prompt: { type: Type.STRING },
                supporting_image_prompts: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["title", "slug", "category", "article_html", "image_prompt", "supporting_image_prompts"]
            }
          }
        }
      });

      const posts = JSON.parse(textResponse.text);
      
      // Image Generation Step
      const postsWithImages = [];
      const imageModel = 'gemini-2.5-flash-image';
      let hasImageQuota = true;

      for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        let thumbnailUrl = "";
        let finalHtml = post.article_html;

        // 1. Generate Featured Image
        if (generateImages && hasImageQuota) {
          try {
            toast.info(`Generating featured image for: ${post.title}...`);
            const imageResponse = await genAI.models.generateContent({
              model: imageModel,
              contents: { parts: [{ text: `A professional featured image for a blog post titled "${post.title}". Topic: ${post.image_prompt}. Business style, 4k, cinematic.` }] },
              config: { imageConfig: { aspectRatio: "16:9" } }
            });

            for (const part of imageResponse.candidates[0].content.parts) {
              if (part.inlineData) {
                thumbnailUrl = `data:image/png;base64,${part.inlineData.data}`;
                break;
              }
            }
          } catch (imgError: any) {
            console.warn("Featured image skipped - falling back to placeholder", imgError);
            if (imgError.message?.includes('429') || imgError.message?.includes('RESOURCE_EXHAUSTED')) {
              hasImageQuota = false;
              toast.error("Image quota reached. Using high-quality placeholders for remaining posts.");
            }
            thumbnailUrl = `https://picsum.photos/seed/${post.slug}-feature/800/450`;
          }
        } else {
          thumbnailUrl = `https://picsum.photos/seed/${post.slug}-feature/800/450`;
        }

        // 2. Generate Supporting Images
        if (generateSupportingImages && post.supporting_image_prompts) {
          for (let j = 0; j < post.supporting_image_prompts.length; j++) {
            let supportImgUrl = "";
            if (hasImageQuota) {
              try {
                toast.info(`Generating content image ${j+1} for: ${post.title}...`);
                const supportImgResponse = await genAI.models.generateContent({
                  model: imageModel,
                  contents: { parts: [{ text: `A high-quality supporting blog image showing: ${post.supporting_image_prompts[j]}. Professional finance/legal context.` }] },
                  config: { imageConfig: { aspectRatio: "3:2" } }
                });

                for (const part of supportImgResponse.candidates[0].content.parts) {
                  if (part.inlineData) {
                    supportImgUrl = `data:image/png;base64,${part.inlineData.data}`;
                    break;
                  }
                }
              } catch (imgError: any) {
                if (imgError.message?.includes('429') || imgError.message?.includes('RESOURCE_EXHAUSTED')) {
                  hasImageQuota = false;
                }
                supportImgUrl = `https://picsum.photos/seed/${post.slug}-support-${j}/600/400`;
              }
            } else {
              supportImgUrl = `https://picsum.photos/seed/${post.slug}-support-${j}/600/400`;
            }

            const imgTag = `<figure class="my-8"><img src="${supportImgUrl}" class="w-full rounded-xl shadow-lg" alt="${post.supporting_image_prompts[j]}" referrerPolicy="no-referrer" /><figcaption class="text-center text-xs text-gray-500 mt-2">${post.supporting_image_prompts[j]}</figcaption></figure>`;
            finalHtml = finalHtml.replace(`[SUPPORTING_IMAGE_${j}]`, imgTag);
          }
        }

        // Clean up and format ad placeholders for preview
        const adPlaceholder = `<div class="my-8 py-12 bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center px-4">
          <span class="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Advertisement Slot</span>
          <p class="text-xs text-slate-500 font-medium tracking-tight">Google AdSense / Ezoic / Mediavine Block High CPC Optimized</p>
        </div>`;
        finalHtml = finalHtml.replace(/\[GOOGLE_AD_SLOT\]/g, adPlaceholder);

        // Clean up any remaining placeholders
        finalHtml = finalHtml.replace(/\[SUPPORTING_IMAGE_\d+\]/g, "");

        // Calculate schedule date
        let postPublishDate = new Date().toISOString();
        let status = 'draft';

        if (scheduleEnabled) {
          const baseDate = new Date(startDate);
          baseDate.setDate(baseDate.getDate() + i);
          postPublishDate = baseDate.toISOString();
          status = 'scheduled';
        }

        postsWithImages.push({
          ...post,
          article_html: finalHtml,
          thumbnail: thumbnailUrl,
          status: status,
          publishDate: postPublishDate,
          createdAt: new Date().toISOString()
        });
      }

      setGeneratedPosts(postsWithImages);
      toast.success(`Generated ${postsWithImages.length} articles with custom images!`);
    } catch (error: any) {
      console.error("Generation error:", error);
      toast.error("Failed to generate content: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveToDrafts = async (post: any) => {
    try {
      await addDoc(collection(db, 'posts'), {
        ...post,
        content: post.article_html,
        contentHtml: post.article_html,
        featuredImage: post.thumbnail,
        authorId: auth.currentUser?.uid,
        authorName: auth.currentUser?.displayName || 'Admin',
        updatedAt: new Date().toISOString()
      });
      toast.success(`"${post.title}" saved successfully!`);
    } catch (error: any) {
      toast.error("Failed to save: " + error.message);
    }
  };

  const saveAll = async () => {
    const promises = generatedPosts.map(post => saveToDrafts(post));
    await Promise.all(promises);
    toast.success("All articles saved to posts library!");
    setGeneratedPosts([]);
  };

  const openPreview = (post: any) => {
    setPreviewPost(post);
    setIsPreviewOpen(true);
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-primary/10 transition-colors">
        <div>
          <Badge className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-none px-4 py-1.5 rounded-full uppercase text-[10px] tracking-[0.3em] font-black mb-4 block w-fit">
            AI Content Factory
          </Badge>
          <h1 className="text-4xl font-heading text-secondary dark:text-white leading-tight">Mastermind Generator</h1>
          <p className="text-secondary/60 dark:text-muted-foreground text-xs font-bold uppercase tracking-widest mt-2 italic flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-indigo-600" /> Strategic SEO Content Construction Engine
          </p>
        </div>
        <div className="flex items-center gap-3">
           <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[9px] font-black uppercase tracking-widest text-green-700 dark:text-green-400">Gemini LLM Online</span>
           </div>
        </div>
      </div>

      {/* Discovery & Auto-Blog Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border border-primary/10 shadow-none rounded-[3rem] overflow-hidden bg-white dark:bg-slate-900 transition-colors">
           <CardHeader className="p-8 pb-4">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl text-yellow-600">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-heading dark:text-white">Topic Discovery</CardTitle>
                  <CardDescription className="text-[10px] uppercase font-black tracking-widest opacity-50">High-CPC Market Intelligence</CardDescription>
                </div>
              </div>
           </CardHeader>
           <CardContent className="p-8 pt-4 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                     <Layers className="w-3 h-3" /> Target Niche
                   </Label>
                   <Select value={discoveryCategory} onValueChange={setDiscoveryCategory}>
                     <SelectTrigger className="h-12 bg-muted/30 border-primary/5 rounded-xl"><SelectValue /></SelectTrigger>
                     <SelectContent>
                       {PREDEFINED_CATEGORIES.map(cat => (
                         <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                     <Globe className="w-3 h-3" /> GEO Focus
                   </Label>
                   <Select value={discoveryRegion} onValueChange={setDiscoveryRegion}>
                     <SelectTrigger className="h-12 bg-muted/30 border-primary/5 rounded-xl"><SelectValue /></SelectTrigger>
                     <SelectContent>
                       <SelectItem value="USA & Canada">USA & Canada</SelectItem>
                       <SelectItem value="United States">USA Only</SelectItem>
                       <SelectItem value="Canada">Canada Only</SelectItem>
                     </SelectContent>
                   </Select>
                </div>
              </div>
              
              <Button 
                onClick={handleDiscoverTopics} 
                disabled={discovering}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-black h-12 rounded-xl transition-all shadow-lg shadow-yellow-100 dark:shadow-none uppercase tracking-widest text-xs"
              >
                {discovering ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lightbulb className="w-5 h-5 mr-3" />}
                Initiate Market Research
              </Button>

              <div className="pt-6 border-t border-primary/5">
                <AnimatePresence mode="wait">
                  {discoveredTopics.length > 0 ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      {discoveredTopics.map((t, i) => (
                        <div key={i} className="p-5 bg-muted/20 dark:bg-slate-800/50 rounded-2xl border border-primary/5 flex items-center justify-between group hover:border-yellow-500/30 transition-all">
                           <div className="flex-grow pr-4">
                             <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1 uppercase tracking-tight">{t.title}</h4>
                             <div className="flex items-center gap-4">
                                <Badge variant="outline" className="text-[8px] font-black text-yellow-600 bg-yellow-50 border-none uppercase tracking-widest">High Commercial Intent</Badge>
                                <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">KW: {t.focusKeyword}</span>
                             </div>
                           </div>
                           <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => useTopic(t.title)}
                            className="shrink-0 h-10 w-10 rounded-xl text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700 transition-colors"
                           >
                             <ArrowRight className="w-4 h-4" />
                           </Button>
                        </div>
                      ))}
                    </motion.div>
                  ) : (
                    <div className="h-48 flex flex-col items-center justify-center text-muted-foreground/30 border-2 border-dashed border-primary/5 rounded-[2rem]">
                       <Search className="w-10 h-10 mb-4 opacity-20" />
                       <p className="text-[10px] font-black uppercase tracking-[0.3em]">Zero Insights Detected</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
           </CardContent>
        </Card>

        {/* Auto Pilot Control */}
        <Card className="border border-primary/10 shadow-none rounded-[3rem] overflow-hidden bg-white dark:bg-slate-900 transition-colors">
           <CardHeader className="p-8 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl text-indigo-600">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-heading dark:text-white">Auto-Pilot Mode</CardTitle>
                    <CardDescription className="text-[10px] uppercase font-black tracking-widest opacity-50">Continuous content flow</CardDescription>
                  </div>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase ${
                  autoConfig?.isEnabled ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                }`}>
                   {autoConfig?.isEnabled ? "System Armed" : "Ready to launch"}
                </div>
              </div>
           </CardHeader>
           <CardContent className="p-8 pt-4 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                 <div className="p-6 bg-muted/20 dark:bg-slate-800/50 rounded-[2rem] border border-primary/5 flex flex-col items-start">
                    <Clock className="w-6 h-6 text-indigo-400 mb-4" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Temporal Sync</span>
                    <span className="text-xs font-bold dark:text-white">
                      {autoConfig?.lastRun ? `Last Run: ${new Date(autoConfig.lastRun).toLocaleDateString()}` : 'Never Executed'}
                    </span>
                 </div>
                 <div className="p-6 bg-muted/20 dark:bg-slate-800/50 rounded-[2rem] border border-primary/5 flex flex-col items-start">
                    <Globe className="w-6 h-6 text-indigo-400 mb-4" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Active Reach</span>
                    <span className="text-xs font-bold dark:text-white">USA & CANADA PEAK</span>
                 </div>
              </div>

              <div className="space-y-6">
                 <div className="flex items-center justify-between p-6 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20">
                    <div className="flex flex-col">
                       <span className="text-sm font-black uppercase tracking-tight text-indigo-900 dark:text-indigo-400">Autonomous Cycle</span>
                       <span className="text-[10px] font-medium text-indigo-600/60 mt-1">Institutional-grade articles generated daily</span>
                    </div>
                    <Switch 
                      checked={autoConfig?.isEnabled || false} 
                      onCheckedChange={async (val) => {
                        await saveAutoBlogConfig({ isEnabled: val });
                        setAutoConfig(prev => prev ? { ...prev, isEnabled: val } : null);
                        toast.success(`Auto-Pilot ${val ? 'Activated' : 'Deactivated'}`);
                      }}
                      className="data-[state=checked]:bg-indigo-600"
                    />
                 </div>

                 <Button 
                  className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-xl shadow-indigo-100 dark:shadow-none"
                  disabled={processingCycle || !autoConfig?.isEnabled}
                  onClick={handleRunAutoCycle}
                 >
                    {processingCycle ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <Zap className="w-5 h-5 mr-3" />}
                    Manual Cycle Override
                 </Button>
              </div>
           </CardContent>
        </Card>
      </div>

      {/* Main Generator Interface */}
      <Card className="border border-primary/10 shadow-none rounded-[3rem] overflow-hidden bg-white dark:bg-slate-900 transition-colors">
        <CardHeader className="p-8 pb-4">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl text-indigo-600">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-heading dark:text-white">Asset Generator</CardTitle>
              <CardDescription className="text-[10px] uppercase font-black tracking-widest opacity-50">Construct bespoke SEO blog assets</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 pt-4 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-2">
              <Label htmlFor="topic" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-2">
                <Search className="w-3 h-3" /> Core Intent / Focus Keyword
              </Label>
              <Input 
                id="topic" 
                placeholder="e.g. Strategic Loans for High-Growth Startups 2026..." 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="h-14 text-lg bg-muted/20 border-primary/5 rounded-2xl focus:ring-indigo-600"
              />
            </div>
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Layers className="w-3 h-3" /> Taxonomy Segments
              </Label>
              <div className="grid grid-cols-2 gap-3 p-5 bg-muted/20 dark:bg-slate-800 rounded-[2rem] border border-primary/5">
                {PREDEFINED_CATEGORIES.map(cat => (
                  <div key={cat} className="flex items-center space-x-3">
                    <Checkbox 
                      id={`cat-${cat}`} 
                      checked={targetCategories.includes(cat)} 
                      onCheckedChange={() => toggleCategory(cat)}
                      className="rounded-md h-5 w-5 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                    />
                    <label htmlFor={`cat-${cat}`} className="text-[10px] font-black uppercase tracking-tight text-muted-foreground cursor-pointer group-hover:text-foreground">{cat}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-2">
              <Label htmlFor="numPosts" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-2">
                 Asset Volume
              </Label>
              <Select value={numPosts} onValueChange={setNumPosts}>
                <SelectTrigger className="h-12 bg-muted/20 border-primary/5 rounded-2xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 11 }, (_, i) => i).map(n => (
                    <SelectItem key={n} value={n.toString()}>
                      {n === 0 ? "0 Assets" : n === 1 ? "1 Strategic Post" : `${n} Strategic Assets`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="country" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-2">
                 GEO Target
              </Label>
              <Select value={targetCountry} onValueChange={setTargetCountry}>
                <SelectTrigger className="h-12 bg-muted/20 border-primary/5 rounded-2xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USA">United States</SelectItem>
                  <SelectItem value="Canada">Canada</SelectItem>
                  <SelectItem value="Both">Strategic Both (US & CA)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tone" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-2">
                 Linguistic Tone
              </Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="h-12 bg-muted/20 border-primary/5 rounded-2xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Professional">Professional Authority</SelectItem>
                  <SelectItem value="Helpful">Empathetic Advisor</SelectItem>
                  <SelectItem value="Expert">Legal Strategist</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 flex flex-col justify-end">
               <div className="flex flex-col gap-3 p-5 bg-muted/20 dark:bg-slate-800 rounded-[2rem] border border-primary/5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="seo-autopilot" className="text-[9px] font-black uppercase tracking-widest cursor-pointer text-indigo-600 flex items-center gap-2">
                      <Search className="w-3 h-3" /> SEO Intelligence
                    </Label>
                    <Switch id="seo-autopilot" checked={seoAutoPilot} onCheckedChange={setSeoAutoPilot} className="data-[state=checked]:bg-indigo-600" />
                  </div>
                  <div className="flex items-center justify-between border-t border-primary/5 pt-3">
                    <Label htmlFor="gen-images" className="text-[9px] font-black uppercase tracking-widest cursor-pointer text-muted-foreground flex items-center gap-2">
                      <ImageIcon className="w-3 h-3" /> AI Visuals
                    </Label>
                    <Switch id="gen-images" checked={generateImages} onCheckedChange={setGenerateImages} className="data-[state=checked]:bg-indigo-600" />
                  </div>
               </div>
            </div>
          </div>

          <div className="p-8 bg-muted/20 dark:bg-slate-800/50 rounded-[2.5rem] border border-dashed border-primary/10">
             <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex items-center gap-4">
                   <Switch 
                     id="schedule" 
                     checked={scheduleEnabled} 
                     onCheckedChange={setScheduleEnabled} 
                     className="data-[state=checked]:bg-indigo-600"
                   />
                   <Label htmlFor="schedule" className="font-black uppercase tracking-widest text-[10px] flex items-center gap-2 cursor-pointer">
                     <Calendar className="w-4 h-4 text-indigo-600" />
                     Temporal Scheduling
                   </Label>
                </div>
                {scheduleEnabled && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-wrap items-center gap-4"
                  >
                     <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Commencement:</Label>
                     <Input 
                       type="date" 
                       value={startDate} 
                       onChange={e => setStartDate(e.target.value)}
                       className="w-44 h-11 bg-white dark:bg-slate-900 border-primary/5 rounded-xl text-xs font-bold"
                     />
                     <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-40">
                       / Iteration: 24h intervals
                     </span>
                  </motion.div>
                )}
             </div>
          </div>

          <Button 
            className="w-full h-16 text-xs font-black uppercase tracking-[0.3em] bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl transition-all shadow-2xl shadow-indigo-100 dark:shadow-none" 
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 mr-4 animate-spin" />
                Constructing Strategic Assets...
              </>
            ) : (
              <>
                <Brain className="w-6 h-6 mr-4" />
                Initialize Asset Construction
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedPosts.length > 0 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-top-6 duration-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-4">
            <div>
              <Badge className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 border-none px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-2">System Output</Badge>
              <h2 className="text-3xl font-heading dark:text-white flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-yellow-500" />
                Asset Gallery
              </h2>
            </div>
            <Button onClick={saveAll} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black h-12 px-10 rounded-2xl shadow-xl shadow-indigo-100 dark:shadow-none uppercase text-xs tracking-widest">
              <Save className="w-4 h-4 mr-3" /> Commit All to Vault
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {generatedPosts.map((post, i) => (
              <Card key={i} className="flex flex-col border border-primary/5 shadow-none hover:bg-muted/5 transition-all duration-500 dark:bg-slate-900 rounded-[2.5rem] overflow-hidden group">
                <div className="relative aspect-video overflow-hidden">
                   <img 
                     src={post.thumbnail} 
                     alt={post.title} 
                     className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" 
                     referrerPolicy="no-referrer"
                   />
                   <div className="absolute top-4 left-4 flex gap-2">
                      <Badge className="bg-white/90 dark:bg-slate-900/90 text-[8px] font-black uppercase tracking-widest text-indigo-600 border-none backdrop-blur-md px-3">{post.category}</Badge>
                      <Badge className="bg-indigo-600 text-white border-none font-black text-[8px] uppercase tracking-widest px-3">
                        {post.status === 'scheduled' ? 'Queued' : 'Staging'}
                      </Badge>
                   </div>
                   <div className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                      <Button onClick={() => openPreview(post)} className="bg-white text-indigo-600 hover:bg-white/90 font-black rounded-full px-6 h-10 shadow-2xl uppercase text-[10px] tracking-widest">
                        <Maximize2 className="w-4 h-4 mr-2" /> Inspect Asset
                      </Button>
                   </div>
                </div>
                <CardHeader className="p-8 flex-grow">
                   {post.status === 'scheduled' && (
                     <div className="flex items-center gap-2 text-[9px] text-indigo-600 font-black uppercase tracking-widest mb-4">
                        <Calendar className="w-3 h-3" />
                        Live Logic: {new Date(post.publishDate).toLocaleDateString()}
                     </div>
                   )}
                   <CardTitle className="text-xl font-heading leading-tight dark:text-white uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{post.title}</CardTitle>
                   <CardDescription className="line-clamp-2 mt-4 text-[10px] font-medium leading-relaxed uppercase tracking-widest opacity-60">{post.meta_description}</CardDescription>
                </CardHeader>
                <CardContent className="px-8 pb-8 pt-0 mt-auto">
                   <div className="pt-6 border-t border-primary/5 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-40">Core Semantic KW</span>
                        <span className="text-[10px] font-black text-secondary dark:text-indigo-400 uppercase tracking-tight">{post.focus_keyword}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => saveToDrafts(post)} className="h-10 px-4 rounded-xl text-indigo-600 hover:bg-indigo-50 font-black uppercase text-[10px] tracking-widest">
                        <Download className="w-4 h-4 mr-2" /> Archive
                      </Button>
                   </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Real-like High Fidelity Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 overflow-hidden bg-white dark:bg-slate-950 border-none rounded-3xl">
          <div className="h-full overflow-y-auto">
            <div className="p-0">
              {previewPost && (
                <div className="animate-in fade-in duration-500">
                  {/* Fake Navigation Bar Overlay */}
                  <div className="sticky top-0 w-full z-10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b flex items-center justify-between px-6 h-14">
                    <div className="flex items-center gap-2">
                       <span className="font-black text-sm tracking-tighter uppercase">E Legal Advisor Preview</span>
                       <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Simulated View</Badge>
                    </div>
                    <Button variant="ghost" size="sm" className="font-bold text-xs" onClick={() => setIsPreviewOpen(false)}>Close Interface</Button>
                  </div>

                  <article className="pt-12 pb-24">
                    <div className="max-w-4xl mx-auto px-6">
                      <header className="mb-12">
                        <Badge className="bg-indigo-600 mb-6 px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em]">{previewPost.category}</Badge>
                        <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white leading-[0.9] mb-8 tracking-tighter">
                          {previewPost.title}
                        </h1>
                        
                        <div className="flex flex-wrap items-center justify-between gap-6 py-6 border-y border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden">
                                <img src={`https://picsum.photos/seed/legal/100`} className="w-full h-full object-cover" />
                              </div>
                              <div className="text-xs">
                                <p className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-[9px]">Legal Advisor Team</p>
                                <p className="text-slate-500 italic text-[10px]">Institutional Strategy Expert</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
                              <span>{new Date().toLocaleDateString()}</span>
                              <span>8 Min Read</span>
                            </div>
                          </div>
                        </div>
                      </header>

                      {/* Featured Image Overlay */}
                      <div className="relative mb-16 rounded-[40px] overflow-hidden shadow-2xl aspect-[21/9]">
                         <img 
                           src={previewPost.thumbnail} 
                           alt={previewPost.title} 
                           className="w-full h-full object-cover"
                           referrerPolicy="no-referrer"
                         />
                      </div>

                      {/* Article Content Styles matching BlogPost.tsx */}
                      <div 
                        className="font-serif text-xl sm:text-2xl text-slate-800 dark:text-slate-200 leading-relaxed prose prose-slate dark:prose-invert lg:prose-xl max-w-none prose-indigo prose-headings:font-black prose-headings:tracking-tighter prose-p:mb-8 prose-img:rounded-[32px] first-letter:text-7xl first-letter:font-black first-letter:mr-3 first-letter:float-left first-letter:mt-3 first-letter:text-indigo-600"
                        dangerouslySetInnerHTML={{ __html: previewPost.article_html }}
                      />

                      <div className="mt-16 p-8 bg-indigo-50 dark:bg-indigo-900/10 rounded-3xl border border-indigo-100 dark:border-indigo-900/20 text-center">
                         <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-400 mb-4 uppercase tracking-widest">End of Simulation</h3>
                         <Button className="bg-indigo-600 font-bold" onClick={() => saveToDrafts(previewPost)}>Save This Article To Database</Button>
                      </div>
                    </div>
                  </article>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
