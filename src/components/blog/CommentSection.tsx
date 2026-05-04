import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Send, Trash2, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  createdAt: any;
}

interface CommentSectionProps {
  postId: string;
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const { user, isAdmin } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!postId) return;

    const q = query(
      collection(db, 'posts', postId, 'comments'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
      setComments(commentsData);
    });

    return () => unsubscribe();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to leave a comment");
      return;
    }
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'posts', postId, 'comments'), {
        text: newComment,
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        authorPhoto: user.photoURL || '',
        postId,
        createdAt: serverTimestamp(),
      });
      setNewComment('');
      toast.success("Comment posted!");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;

    try {
      await deleteDoc(doc(db, 'posts', postId, 'comments', commentId));
      toast.success("Comment deleted");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    }
  };

  return (
    <div className="mt-16 pt-16 border-t border-border">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-primary/10 rounded-xl">
          <MessageSquare className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-2xl font-black text-foreground tracking-tight italic uppercase">Comments ({comments.length})</h2>
      </div>

      {user ? (
        <form onSubmit={handleSubmit} className="mb-12 space-y-4">
          <div className="flex gap-4">
            <Avatar className="w-10 h-10 rounded-xl">
              <AvatarImage src={user.photoURL || ''} />
              <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <Textarea
                placeholder="Share your thoughts or ask a question..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[100px] bg-secondary/5 border-border rounded-2xl resize-none focus-visible:ring-primary"
              />
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !newComment.trim()}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6 font-bold uppercase tracking-widest text-[10px]"
                >
                  {isSubmitting ? 'Posting...' : <><Send className="w-4 h-4 mr-2" /> Post Comment</>}
                </Button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-12 p-8 bg-secondary/5 rounded-[32px] text-center border border-border">
          <p className="text-foreground/60 mb-4 font-medium">Want to join the discussion?</p>
          <Button variant="outline" className="rounded-full border-border text-foreground hover:bg-primary/5" onClick={() => window.location.href = '/login'}>
            <LogIn className="w-4 h-4 mr-2 text-primary" /> Sign in to comment
          </Button>
        </div>
      )}

      <div className="space-y-8">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-4 group">
            <Avatar className="w-10 h-10 rounded-xl shrink-0">
              <AvatarImage src={comment.authorPhoto} />
              <AvatarFallback>{comment.authorName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground text-sm">{comment.authorName}</span>
                  <span className="text-[10px] text-foreground/40 font-bold uppercase tracking-widest">
                    {comment.createdAt ? formatDistanceToNow(comment.createdAt.toDate()) + ' ago' : 'Just now'}
                  </span>
                </div>
                {(isAdmin || user?.uid === comment.authorId) && (
                  <button 
                    onClick={() => handleDelete(comment.id)}
                    className="text-foreground/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-foreground/80 leading-relaxed text-[15px]">{comment.text}</p>
            </div>
          </div>
        ))}

        {comments.length === 0 && (
          <div className="text-center py-12 text-slate-400 italic">
            No comments yet. Be the first to share your thoughts!
          </div>
        )}
      </div>
    </div>
  );
}
