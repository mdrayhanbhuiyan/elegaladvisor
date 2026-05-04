import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Landmark, CreditCard, GraduationCap, Plane, Activity, ArrowRight, Layers, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { stripHtml } from '@/lib/utils';

const CATEGORIES = [
  { name: 'Personal Loans', slug: 'personal-loans', icon: Landmark, color: 'bg-primary/10 text-primary' },
  { name: 'Credit Cards', slug: 'credit-cards', icon: CreditCard, color: 'bg-primary/10 text-primary' },
  { name: 'Scholarships', slug: 'scholarships', icon: GraduationCap, color: 'bg-primary/10 text-primary' },
  { name: 'Insurance', slug: 'insurance', icon: Activity, color: 'bg-primary/10 text-primary' },
  { name: 'Travel Card', slug: 'travel-card', icon: Plane, color: 'bg-primary/10 text-primary' },
];

export default function Home() {
  console.log("Home Page Rendering...");
  const [latestPosts, setLatestPosts] = useState<any[]>([]);
  const [loanPosts, setLoanPosts] = useState<any[]>([]);
  const [scholarshipPosts, setScholarshipPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const latestQ = query(
          collection(db, 'posts'),
          where('status', '==', 'published'),
          orderBy('publishDate', 'desc'),
          limit(6)
        );
        
        const loansQ = query(
          collection(db, 'posts'),
          where('status', '==', 'published'),
          where('category', 'in', ['Loans', 'Personal Loans', 'loans']),
          orderBy('publishDate', 'desc'),
          limit(4)
        );

        const scholarshipQ = query(
          collection(db, 'posts'),
          where('status', '==', 'published'),
          where('category', 'in', ['Scholarships', 'scholarships', 'Education']),
          orderBy('publishDate', 'desc'),
          limit(3)
        );

        const [latestSnapshot, loansSnapshot, scholarshipSnapshot] = await Promise.allSettled([
          getDocs(latestQ),
          getDocs(loansQ),
          getDocs(scholarshipQ)
        ]);

        if (latestSnapshot.status === 'fulfilled') {
          const latest = latestSnapshot.value.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setLatestPosts(latest);
        }

        if (loansSnapshot.status === 'fulfilled') {
          setLoanPosts(loansSnapshot.value.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }

        if (scholarshipSnapshot.status === 'fulfilled') {
          setScholarshipPosts(scholarshipSnapshot.value.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }

      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const topStory = latestPosts[0];
  const sideStories = latestPosts.slice(1, 4);

  const formatDate = (date: any) => {
    if (!date) return '';
    try {
      const d = date.toDate ? date.toDate() : new Date(date);
      return d.toLocaleDateString();
    } catch (e) {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-10">
        <div className="w-16 h-16 border-t-2 border-primary animate-spin mb-8"></div>
        <h1 className="text-2xl font-nameplate text-primary animate-pulse">THE LEGAL DAILY</h1>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mt-4 italic">Synchronizing Global Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="max-w-7xl mx-auto pt-10 px-4 sm:px-6 lg:px-8 pb-20">
        {/* Newspaper Top Info Bar */}
        <div className="border-y-2 border-primary py-2 mb-10 flex flex-col md:flex-row items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] italic">
          <div className="flex items-center gap-6 mb-2 md:mb-0">
            <span>Special Report</span>
            <div className="w-1.5 h-1.5 rounded-full bg-primary/20"></div>
            <span>Vol. LXIV — No. 312</span>
          </div>
          <div className="flex items-center gap-6">
            <span>Global Finance & Jurisprudence</span>
            <div className="w-1.5 h-1.5 rounded-full bg-primary/20"></div>
            <span className="text-primary tracking-[0.4em]">USA & CANADA EDITION</span>
          </div>
        </div>

        {/* Hero Section - Multi-column Layout */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-0 border-b border-primary/20 mb-16 pb-16">
          {/* Main Headline Column */}
          <div className="lg:col-span-8 lg:pr-10 lg:border-r border-primary/20">
            {topStory ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="group cursor-pointer"
              >
                <Link to={`/blog/${topStory.slug}`} className="block">
                  <div className="aspect-[21/11] mb-6 overflow-hidden bg-muted">
                    <img 
                      src={topStory.thumbnail || `https://picsum.photos/seed/${topStory.id}/1200/600`} 
                      alt={topStory.title} 
                      className="w-full h-full object-cover grayscale-[0.5] hover:grayscale-0 transition-all duration-700"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 bg-primary text-background text-[9px] font-black uppercase tracking-widest">{topStory.category}</span>
                      <span className="text-[10px] font-bold text-muted-foreground italic">{formatDate(topStory.publishDate || topStory.createdAt)}</span>
                    </div>
                    <h2 className="text-4xl md:text-6xl lg:text-7xl font-heading leading-[0.95] text-primary group-hover:underline underline-offset-8 transition-all decoration-1">
                      {topStory.title}
                    </h2>
                    <p className="text-lg md:text-xl font-serif text-foreground/80 leading-relaxed max-w-3xl drop-cap">
                      {stripHtml(topStory.metaDescription || topStory.content?.substring(0, 300) || '')}...
                    </p>
                    <div className="pt-4 flex items-center gap-4 border-t border-primary/10">
                       <span className="text-[10px] font-black uppercase tracking-widest italic">By {topStory.authorName || 'E-Legal Staff'}</span>
                       <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-2 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ) : (
              <div className="py-20 text-center border-2 border-dashed border-primary/10">
                 <h2 className="text-4xl font-nameplate text-primary/20">The Daily Record</h2>
                 <p className="text-sm font-serif italic text-muted-foreground mt-4">Waiting for latest intelligence dispatches...</p>
              </div>
            )}
          </div>

          {/* Right Sidebar - Breaking Stories */}
          <div className="lg:col-span-4 lg:pl-10 mt-12 lg:mt-0">
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary mb-6 pb-2 border-b-2 border-primary">Featured Briefings</h3>
            <div className="space-y-8 divide-y divide-primary/10">
              {sideStories.length > 0 ? sideStories.map((post, idx) => (
                <motion.div 
                  key={post.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={idx > 0 ? 'pt-8' : ''}
                >
                  <Link to={`/blog/${post.slug}`} className="group block space-y-3">
                    <div className="text-primary text-[9px] font-black uppercase tracking-widest italic">
                      {post.category}
                    </div>
                    <h4 className="text-2xl font-heading text-primary group-hover:underline decoration-1 transition-all leading-tight">
                      {post.title}
                    </h4>
                    <p className="text-xs font-serif text-muted-foreground line-clamp-2 leading-relaxed">
                      {stripHtml(post.metaDescription || post.content?.substring(0, 150) || '')}
                    </p>
                  </Link>
                </motion.div>
              )) : (
                <div className="py-10 text-muted-foreground/30 text-[10px] font-black uppercase tracking-widest">No recent briefings</div>
              )}
            </div>
            
            <div className="mt-12 p-8 border-4 border-double border-primary bg-background text-primary">
              <h5 className="text-[11px] font-black uppercase tracking-[0.2em] mb-4 text-center">Dispatch Advisory</h5>
              <p className="text-base font-serif italic text-center leading-tight mb-6">"Reliable intelligence remains the most effective form of capital in today's global landscape."</p>
              <Button className="w-full bg-primary text-background hover:bg-primary/90 font-black uppercase text-[10px] tracking-widest rounded-none h-12">
                Join the Network
              </Button>
            </div>
          </div>
        </section>

        {/* Global Market Intelligence Grid */}
        <section className="mb-24 px-4 py-10 bg-muted/30 border-y border-primary/20">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-[10px] font-black text-center text-primary uppercase tracking-[0.5em] mb-10">Strategic Verticals</h2>
            <div className="flex flex-wrap justify-center items-center gap-12">
              {CATEGORIES.map((cat) => (
                <Link 
                  key={cat.name} 
                  to={`/category/${cat.slug}`} 
                  className="flex flex-col items-center gap-4 group"
                >
                  <div className="w-12 h-12 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <cat.icon className="w-6 h-6 stroke-1" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Multi-Column Content Areas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Section 01 - Loans */}
          <div className="lg:col-span-8">
             <div className="flex items-baseline justify-between mb-8 border-b-2 border-primary pb-2">
                <h2 className="text-3xl font-nameplate uppercase tracking-tight text-primary">Capital Markets</h2>
                <Link to="/category/loans" className="text-[9px] font-black uppercase tracking-widest hover:underline">View Section Archives</Link>
             </div>
             
             <div className="news-columns space-y-12 md:space-y-0">
               {loanPosts.length > 0 ? loanPosts.map((post) => (
                  <article key={post.id} className="mb-12 break-inside-avoid">
                    <Link to={`/blog/${post.slug}`} className="group block">
                      <div className="aspect-[16/9] mb-4 overflow-hidden border border-primary/5 bg-muted">
                        <img 
                          src={post.thumbnail || `https://picsum.photos/seed/${post.id}/600/400`} 
                          alt={post.title}
                          className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-500"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <h4 className="text-xl font-heading text-primary group-hover:underline leading-tight mb-2">
                        {post.title}
                      </h4>
                      <p className="text-[13px] font-serif leading-relaxed text-muted-foreground line-clamp-3">
                        {stripHtml(post.metaDescription || post.content?.substring(0, 200) || '')}
                      </p>
                      <div className="mt-3 text-[9px] font-black uppercase tracking-tighter text-primary/40 italic">
                        By Staff Writer — {formatDate(post.publishDate || post.createdAt)}
                      </div>
                    </Link>
                  </article>
                )) : (
                  <div className="col-span-full py-10 text-muted-foreground/30 text-[10px] font-black uppercase tracking-widest text-center italic">Archive updates pending selection.</div>
                )}
             </div>
          </div>

          {/* Section 02 Sidebar - Scholar & Travel */}
          <div className="lg:col-span-4">
             <div className="mb-12">
               <div className="flex items-baseline justify-between mb-6 border-b-2 border-primary pb-2">
                 <h2 className="text-xl font-nameplate uppercase text-primary">Incentives</h2>
                 <User className="w-4 h-4" />
               </div>
               <div className="space-y-6">
                 {loading ? Array(3).fill(0).map((_, i) => <div key={i} className="h-20 bg-muted animate-pulse" />) : 
                  scholarshipPosts.map((post) => (
                    <Link key={post.id} to={`/blog/${post.slug}`} className="group block py-4 border-b border-primary/10 last:border-0 first:pt-0">
                      <h4 className="text-lg font-heading text-primary group-hover:italic transition-all leading-tight mb-2">
                        {post.title}
                      </h4>
                      <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground italic">
                        <TrendingUp className="w-2.5 h-2.5 text-primary" />
                        <span>Insight Report</span>
                      </div>
                    </Link>
                  ))}
               </div>
             </div>

             <div className="p-8 bg-black text-white italic text-center">
                <span className="text-[9px] font-black uppercase tracking-[0.5em] block mb-4">Classifieds</span>
                <p className="text-sm font-serif leading-relaxed opacity-70">
                   "Seeking expert council regarding cross-border assets? Join our elite inner circle for weekly bulletins."
                </p>
                <div className="mt-6 flex justify-center">
                   <div className="px-4 py-2 border border-white/20 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all cursor-pointer">
                      Inquire Monthly
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Global News Cloud */}
        <section className="mt-24 pt-12 border-t-2 border-black">
          <div className="flex flex-col md:flex-row items-baseline gap-10">
            <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-primary whitespace-nowrap">Topic Registry</h3>
            <div className="flex flex-wrap gap-x-12 gap-y-6">
              {['MORTGAGES', 'FEDERAL AID', 'CREDIT APR', 'DEBT ARCHITECTURE', 'PRIVATE EQUITY', 'LIABILITY PROTECTION', 'LIQUIDITY', 'ESTATE LEGALITY'].map(tag => (
                <Link key={tag} to={`/tag/${tag.toLowerCase()}`} className="text-xl md:text-2xl font-heading text-primary/40 hover:text-primary transition-colors decoration-1 hover:underline">
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
