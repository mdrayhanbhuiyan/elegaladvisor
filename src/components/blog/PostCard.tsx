import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { stripHtml } from '@/lib/utils';

export default function PostCard({ post }: { post: any }) {
  const formatDate = (date: any) => {
    if (!date) return '';
    try {
      const d = date.toDate ? date.toDate() : new Date(date);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return '';
    }
  };

  const publishDate = formatDate(post.publishDate || post.createdAt);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="h-full group"
    >
      <Card className="overflow-hidden border border-primary/15 shadow-none h-full flex flex-col rounded-none bg-white transition-all duration-300 hover:border-primary hover:shadow-xl group-focus-within:ring-1 ring-primary">
        <Link 
          to={`/blog/${post.slug}`} 
          className="relative aspect-[16/10] overflow-hidden block border-b border-primary/10"
          tabIndex={-1}
        >
          <img 
            src={post.thumbnail || `https://picsum.photos/seed/${post.id}/800/600`} 
            alt={post.title}
            className="w-full h-full object-cover transition-all duration-700 grayscale group-hover:grayscale-0 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute top-0 right-0">
            <Badge className="bg-primary text-background rounded-none border-none px-3 py-1 uppercase text-[8px] tracking-[0.2em] font-black">
              {post.category}
            </Badge>
          </div>
        </Link>

        <CardContent className="p-6 flex-grow flex flex-col">
          <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest font-black text-muted-foreground mb-4">
             <span className="italic">{publishDate}</span>
             <span className="w-1 h-1 rounded-full bg-border"></span>
             <span>Digest</span>
          </div>

          <Link to={`/blog/${post.slug}`}>
            <h3 className="text-xl font-heading text-primary leading-tight mb-4 group-hover:underline underline-offset-4 decoration-1 decoration-primary/30 transition-all line-clamp-2">
              {post.title}
            </h3>
          </Link>

          <p className="text-foreground/70 text-[13px] font-serif leading-relaxed line-clamp-3 mb-6">
            {stripHtml(post.metaDescription || post.content?.substring(0, 150) || "Providing strategic oversight for financial and legal assets within the United States and Canada.")}
          </p>

          <div className="mt-auto pt-4 border-t border-primary/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-primary/40 uppercase tracking-widest italic">Dispatch by {post.authorName || 'Staff'}</span>
            </div>

            <Link 
              to={`/blog/${post.slug}`} 
              className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:underline underline-offset-2"
            >
              Read Full Story
              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
