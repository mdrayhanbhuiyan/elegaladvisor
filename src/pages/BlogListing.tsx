import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PostCard from '@/components/blog/PostCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';
import { motion } from 'motion/react';


export default function BlogListing() {
  const [posts, setPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'categories'));
        const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCategories(cats);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        let q = query(
          collection(db, 'posts'),
          where('status', '==', 'published'),
          orderBy('publishDate', 'desc')
        );

        if (activeCategory !== 'All') {
          q = query(
            collection(db, 'posts'),
            where('status', '==', 'published'),
            where('category', '==', activeCategory),
            orderBy('publishDate', 'desc')
          );
        }

        const snapshot = await getDocs(q);
        let results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (searchQuery) {
          results = results.filter((p: any) => 
            p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
            p.metaDescription?.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }

        setPosts(results);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [activeCategory, searchQuery]);

  const displayCategories = ['All', ...categories.map(c => c.name)];

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Navbar />

      <main className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-12 bg-primary"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Archive / Intelligence</span>
            </div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl lg:text-9xl font-heading font-black text-foreground leading-[0.8] mb-10 tracking-tighter"
            >
              LEGAL & <br/>
              <span className="italic font-serif text-primary">INSIGHTS.</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-foreground/60 max-w-2xl font-medium leading-relaxed"
            >
              Our complete library of institutional-grade guides, market analysis, and expert strategies for the modern advisor.
            </motion.p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 mb-12">
            <div className="relative flex-grow group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40 group-focus-within:text-primary transition-colors" />
              <Input 
                value={searchQuery || ""}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search archive: topic, keyword, legal strategy..." 
                className="pl-14 h-16 rounded-[24px] shadow-sm border-border focus:ring-primary bg-background font-medium text-sm placeholder:text-foreground/40 text-foreground"
              />
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0">
              {displayCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`relative px-8 py-4 rounded-[20px] text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap ${
                    activeCategory === cat 
                    ? 'text-primary-foreground' 
                    : 'text-foreground/40 hover:text-foreground bg-secondary/10 hover:bg-secondary/20'
                  }`}
                >
                  {cat}
                  {activeCategory === cat && (
                    <motion.div 
                      layoutId="category-bg"
                      className="absolute inset-0 bg-primary rounded-[20px] -z-10 shadow-xl shadow-primary/10"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1,2,3,4,5,6].map(i => <div key={i} className="h-96 bg-gray-100 rounded-2xl animate-pulse" />)}
            </div>
          ) : posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-40 border-2 border-dashed border-border rounded-3xl">
              <p className="text-foreground/40 text-lg">No articles found matching your criteria.</p>
              <Button variant="link" onClick={() => { setActiveCategory('All'); setSearchQuery(''); }} className="mt-2 text-primary hover:text-primary/80">
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
