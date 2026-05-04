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
import { Calendar, User, Clock, Share2, Facebook, Twitter, Linkedin, ArrowLeft, Bookmark, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import useEmblaCarousel from 'embla-carousel-react';
import { getRelatedPostsByAI } from '@/services/seoService';

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

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>{post.metaTitle || post.title} | E-Legal Advisor</title>
        <meta name="description" content={post.metaDescription} />
        {post.metaKeywords && <meta name="keywords" content={post.metaKeywords} />}
        {post.focusKeyword && <meta name="news_keywords" content={post.focusKeyword} />}
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://e-legal-advisor.com/blog/${post.slug}`} />
        <meta property="og:title" content={post.metaTitle || post.title} />
        <meta property="og:description" content={post.metaDescription} />
        <meta property="og:image" content={post.featuredImage || post.thumbnail || 'https://picsum.photos/seed/legal/1200/630'} />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={`https://e-legal-advisor.com/blog/${post.slug}`} />
        <meta property="twitter:title" content={post.metaTitle || post.title} />
        <meta property="twitter:description" content={post.metaDescription} />
        <meta property="twitter:image" content={post.featuredImage || post.thumbnail || 'https://picsum.photos/seed/legal/1200/630'} />

        <link rel="canonical" href={`https://e-legal-advisor.com/blog/${post.slug}`} />
      </Helmet>
      
      <Navbar />

      <article className="pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4">
          <Link to="/blog" className="inline-flex items-center text-sm font-medium text-primary mb-8 hover:underline italic font-bold">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Blog
          </Link>

          <header className="mb-12">
            <Badge className="bg-primary mb-6 px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em] border-none">{post.category}</Badge>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-heading font-black text-foreground leading-[0.9] mb-8 tracking-tighter">
              {post.title}
            </h1>
            
            <div className="flex flex-wrap items-center justify-between gap-6 py-8 border-y border-slate-100">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden">
                    <img src={`https://picsum.photos/seed/${post.authorName || 'Expert'}/100`} className="w-full h-full object-cover" />
                  </div>
                  <div className="text-sm">
                    <p className="font-black text-foreground uppercase tracking-widest text-[10px]">{post.authorName || 'Legal Advisor Team'}</p>
                    <p className="text-foreground/60 font-serif italic text-xs tracking-tight">Institutional Strategy Expert</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-foreground/40">
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-primary" /> {new Date(post.publishDate).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-primary" /> 8 Min Read</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleShare}
                  className="rounded-2xl flex items-center gap-2 border-border hover:bg-primary/5 hover:text-primary transition-all font-black uppercase text-[10px] tracking-widest px-4 h-10"
                >
                  <Share2 className="w-4 h-4" /> Share
                </Button>
                <div className="h-6 w-px bg-border mx-1" />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => shareOnSocial('facebook')}
                  className="rounded-2xl hover:bg-primary/10 border border-border h-10 w-10 group"
                >
                  <Facebook className="w-4 h-4 text-foreground/60 group-hover:text-[#1877F2] transition-colors" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => shareOnSocial('twitter')}
                  className="rounded-2xl hover:bg-primary/10 border border-border h-10 w-10 group"
                >
                  <Twitter className="w-4 h-4 text-foreground/60 group-hover:text-[#1DA1F2] transition-colors" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => shareOnSocial('linkedin')}
                  className="rounded-2xl hover:bg-primary/10 border border-border h-10 w-10 group"
                >
                  <Linkedin className="w-4 h-4 text-foreground/60 group-hover:text-[#0A66C2] transition-colors" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-2xl hover:bg-primary/5 hover:text-primary border border-border h-10 w-10">
                  <Bookmark className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </header>

          {/* Featured Image / Carousel */}
          <div className="relative mb-16">
            {allImages.length > 1 ? (
              <div className="group relative">
                <div className="overflow-hidden rounded-[40px] shadow-2xl bg-slate-100" ref={emblaRef}>
                  <div className="flex">
                    {allImages.map((src, index) => (
                      <div key={index} className="flex-[0_0_100%] min-w-0 relative aspect-[21/9]">
                        <img 
                          src={src as string}
                          alt={`${post.title} - Image ${index + 1}`} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                         <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent pointer-events-none" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Navigation */}
                <div className="absolute inset-y-0 left-4 right-4 flex items-center justify-between pointer-events-none">
                  <Button 
                    onClick={scrollPrev}
                    variant="secondary" 
                    size="icon" 
                    className="w-12 h-12 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto bg-white/90 backdrop-blur-sm border-none shadow-xl hover:bg-white"
                  >
                    <ChevronLeft className="w-6 h-6 text-slate-900" />
                  </Button>
                  <Button 
                    onClick={scrollNext}
                    variant="secondary" 
                    size="icon" 
                    className="w-12 h-12 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto bg-white/90 backdrop-blur-sm border-none shadow-xl hover:bg-white"
                  >
                    <ChevronRight className="w-6 h-6 text-slate-900" />
                  </Button>
                </div>

                {/* Indicators */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 p-1.5 bg-slate-900/20 backdrop-blur-md rounded-full">
                  {scrollSnaps.map((_, index) => (
                    <button
                      key={index}
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                        index === selectedIndex ? 'bg-white w-6' : 'bg-white/40 hover:bg-white/60'
                      }`}
                      onClick={() => emblaApi?.scrollTo(index)}
                    />
                  ))}
                </div>

                {/* Counter */}
                <div className="absolute top-6 right-8 px-3 py-1 bg-slate-900/40 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase tracking-widest border border-white/10">
                  {selectedIndex + 1} / {allImages.length}
                </div>
              </div>
            ) : (
              <div className="relative aspect-[21/9] rounded-[40px] overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 to-transparent"></div>
                <img 
                  src={allImages[0] as string || 'https://picsum.photos/seed/legal/1200/675'} 
                  alt={post.title} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
          </div>

          {/* Article Content */}
          <div className="font-serif text-xl sm:text-2xl text-foreground/80 leading-relaxed prose prose-slate lg:prose-xl max-w-none prose-headings:font-heading prose-headings:font-black prose-headings:tracking-tighter prose-p:mb-8 prose-img:rounded-[32px] first-letter:text-7xl first-letter:font-heading first-letter:font-black first-letter:mr-3 first-letter:float-left first-letter:mt-3 first-letter:text-primary">
            {renderContent(post.contentHtml, post.content)}
          </div>

          <div className="mt-16 p-8 bg-secondary rounded-3xl border border-border flex flex-col md:flex-row items-center gap-8 shadow-sm">
             <div className="w-24 h-24 bg-background rounded-2xl shadow-md p-1 flex-shrink-0">
               <img src="https://picsum.photos/seed/expert/200" className="w-full h-full object-cover rounded-xl" />
             </div>
             <div>
               <h3 className="text-xl font-bold text-background mb-2">About the Author</h3>
               <p className="text-background/80 mb-4 leading-relaxed">
                 Expert legal analyst and financial strategist with over 10 years of experience in North American markets. Specializing in loan structuring, insurance compliance, and educational funds.
               </p>
               <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-bold uppercase tracking-widest text-[10px] px-6 h-10">Follow Author</Button>
             </div>
          </div>
          
          <div className="mt-8 p-6 bg-secondary/5 border border-border rounded-xl text-sm italic text-foreground/60">
            Disclaimer: This article is for informational purposes only and not legal or financial advice. Always consult with a qualified professional before making significant financial decisions.
          </div>

          <CommentSection postId={post.id} />
        </div>
      </article>

      {/* Related Posts */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">More from this Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {relatedPosts.map(p => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
