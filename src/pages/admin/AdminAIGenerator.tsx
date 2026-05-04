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
  TrendingUp, Globe2, Clock
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Auto-Blog Controller & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-md overflow-hidden dark:bg-slate-900 border-l-4 border-yellow-500">
           <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/40 rounded-xl text-yellow-600">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-xl">HIGH-CPC DISCOVERY</CardTitle>
                  <CardDescription>Target high-value niches for USA & Canada</CardDescription>
                </div>
              </div>
           </CardHeader>
           <CardContent className="space-y-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-grow min-w-[200px]">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Niche Category</Label>
                   <Select value={discoveryCategory} onValueChange={setDiscoveryCategory}>
                     <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                     <SelectContent>
                       {PREDEFINED_CATEGORIES.map(cat => (
                         <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                </div>
                <div className="w-48">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Region</Label>
                   <Select value={discoveryRegion} onValueChange={setDiscoveryRegion}>
                     <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                     <SelectContent>
                       <SelectItem value="USA & Canada">USA & Canada</SelectItem>
                       <SelectItem value="United States">USA Only</SelectItem>
                       <SelectItem value="Canada">Canada Only</SelectItem>
                     </SelectContent>
                   </Select>
                </div>
                <Button 
                  onClick={handleDiscoverTopics} 
                  disabled={discovering}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold h-10 px-6 mt-auto"
                >
                  {discovering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4 mr-2" />}
                  Discover High-CPC
                </Button>
              </div>

              <div className="space-y-3 pt-4 border-t dark:border-slate-800">
                <AnimatePresence mode="wait">
                  {discoveredTopics.length > 0 ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-2"
                    >
                      {discoveredTopics.map((t, i) => (
                        <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:border-yellow-500/50 transition-all">
                           <div className="flex-grow pr-4">
                             <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{t.title}</h4>
                             <div className="flex items-center gap-4">
                                <span className="text-[10px] font-black text-yellow-600 uppercase tracking-widest">CPC: High Commercial Intent</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">KW: {t.focusKeyword}</span>
                             </div>
                           </div>
                           <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => useTopic(t.title)}
                            className="shrink-0 text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700"
                           >
                             <ArrowRight className="w-4 h-4" />
                           </Button>
                        </div>
                      ))}
                    </motion.div>
                  ) : (
                    <div className="h-48 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed rounded-3xl">
                       <Search className="w-8 h-8 mb-2 opacity-20" />
                       <p className="text-xs font-medium italic">No trending topics discovered yet</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
           </CardContent>
        </Card>

        <Card className="border-none shadow-md overflow-hidden dark:bg-slate-900 border-l-4 border-indigo-600">
           <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl text-indigo-600">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">AUTO BLOG CYCLE</CardTitle>
                    <CardDescription>Automated 5 posts/day for USA & Canada</CardDescription>
                  </div>
                </div>
                <Badge variant={autoConfig?.isEnabled ? "default" : "secondary"} className={autoConfig?.isEnabled ? "bg-green-500" : ""}>
                   {autoConfig?.isEnabled ? "ACTIVE" : "PAUSED"}
                </Badge>
              </div>
           </CardHeader>
           <CardContent className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                 <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border flex flex-col items-center justify-center text-center">
                    <Clock className="w-8 h-8 text-indigo-600 mb-2 opacity-40" />
                    <span className="text-[10px] font-black uppercase text-slate-400 mb-1">Last Cycle Run</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {autoConfig?.lastRun ? new Date(autoConfig.lastRun).toLocaleDateString() : 'Never Run'}
                    </span>
                 </div>
                 <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border flex flex-col items-center justify-center text-center">
                    <Globe2 className="w-8 h-8 text-indigo-600 mb-2 opacity-40" />
                    <span className="text-[10px] font-black uppercase text-slate-400 mb-1">Target Traffic</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">USA & CANADA PEAK</span>
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="flex items-center justify-between p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/20">
                    <div className="flex flex-col">
                       <span className="text-sm font-bold text-indigo-900 dark:text-indigo-400 uppercase tracking-tighter">Daily Auto-Generation</span>
                       <span className="text-[10px] text-indigo-600 font-medium italic">Gemini constructs 5 strategic articles everyday</span>
                    </div>
                    <Switch 
                      checked={autoConfig?.isEnabled || false} 
                      onCheckedChange={async (val) => {
                        await saveAutoBlogConfig({ isEnabled: val });
                        setAutoConfig(prev => prev ? { ...prev, isEnabled: val } : null);
                        toast.success(`Auto Blog Generator ${val ? 'Enabled' : 'Disabled'}`);
                      }}
                    />
                 </div>

                 <Button 
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 font-black uppercase tracking-tight"
                  disabled={processingCycle || !autoConfig?.isEnabled}
                  onClick={handleRunAutoCycle}
                 >
                    {processingCycle ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <Zap className="w-5 h-5 mr-3" />}
                    Trigger Daily Cycle Manually
                 </Button>
              </div>
           </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md overflow-hidden dark:bg-slate-900 border-l-4 border-indigo-600">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl text-indigo-600">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl">AI Mastermind Generator</CardTitle>
              <CardDescription>Advanced SEO multi-post generator with custom Image AI</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-2">
              <Label htmlFor="topic" className="font-bold">Core Topic / Focus Keyword</Label>
              <Input 
                id="topic" 
                placeholder="e.g. Best Student Loans for International Students in USA" 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="h-12 text-lg"
              />
            </div>
            <div className="space-y-3">
              <Label className="font-bold">Target Categories (Select Multiple)</Label>
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100">
                {PREDEFINED_CATEGORIES.map(cat => (
                  <div key={cat} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`cat-${cat}`} 
                      checked={targetCategories.includes(cat)} 
                      onCheckedChange={() => toggleCategory(cat)}
                      className="data-[state=checked]:bg-indigo-600"
                    />
                    <label htmlFor={`cat-${cat}`} className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">{cat}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label htmlFor="numPosts" className="font-bold">Article Count (0-10)</Label>
              <Select value={numPosts} onValueChange={setNumPosts}>
                <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 11 }, (_, i) => i).map(n => (
                    <SelectItem key={n} value={n.toString()}>
                      {n === 0 ? "0 Articles" : n === 1 ? "1 Massive Post" : `${n} Articles`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="country" className="font-bold">GEO Target</Label>
              <Select value={targetCountry} onValueChange={setTargetCountry}>
                <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USA">United States</SelectItem>
                  <SelectItem value="Canada">Canada</SelectItem>
                  <SelectItem value="Both">Both (US & CA)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tone" className="font-bold">Writing Voice</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Professional">Professional</SelectItem>
                  <SelectItem value="Helpful">Conversational</SelectItem>
                  <SelectItem value="Expert">Legal Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 flex flex-col justify-end">
               <div className="flex flex-col gap-2 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="seo-autopilot" className="text-[10px] font-black uppercase flex items-center gap-2 cursor-pointer text-indigo-600">
                      <Search className="w-3 h-3" /> SEO Auto-Pilot
                    </Label>
                    <Switch 
                      id="seo-autopilot" 
                      checked={seoAutoPilot} 
                      onCheckedChange={setSeoAutoPilot} 
                    />
                  </div>
                  <div className="flex items-center justify-between border-t dark:border-slate-700 pt-2">
                    <Label htmlFor="gen-images" className="text-[10px] font-black uppercase flex items-center gap-2 cursor-pointer text-slate-500">
                      <ImageIcon className="w-3 h-3 text-indigo-600" /> Featured Image
                    </Label>
                    <Switch 
                      id="gen-images" 
                      checked={generateImages} 
                      onCheckedChange={setGenerateImages} 
                    />
                  </div>
                  <div className="flex items-center justify-between border-t dark:border-slate-700 pt-2">
                    <Label htmlFor="gen-support-images" className="text-[10px] font-black uppercase flex items-center gap-2 cursor-pointer text-slate-500">
                      <ImageIcon className="w-3 h-3" /> Content Images
                    </Label>
                    <Switch 
                      id="gen-support-images" 
                      checked={generateSupportingImages} 
                      onCheckedChange={setGenerateSupportingImages} 
                    />
                  </div>
               </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
             <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex items-center gap-3">
                   <Switch 
                     id="schedule" 
                     checked={scheduleEnabled} 
                     onCheckedChange={setScheduleEnabled} 
                   />
                   <Label htmlFor="schedule" className="font-bold flex items-center gap-2">
                     <Calendar className="w-4 h-4 text-indigo-600" />
                     Smart Scheduling
                   </Label>
                </div>
                {scheduleEnabled && (
                  <div className="flex items-center gap-3 animate-in fade-in zoom-in duration-300">
                     <Label className="text-xs text-slate-500">Start Date:</Label>
                     <Input 
                       type="date" 
                       value={startDate} 
                       onChange={e => setStartDate(e.target.value)}
                       className="w-40 h-9 text-xs"
                     />
                     <span className="text-[10px] text-slate-400 font-medium italic">
                       Post will be scheduled 1 day apart.
                     </span>
                  </div>
                )}
             </div>
          </div>

          <Button 
            className="w-full h-14 text-xl font-black uppercase tracking-tighter bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none" 
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                Constructing SEO Assets...
              </>
            ) : (
              <>
                <Brain className="w-6 h-6 mr-3" />
                Generate Strategic Content
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedPosts.length > 0 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-between px-2">
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                <Sparkles className="w-7 h-7 text-yellow-500" />
                Output Gallery
              </h2>
              <p className="text-sm text-slate-500">Review generated articles and AI-captured visuals</p>
            </div>
            <Button variant="default" onClick={saveAll} className="bg-indigo-600 hover:bg-indigo-700 h-12 px-8 font-bold">
              <Save className="w-4 h-4 mr-2" />
              Upload All to Database
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {generatedPosts.map((post, i) => (
              <Card key={i} className="flex flex-col border-none shadow-xl hover:translate-y-[-8px] transition-all duration-300 dark:bg-slate-900 overflow-hidden group">
                <div className="relative aspect-video overflow-hidden">
                   <img 
                     src={post.thumbnail} 
                     alt={post.title} 
                     className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                     referrerPolicy="no-referrer"
                   />
                   <div className="absolute top-3 left-3 flex gap-2">
                      <Badge className="bg-white/90 text-indigo-600 border-none font-bold backdrop-blur-sm uppercase text-[9px] tracking-widest">{post.category}</Badge>
                      <Badge className="bg-indigo-600 text-white border-none font-bold shadow-lg uppercase text-[9px] tracking-widest">
                        {post.status === 'scheduled' ? 'Scheduled' : 'Draft'}
                      </Badge>
                   </div>
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <Button size="sm" variant="secondary" className="rounded-full font-bold" onClick={() => openPreview(post)}>
                        <Eye className="w-4 h-4 mr-1.5" /> High-Res Preview
                      </Button>
                   </div>
                </div>
                <CardHeader className="flex-grow">
                   {post.status === 'scheduled' && (
                     <div className="flex items-center gap-1.5 text-[10px] text-indigo-600 font-bold mb-2">
                        <Calendar className="w-3 h-3" />
                        Goes live: {new Date(post.publishDate).toLocaleDateString()}
                     </div>
                   )}
                   <CardTitle className="text-lg leading-tight uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{post.title}</CardTitle>
                   <CardDescription className="line-clamp-2 mt-2 text-xs">{post.meta_description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0 pb-6 border-t border-slate-100 dark:border-slate-800 p-6 mt-auto">
                   <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Focus KW</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase italic tracking-tight">{post.focus_keyword}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => saveToDrafts(post)} className="text-indigo-600 hover:bg-indigo-50 font-bold">
                        <Download className="w-4 h-4 mr-2" /> Save Content
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
