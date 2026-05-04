import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, doc, deleteDoc, updateDoc, limit, startAfter, endBefore, limitToLast, getCountFromServer, where, QueryConstraint } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Link } from 'react-router-dom';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Trash2, ExternalLink, Search, Plus, Filter, Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const POSTS_PER_PAGE = 10;

export default function AdminPosts() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [firstDoc, setFirstDoc] = useState<any>(null);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);

  const fetchTotalCount = async () => {
    try {
      const constraints: QueryConstraint[] = [];
      if (activeTab !== 'all') {
        constraints.push(where('status', '==', activeTab));
      }
      const q = query(collection(db, 'posts'), ...constraints);
      const snapshot = await getCountFromServer(q);
      setTotalCount(snapshot.data().count);
    } catch (error) {
      console.error("Count error:", error);
    }
  };

  const fetchPosts = async (direction: 'first' | 'next' | 'prev' = 'first') => {
    setLoading(true);
    try {
      const baseConstraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];
      
      if (activeTab !== 'all') {
        baseConstraints.push(where('status', '==', activeTab));
      }

      const activeConstraints: any[] = [...baseConstraints];

      if (direction === 'next' && lastDoc) {
        activeConstraints.push(startAfter(lastDoc));
      } else if (direction === 'prev' && firstDoc) {
        activeConstraints.push(endBefore(firstDoc));
        activeConstraints.push(limitToLast(POSTS_PER_PAGE));
      }
      
      // Ensure limit is always applied if not using limitToLast from pagination
      if (direction !== 'prev') {
        activeConstraints.push(limit(POSTS_PER_PAGE));
      }

      const q = query(collection(db, 'posts'), ...activeConstraints);
      const snapshot = await getDocs(q);
      const fetchedPosts = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) }));
      
      setPosts(fetchedPosts);
      setFirstDoc(snapshot.docs[0] || null);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);

      // Check for next page
      if (fetchedPosts.length === POSTS_PER_PAGE) {
        const nextConstraints = [...baseConstraints, startAfter(snapshot.docs[snapshot.docs.length - 1]), limit(1)];
        const nextQ = query(collection(db, 'posts'), ...nextConstraints);
        const nextSnap = await getDocs(nextQ);
        setHasNextPage(!nextSnap.empty);
      } else {
        setHasNextPage(false);
      }

      if (direction === 'next') setCurrentPage(prev => prev + 1);
      if (direction === 'prev') setCurrentPage(prev => prev - 1);
      if (direction === 'first') setCurrentPage(1);

    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTotalCount();
    fetchPosts('first');
  }, [activeTab]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Since Firestore doesn't support complex string matching easily,
    // we either have to fetch everything (bad for big data) or use a search index.
    // For now, we'll keep client-side filtering ON TOP of the paginated results 
    // OR we could suggest a different approach.
    // Given the request, let's keep it simple: the search will only work on the current page 
    // unless the user specifically wants a full-text search engine.
    toast.info("Search is currently filtered on the current page results.");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await deleteDoc(doc(db, 'posts', id));
      toast.success("Post deleted");
      fetchTotalCount();
      fetchPosts('first');
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const filteredPosts = posts.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
                          p.category.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const scheduledPosts = posts.filter(p => p.status === 'scheduled');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <form onSubmit={handleSearch} className="relative flex-grow max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input 
            placeholder="Search current page..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </form>
        <div className="flex gap-2">
          <Link to="/admin/posts/new">
            <Button className="bg-indigo-600"><Plus className="w-4 h-4 mr-2" /> New Post</Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
            <TabsList>
                <TabsTrigger value="all">All Content</TabsTrigger>
                <TabsTrigger value="published">Published</TabsTrigger>
                <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                <TabsTrigger value="draft">Drafts</TabsTrigger>
            </TabsList>
            
            <div className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
               Total: <span className="text-indigo-600 font-bold">{totalCount}</span> posts in this view
            </div>
        </div>

        <TabsContent value={activeTab}>
            <Card className="border-none shadow-sm overflow-hidden bg-white">
                <Table>
                <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50 border-b">
                    <TableHead className="w-[400px]">Article Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-20">
                      <div className="flex flex-col items-center gap-3">
                        <Clock className="w-6 h-6 text-indigo-400 animate-pulse" />
                        <span className="text-sm font-medium text-slate-500">Retrieving content...</span>
                      </div>
                    </TableCell></TableRow>
                    ) : filteredPosts.length > 0 ? filteredPosts.map((post) => (
                    <TableRow key={post.id} className="group border-b last:border-0">
                        <TableCell>
                        <div className="flex flex-col">
                            <span className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight text-sm">{post.title}</span>
                            <span className="text-xs text-gray-500 font-mono">/{post.slug}</span>
                        </div>
                        </TableCell>
                        <TableCell>
                        <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-none uppercase text-[10px] tracking-widest">{post.category}</Badge>
                        </TableCell>
                        <TableCell>
                        <div className="flex items-center gap-2">
                            <Badge className={
                            post.status === 'published' 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200 border-none px-2 py-0.5' 
                            : post.status === 'scheduled'
                            ? 'bg-primary/10 text-primary border-none px-2 py-0.5'
                            : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-none px-2 py-0.5'
                            }>
                            {post.status}
                            </Badge>
                        </div>
                        </TableCell>
                        <TableCell className="text-gray-500 text-[11px] font-medium uppercase">
                        {post.status === 'scheduled' 
                            ? new Date(post.publishDate).toLocaleDateString() 
                            : new Date(post.createdAt || post.publishDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                            <Link to={`/admin/posts/edit/${post.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600"><Edit className="w-4 h-4" /></Button>
                            </Link>
                            <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer">
                            <Button variant="ghost" size="icon" className="h-8 w-8"><ExternalLink className="w-4 h-4" /></Button>
                            </a>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(post.id)}>
                            <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                        </TableCell>
                    </TableRow>
                    )) : (
                    <TableRow><TableCell colSpan={5} className="text-center py-20 text-gray-500 italic">No posts found on this page.</TableCell></TableRow>
                    )}
                </TableBody>
                </Table>
                
                {/* Pagination Controls */}
                {!loading && (
                  <div className="flex items-center justify-between px-6 py-4 bg-gray-50/50 border-t">
                    <div className="text-xs text-slate-500 font-medium">
                      Showing <span className="font-bold text-slate-700">{posts.length}</span> results on page <span className="font-bold text-slate-700">{currentPage}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => fetchPosts('prev')} 
                        disabled={currentPage === 1 || loading}
                        className="h-8 px-3 text-xs font-bold uppercase tracking-widest bg-white"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => fetchPosts('next')} 
                        disabled={!hasNextPage || loading}
                        className="h-8 px-3 text-xs font-bold uppercase tracking-widest bg-white"
                      >
                        Next <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
