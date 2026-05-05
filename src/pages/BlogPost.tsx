import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, limit, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PostCard from '@/components/blog/PostCard';
import CommentSection from '@/components/blog/CommentSection';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Helmet } from 'react-helmet-async';
import { Calendar, User, Clock, Share2, Facebook, Twitter, Linkedin, ArrowLeft, Bookmark, ChevronLeft, ChevronRight, Maximize2, Newspaper } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import useEmblaCarousel from 'embla-carousel-react';
import { getRelatedPostsByAI } from '@/services/seoService';
import { stripHtml } from '@/lib/utils';

export default function BlogPost() {
  const { slug } = useParams();
  const { isAdmin } = useAuth();
  const [post, setPost] = useState<any>(null);
  const [relatedPosts, setRelatedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: post?.metaDescription,
          url: window.location.href,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const shareOnSocial = (platform: string) => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(post?.title || '');
    let shareUrl = '';

    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const extractImages = (content: string, html?: string) => {
    const images: string[] = [];
    const mdRegex = /!\[.*?\]\((.*?)\)/g;
    let match;
    while ((match = mdRegex.exec(content)) !== null) {
      if (!match[1].startsWith('http') && !match[1].startsWith('/')) continue;
      images.push(match[1]);
    }
    if (html) {
      const htmlRegex = /<img.*?src=["'](.*?)["'].*?>/g;
      while ((match = htmlRegex.exec(html)) !== null) {
        images.push(match[1]);
      }
    }
    return Array.from(new Set(images));
  };

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      try {
        let q;
        if (isAdmin) {
          q = query(collection(db, 'posts'), where('slug', '==', slug), limit(1));
        } else {
          q = query(
            collection(db, 'posts'), 
            where('slug', '==', slug), 
            where('status', '==', 'published'), 
            limit(1)
          );
        }
        
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const postData = snapshot.docs[0].data() as any;
          setPost({ id: snapshot.docs[0].id, ...postData });

          const candidatesQuery = query(
            collection(db, 'posts'), 
            where('status', '==', 'published'),
            orderBy('publishDate', 'desc'),
            limit(20)
          );
          const candidatesSnap = await getDocs(candidatesQuery);
          const candidates = candidatesSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() }) as any)
            .filter(p => p.slug !== slug);

          // Find related posts using AI similarity
          getRelatedPostsByAI(
            { title: postData.title, category: postData.category, focusKeyword: postData.focusKeyword },
            candidates
          ).then(recommendedIds => {
            if (recommendedIds.length > 0) {
              setRelatedPosts(candidates.filter(c => recommendedIds.includes(c.id)).slice(0, 4));
            } else {
              setRelatedPosts(candidates.slice(0, 4));
            }
          });
        }
      } catch (error) {
        console.error("Error fetching post:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug]);

  if (loading) return <div className="h-screen flex items-center justify-center">Loading article...</div>;
  if (!post) return <div className="h-screen flex flex-col items-center justify-center">
    <h2 className="text-2xl font-bold mb-4">Post not found</h2>
    <Link to="/blog"><Button>Back to Blog</Button></Link>
  </div>;

  const contentImages = extractImages(post.content || '', post.contentHtml);
  const featuredImg = post.featuredImage || post.thumbnail;
  const allImages = Array.from(new Set([featuredImg, ...contentImages])).filter(Boolean);

  const renderContent = (html?: string, content?: string) => {
    if (html) {
      // Replace ad placeholders with stylized units
      const adUnit = `<div class="my-10 p-6 bg-slate-50 border border-slate-100 rounded-3xl text-center">
        <span class="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-2">Advertisements</span>
        <div class="h-64 w-full bg-slate-100/50 rounded-2xl flex items-center justify-center">
          <p class="text-xs text-slate-400 font-medium">Responsive Ad Unit - High CPC Target</p>
        </div>
      </div>`;
      const processedHtml = html.replace(/\[GOOGLE_AD_SLOT\]/g, adUnit);
      return <div dangerouslySetInnerHTML={{ __html: processedHtml }} />;
    }
    return (
      <ReactMarkdown rehypePlugins={[rehypeRaw]}>
        {content || ''}
      </ReactMarkdown>
    );
  };

  const formatDate = (date: any) => {
    if (!date) return '';
    try {
      const d = date.toDate ? date.toDate() : new Date(date);
      return d.toLocaleDateString();
    } catch (e) {
      return '';
    }
  };

  const publishDateStr = formatDate(post.publishDate || post.createdAt);
  const readingTime = Math.ceil((stripHtml(post.content || '').length) / 200);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{post.metaTitle || post.title} | E-Legal Advisor</title>
        <meta name="description" content={post.metaDescription} />
        {post.metaKeywords && <meta name="keywords" content={post.metaKeywords} />}
        
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.metaTitle || post.title} />
        <meta property="og:description" content={post.metaDescription} />
        <meta property="og:image" content={post.featuredImage || post.thumbnail} />
        <link rel="canonical" href={window.location.href} />
      </Helmet>
      
      <Navbar />

      <article className="pt-10 pb-20">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Content Column */}
          <div className="lg:col-span-8 lg:pr-12 lg:border-r border-primary/10">
            <Link to="/" className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-primary mb-10 hover:underline">
              <ArrowLeft className="w-3 h-3 mr-1" /> Home Edition
            </Link>

            <header className="mb-12">
              <div className="flex items-center gap-4 mb-4">
                <span className="px-2 py-0.5 bg-primary text-background text-[9px] font-black uppercase tracking-widest">{post.category}</span>
                <span className="text-[10px] font-bold text-muted-foreground italic">Insight Bulletin</span>
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-black text-primary leading-[0.95] mb-8 tracking-tighter">
                {post.title}
              </h1>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 py-6 border-y-2 border-primary my-10">
                <div className="flex items-center gap-4">
                   <div className="text-sm">
                      <p className="font-black text-primary uppercase tracking-widest text-[11px]">Dispatch By {post.authorName || 'E-Legal Staff'}</p>
                      <p className="text-muted-foreground font-serif italic text-xs">Specialized intelligence report for North America</p>
                   </div>
                </div>
                <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-widest text-primary">
                  <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {publishDateStr}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {readingTime} Min Read</span>
                </div>
              </div>
            </header>

            {/* Featured Image - Traditional Aspect */}
            <div className="relative mb-12">
              <div className="aspect-[21/9] bg-muted mb-2">
                <img 
                  src={featuredImg || 'https://picsum.photos/seed/legal/1200/600'} 
                  alt={post.title} 
                  className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-700"
                  referrerPolicy="no-referrer"
                />
              </div>
              <p className="text-[10px] font-serif italic text-muted-foreground text-center border-b border-primary/5 pb-4">
                Visual documentation supporting the strategic overview presented in this dispatch.
              </p>
            </div>

            {/* Social Share - Minimal Sidebar Style */}
            <div className="flex items-center gap-4 mb-12">
               <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mr-4">Share dispatch</span>
               {['facebook', 'twitter', 'linkedin'].map(platform => (
                 <button 
                  key={platform} 
                  onClick={() => shareOnSocial(platform)}
                  className="w-8 h-8 flex items-center justify-center border border-primary/10 hover:border-primary transition-all group"
                 >
                   {platform === 'facebook' && <Facebook className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />}
                   {platform === 'twitter' && <Twitter className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />}
                   {platform === 'linkedin' && <Linkedin className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />}
                 </button>
               ))}
               <button onClick={handleShare} className="w-8 h-8 flex items-center justify-center border border-primary/10 hover:border-primary transition-all group">
                 <Share2 className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
               </button>
            </div>

            {/* Article Content - Clean Typography */}
            <div className="font-serif text-xl text-foreground leading-relaxed prose prose-neutral max-w-none prose-headings:font-heading prose-headings:font-black prose-headings:text-primary prose-p:mb-8 drop-cap">
              {renderContent(post.contentHtml, post.content || '')}
            </div>

            <div className="mt-20 border-t-2 border-primary pt-10">
               <div className="p-10 border border-primary/10 bg-muted/20">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.3em] mb-6">Staff Registry</h3>
                  <div className="flex flex-col sm:flex-row gap-10 items-start">
                     <div className="w-20 h-20 bg-primary/10 shrink-0">
                        <img src={`https://picsum.photos/seed/${post.authorName}/200`} className="w-full h-full object-cover grayscale" />
                     </div>
                     <div>
                        <h4 className="text-xl font-heading mb-3">{post.authorName || 'The Advisory Team'}</h4>
                        <p className="text-sm font-serif leading-relaxed text-muted-foreground mb-6 opacity-80">
                           Our team provides evidence-based strategic planning and legal intelligence for regional and institutional growth. 
                           All reports are verified for market accuracy within current North American jurisdictions.
                        </p>
                        <Button variant="outline" className="text-[10px] font-black uppercase tracking-widest rounded-none border-primary/20 hover:border-primary hover:bg-transparent">
                          View Personnel Profile
                        </Button>
                     </div>
                  </div>
               </div>
            </div>

            <div className="mt-10 p-6 border-y-4 border-double border-primary/10 text-xs font-serif italic text-muted-foreground/60 text-center">
              Disclaimer: This intelligence dispatch is for informational purposes only and does not constitute formal legal or financial counsel. 
              Always consult with certified regulatory entities before executing major capital movements.
            </div>

            <div className="mt-16 pt-16 border-t border-primary/10">
              <CommentSection postId={post.id} />
            </div>
          </div>

          {/* Sidebar Column */}
          <aside className="lg:col-span-4 space-y-16">
            <div className="sticky top-20">
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary mb-8 pb-2 border-b-2 border-primary">Lateral Intelligence</h3>
              <div className="relative group">
                <div className="overflow-hidden" ref={emblaRef}>
                  <div className="flex">
                    {relatedPosts.map((p) => (
                      <div key={p.id} className="flex-[0_0_100%] min-w-0 pl-4 first:pl-0 sm:flex-[0_0_50%] lg:flex-[0_0_100%]">
                        <Link to={`/blog/${p.slug}`} className="group block space-y-4 p-6 border border-primary/5 hover:border-primary/20 bg-muted/5 transition-all">
                          <div className="aspect-video overflow-hidden">
                            <img src={p.thumbnail} alt={p.title} className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700" referrerPolicy="no-referrer" />
                          </div>
                          <div className="space-y-2">
                            <span className="text-[9px] font-black text-primary/40 uppercase tracking-widest italic">{p.category}</span>
                            <h4 className="text-xl font-heading text-primary group-hover:underline transition-all leading-tight line-clamp-2">
                              {p.title}
                            </h4>
                            <p className="text-xs font-serif text-muted-foreground line-clamp-2 leading-relaxed opacity-70">
                              {stripHtml(p.metaDescription || p.content.substring(0, 100))}
                            </p>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>

                {relatedPosts.length > 1 && (
                  <>
                    <button 
                      onClick={scrollPrev} 
                      className="absolute -left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white border border-primary/10 shadow-xl flex items-center justify-center hover:bg-primary hover:text-white transition-all z-10 opacity-0 group-hover:opacity-100"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={scrollNext} 
                      className="absolute -right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white border border-primary/10 shadow-xl flex items-center justify-center hover:bg-primary hover:text-white transition-all z-10 opacity-0 group-hover:opacity-100"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
                
                <div className="flex justify-center gap-1.5 mt-6">
                  {scrollSnaps.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => emblaApi && emblaApi.scrollTo(index)}
                      className={`h-1 transition-all rounded-full ${index === selectedIndex ? 'w-8 bg-primary' : 'w-2 bg-primary/20'}`}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-20 p-8 bg-primary text-background">
                 <Newspaper className="w-10 h-10 mb-6 opacity-20" />
                 <h4 className="text-xl font-heading mb-4 leading-tight">Subscribe to Weekly Intel Bulletins</h4>
                 <p className="text-xs font-serif leading-relaxed mb-8 opacity-70 italic">
                   Direct delivery of critical regulatory updates and market shifts twice per week.
                 </p>
                 <div className="space-y-4">
                    <input 
                      type="email" 
                      placeholder="Agency email address" 
                      className="w-full bg-background/10 border-b border-background/20 py-2 text-xs focus:border-background outline-none placeholder:text-background/40"
                    />
                    <Button className="w-full bg-background text-primary hover:bg-background/90 font-black uppercase text-[10px] tracking-widest rounded-none">
                      Authorize Delivery
                    </Button>
                 </div>
              </div>
            </div>
          </aside>
        </div>
      </article>

      <Footer />
    </div>
  );
}
