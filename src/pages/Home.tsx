import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Landmark, CreditCard, GraduationCap, Plane, Activity, ArrowRight, Layers } from 'lucide-react';
import { motion } from 'motion/react';
import { stripHtml } from '@/lib/utils';

const CATEGORIES = [
  { name: 'Personal Loans', slug: 'personal-loans', icon: Landmark, color: 'bg-primary/10 text-primary' },
  { name: 'Credit Cards', slug: 'credit-cards', icon: CreditCard, color: 'bg-primary/10 text-primary' },
  { name: 'Scholarships', slug: 'scholarships', icon: GraduationCap, color: 'bg-primary/10 text-primary' },
  { name: 'Insurance', slug: 'insurance', icon: Activity, color: 'bg-primary/10 text-primary' },
  { name: 'Travel Card', slug: 'travel-card', icon: Plane, color: 'bg-primary/10 text-primary' },
];

export default function Home() {
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
        const latestSnapshot = await getDocs(latestQ);
        const latest = latestSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLatestPosts(latest);

        const loansQ = query(
          collection(db, 'posts'),
          where('status', '==', 'published'),
          where('category', '==', 'Loans'),
          orderBy('publishDate', 'desc'),
          limit(4)
        );
        const loansSnapshot = await getDocs(loansQ);
        setLoanPosts(loansSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        const scholarshipQ = query(
          collection(db, 'posts'),
          where('status', '==', 'published'),
          where('category', '==', 'Scholarships'),
          orderBy('publishDate', 'desc'),
          limit(3)
        );
        const scholarshipSnapshot = await getDocs(scholarshipQ);
        setScholarshipPosts(scholarshipSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

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

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="max-w-7xl mx-auto pt-32 px-4 sm:px-6 lg:px-8 pb-20">
        {/* Header Bar */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-center justify-between mb-12 border-b border-primary/20 pb-6"
        >
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <Badge variant="outline" className="border-primary text-primary font-bold text-[10px] uppercase tracking-[0.2em] px-3 py-1 bg-primary/5">
              Legal & Financial Intelligence
            </Badge>
            <div className="h-4 w-px bg-primary/20 hidden md:block"></div>
            <span className="text-[10px] uppercase tracking-widest font-black text-secondary/60">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-secondary text-background flex items-center justify-center text-[10px] font-bold">
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <span className="text-[10px] font-bold text-secondary/40 uppercase tracking-tighter">
              +12K Active Readers
            </span>
          </div>
        </motion.div>

        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-24">
          {loading ? (
            <div className="lg:col-span-8 h-[600px] bg-secondary/5 animate-pulse rounded-3xl"></div>
          ) : topStory ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
              className="lg:col-span-8 group relative"
            >
              <Link to={`/blog/${topStory.slug}`} className="block relative overflow-hidden rounded-[2.5rem] luxury-shadow mb-8">
                <div className="aspect-[21/11] relative overflow-hidden">
                  <img 
                    src={topStory.thumbnail || `https://picsum.photos/seed/${topStory.id}/1200/600`} 
                    alt={topStory.title} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 via-secondary/20 to-transparent" />
                  <div className="absolute bottom-10 left-10 right-10">
                    <Badge className="bg-primary text-secondary mb-4 font-black uppercase tracking-widest text-[10px] px-4 py-1.5 rounded-full border-none">
                      Editorial Choice
                    </Badge>
                    <h1 className="text-4xl md:text-6xl text-white font-heading leading-[1] mb-4 drop-shadow-lg">
                      {topStory.title}
                    </h1>
                    <div className="flex items-center gap-4 text-white/80 text-[10px] font-bold uppercase tracking-widest">
                      <span>{topStory.category}</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span>{Math.ceil(stripHtml(topStory.content).length / 200)} min read</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ) : null}

          <div className="lg:col-span-4 space-y-10">
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary mb-4 pb-2 border-b border-primary/10">Briefings</h3>
            <div className="space-y-8">
              {loading ? Array(3).fill(0).map((_, i) => <div key={i} className="h-24 bg-secondary/5 animate-pulse rounded-2xl" />) : 
               sideStories.map((post, idx) => (
                <motion.div 
                  key={post.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + (idx * 0.1) }}
                >
                  <Link to={`/blog/${post.slug}`} className="group block space-y-3">
                    <div className="flex items-center gap-3 text-primary text-[9px] font-black uppercase tracking-widest">
                      <span>{post.category}</span>
                      <ArrowRight className="w-2.5 h-2.5 transition-transform group-hover:translate-x-1" />
                    </div>
                    <h4 className="text-2xl font-heading text-secondary group-hover:text-primary transition-colors leading-[1.2]">
                      {post.title}
                    </h4>
                    <p className="text-xs text-secondary/60 line-clamp-2 leading-relaxed">
                      {stripHtml(post.metaDescription)}
                    </p>
                  </Link>
                </motion.div>
              ))}
            </div>
            
            <div className="p-8 bg-secondary rounded-[2rem] text-background relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Layers className="w-20 h-20" />
              </div>
              <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4">Strategic Vault</h5>
              <p className="text-lg font-heading leading-tight mb-6">Gain access to professional-grade financial frameworks.</p>
              <Button className="w-full bg-primary text-secondary hover:bg-primary/90 font-black uppercase text-[10px] tracking-widest rounded-full py-6 border-none">
                Premium Membership
              </Button>
            </div>
          </div>
        </section>

        {/* Global Market Intelligence Grid */}
        <section className="mb-32">
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4 block text-left">Asset Categories</span>
              <h2 className="text-4xl md:text-5xl font-heading text-secondary text-left">Wealth Management</h2>
            </div>
            <Link to="/blog" className="text-[10px] font-black text-secondary/40 hover:text-primary uppercase tracking-widest pb-2 border-b border-secondary/10 transition-colors">
              Explore All Verticals
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {CATEGORIES.map((cat, idx) => (
              <motion.div 
                key={cat.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="group cursor-pointer"
              >
                <Link to={`/category/${cat.slug}`} className="block h-full">
                  <div className="h-full p-8 bg-white border border-primary/5 rounded-[2rem] text-center transition-all duration-500 hover:bg-secondary hover:text-background luxury-shadow">
                    <div className={`w-12 h-12 ${cat.color} rounded-2xl flex items-center justify-center mx-auto mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:bg-primary group-hover:text-secondary`}>
                      <cat.icon className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-black uppercase tracking-widest mb-2">{cat.name}</h4>
                    <p className="text-[9px] font-bold opacity-40 uppercase tracking-tighter">Premium Guides</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Featured Verticals */}
        <section className="space-y-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            <div className="lg:col-span-4 lg:sticky lg:top-32 text-left">
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-6 block">Section 01</span>
              <h2 className="text-5xl font-heading text-secondary mb-6 leading-tight">Mastering<br/>Modern Debt</h2>
              <p className="text-secondary/60 text-sm leading-relaxed mb-8">
                In-depth analysis of global loan structures and principal protection strategies for institutional and private success.
              </p>
              <Button variant="outline" className="rounded-full border-primary/20 text-primary hover:bg-primary/5 text-xs font-bold uppercase tracking-widest px-8 h-10">
                Strategic Archives
              </Button>
            </div>
            
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              {loading ? Array(4).fill(0).map((_, i) => <div key={i} className="h-80 bg-secondary/5 animate-pulse rounded-3xl" />) : 
               loanPosts.map((post, idx) => (
                <div key={post.id} className={`space-y-6 ${idx % 2 === 1 ? 'md:mt-12' : ''}`}>
                  <Link to={`/blog/${post.slug}`} className="block group">
                    <div className="aspect-[16/10] rounded-3xl overflow-hidden mb-6 luxury-shadow">
                      <img 
                        src={post.thumbnail || `https://picsum.photos/seed/${post.id}/600/400`} 
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                      />
                    </div>
                    <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-3 block text-left">Analytical Report</span>
                    <h4 className="text-2xl font-heading text-secondary group-hover:text-primary transition-colors leading-[1.2] text-left">
                      {post.title}
                    </h4>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <section className="bg-secondary rounded-[4rem] p-12 lg:p-24 text-background relative overflow-hidden text-left">
            <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-primary/20 blur-[150px] rounded-full"></div>
            
            <div className="max-w-4xl space-y-16">
              <div className="space-y-6">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] block">Section 02</span>
                <h2 className="text-5xl lg:text-7xl font-heading leading-none">Global Talent <br/><span className="text-primary italic">Incentives</span></h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {loading ? Array(3).fill(0).map((_, i) => <div key={i} className="h-40 bg-white/5 animate-pulse rounded-2xl" />) : 
                 scholarshipPosts.map((post) => (
                  <Link key={post.id} to={`/blog/${post.slug}`} className="space-y-6 group">
                    <div className="h-px bg-white/10 w-full group-hover:bg-primary/40 transition-colors"></div>
                    <h4 className="text-2xl font-heading leading-tight group-hover:text-primary transition-colors">
                      {post.title}
                    </h4>
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                      <TrendingUp className="w-3 h-3 text-primary" />
                      <span>Level: High</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </section>

        {/* Global News Cloud */}
        <section className="mt-32 pt-20 border-t border-primary/10">
          <div className="flex flex-col md:flex-row items-baseline gap-12">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary whitespace-nowrap">Intelligence Stream</h3>
            <div className="flex flex-wrap gap-x-12 gap-y-6">
              {['MORTGAGES', 'FEDERAL AID', 'CREDIT APR', 'DEBT ARCHITECTURE', 'PRIVATE EQUITY', 'LIABILITY PROTECTION', 'LIQUIDITY', 'ESTATE LEGALITY'].map(tag => (
                <Link key={tag} to={`/tag/${tag.toLowerCase()}`} className="text-xl md:text-2xl font-heading text-secondary/30 hover:text-secondary transition-colors uppercase tracking-widest">
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
