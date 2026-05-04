import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { stripHtml } from '@/lib/utils';

export default function PostCard({ post }: { post: any }) {
  const publishDate = new Date(post.publishDate || post.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="h-full"
    >
      <Card className="overflow-hidden border border-primary/10 shadow-sm hover:luxury-shadow transition-all duration-500 h-full flex flex-col rounded-[2rem] bg-white group ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <Link 
          to={`/blog/${post.slug}`} 
          className="relative aspect-[16/10] overflow-hidden block"
          tabIndex={-1}
        >
          <img 
            src={post.thumbnail || `https://picsum.photos/seed/${post.id}/800/600`} 
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-secondary/60 via-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="absolute top-5 left-5 pointer-events-none">
            <Badge className="bg-white/90 backdrop-blur-md text-primary hover:bg-white border-none px-3 py-1 rounded-full uppercase text-[8px] tracking-[0.15em] font-black shadow-sm">
              {post.category}
            </Badge>
          </div>
        </Link>

        <CardContent className="p-7 flex-grow flex flex-col">
          <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.1em] font-bold text-muted-foreground mb-4 text-left">
             <span className="text-primary/70">{publishDate}</span>
             <span className="w-1 h-1 rounded-full bg-border"></span>
             <span className="flex items-center gap-1.5 font-medium">
              <Clock className="w-3 h-3 text-primary/40" />
              8 min read
             </span>
          </div>

          <Link to={`/blog/${post.slug}`} className="group/title">
            <h3 className="text-xl md:text-2xl font-heading text-secondary leading-[1.25] mb-3 group-hover/title:text-primary transition-colors line-clamp-2 text-left">
              {post.title}
            </h3>
          </Link>

          <p className="text-secondary/60 text-[13px] leading-relaxed line-clamp-3 mb-6 font-medium text-left">
            {stripHtml(post.metaDescription || "Expert financial and legal guidance for USA & Canada residents.")}
          </p>

          <div className="mt-auto pt-5 border-t border-primary/5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-primary/5 flex items-center justify-center text-[9px] font-black border border-primary/10 uppercase text-primary shrink-0">
                {post.authorName?.charAt(0) || 'A'}
              </div>
              <span className="text-[10px] font-bold text-secondary/80 tracking-normal uppercase truncate max-w-[120px]">
                {post.authorName || 'Advisor'}
              </span>
            </div>

            <Link 
              to={`/blog/${post.slug}`} 
              aria-label={`Read more about ${post.title}`}
              className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:text-secondary group/link transition-colors"
            >
              <span className="hidden sm:inline">Read More</span>
              <div className="w-8 h-8 rounded-full bg-secondary/5 flex items-center justify-center group-hover/link:bg-primary group-hover/link:text-white transition-all duration-300 transform group-hover/link:translate-x-0.5">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
