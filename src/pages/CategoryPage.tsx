import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PostCard from '@/components/blog/PostCard';
import { motion } from 'motion/react';

export default function CategoryPage() {
  const { category } = useParams();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Map slug back to display category
  const displayCategory = category?.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'posts'),
          where('status', '==', 'published'),
          where('category', '==', displayCategory),
          orderBy('publishDate', 'desc')
        );
        const snapshot = await getDocs(q);
        setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [category, displayCategory]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-16 border-l-8 border-primary pl-8">
            <h1 className="text-4xl md:text-6xl font-heading font-black text-foreground mb-4 leading-none tracking-tighter">{displayCategory} Guide</h1>
            <p className="text-xl text-foreground/60 font-medium">Expert articles and resources dedicated to {displayCategory} in USA & Canada.</p>
          </div>

          {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {[1,2,3].map(i => <div key={i} className="h-80 bg-gray-50 rounded-2xl animate-pulse" />)}
             </div>
          ) : posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map(post => <PostCard key={post.id} post={post} />)}
            </div>
          ) : (
            <div className="py-20 text-center bg-secondary/5 rounded-[2.5rem] border border-border/50">
              <p className="text-foreground/40 font-bold uppercase tracking-widest text-xs">No guides found in this category yet.</p>
              <Link to="/blog" className="text-primary font-black uppercase tracking-widest text-[10px] hover:underline mt-4 inline-block">Browse all articles</Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
