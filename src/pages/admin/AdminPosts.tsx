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
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <form onSubmit={handleSearch} className="relative w-full md:max-w-lg group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-indigo-600 transition-colors w-5 h-5" />
          <Input 
            placeholder="Search within page..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-14 pl-12 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm focus:ring-indigo-600 focus:border-indigo-600 transition-all text-sm font-medium"
          />
        </form>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="hidden lg:flex flex-col items-end mr-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">System Status</span>
            <div className="flex gap-1.5">
               <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" title="Published"></div>
               <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" title="Scheduled"></div>
               <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]" title="Draft"></div>
            </div>
          </div>
          <Link to="/admin/posts/new" className="w-full md:w-auto">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-black h-14 px-8 rounded-2xl shadow-xl shadow-indigo-100 dark:shadow-none w-full uppercase text-xs tracking-widest">
              <Plus className="w-5 h-5 mr-3" /> New Construction
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 gap-6 px-2">
            <TabsList className="bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl h-14">
                <TabsTrigger value="all" className="rounded-xl px-6 h-11 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg dark:data-[state=active]:shadow-none transition-all">All Dossiers</TabsTrigger>
                <TabsTrigger value="published" className="rounded-xl px-6 h-11 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg transition-all">Published</TabsTrigger>
                <TabsTrigger value="scheduled" className="rounded-xl px-6 h-11 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg transition-all">Scheduled</TabsTrigger>
                <TabsTrigger value="draft" className="rounded-xl px-6 h-11 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg transition-all">Archived</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-900 px-6 py-3 rounded-2xl border border-slate-100 dark:border-slate-800">
               Archive Density: <span className="text-secondary dark:text-white font-black ml-1">{totalCount} Strategic Assets</span>
            </div>
        </div>

        <TabsContent value={activeTab} className="mt-0">
            <Card className="border border-slate-100 dark:border-slate-900 shadow-[0_15px_60px_-15px_rgba(0,0,0,0.05)] rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-950 transition-all duration-500">
                <div className="overflow-x-auto">
                  <Table>
                  <TableHeader>
                      <TableRow className="bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50/50 border-b border-slate-100 dark:border-slate-800 h-16">
                        <TableHead className="min-w-[400px] uppercase text-[9px] font-black tracking-[0.2em] text-slate-400 pl-8">Strategic Content Architecture</TableHead>
                        <TableHead className="uppercase text-[9px] font-black tracking-[0.2em] text-slate-400">Intelligence Agent</TableHead>
                        <TableHead className="uppercase text-[9px] font-black tracking-[0.2em] text-slate-400">Taxonomy</TableHead>
                        <TableHead className="uppercase text-[9px] font-black tracking-[0.2em] text-slate-400">Logic State</TableHead>
                        <TableHead className="uppercase text-[9px] font-black tracking-[0.2em] text-slate-400">Lifecycle Date</TableHead>
                        <TableHead className="uppercase text-[9px] font-black tracking-[0.2em] text-slate-400">Genesis Epoch</TableHead>
                        <TableHead className="text-right uppercase text-[9px] font-black tracking-[0.2em] text-slate-400 pr-8">Operations</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {loading ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-40">
                        <div className="flex flex-col items-center gap-6">
                          <div className="w-12 h-12 border-t-2 border-indigo-600 rounded-full animate-spin"></div>
                          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse bg-slate-100 dark:bg-slate-900 px-6 py-2 rounded-full">Syncing High-Value Archive...</span>
                        </div>
                      </TableCell></TableRow>
                      ) : filteredPosts.length > 0 ? filteredPosts.map((post) => (
                      <TableRow key={post.id} className="group hover:bg-slate-50 dark:hover:bg-slate-900/50 border-b border-slate-50 dark:border-slate-900 last:border-0 transition-all duration-300">
                          <TableCell className="py-7 pl-8">
                            <div className="flex items-center gap-5">
                               <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900 overflow-hidden shrink-0 border border-slate-100 dark:border-slate-800">
                                  <img 
                                    src={post.thumbnail || 'https://picsum.photos/200'} 
                                    className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500 scale-110 group-hover:scale-100" 
                                    alt={post.title}
                                    referrerPolicy="no-referrer"
                                  />
                               </div>
                               <div className="flex flex-col max-w-[400px]">
                                  <span className="font-heading font-black text-secondary dark:text-white uppercase tracking-tight text-sm leading-tight group-hover:text-indigo-600 transition-colors line-clamp-1">{post.title}</span>
                                  <div className="flex items-center gap-3 mt-2">
                                     <span className="text-[9px] text-slate-400 font-mono flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> /{post.slug}
                                     </span>
                                     <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                     <span className="text-[9px] text-indigo-600/60 font-black uppercase tracking-widest italic">{post.focusKeyword || 'Organic Strategy'}</span>
                                  </div>
                               </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-500 text-[10px] font-black uppercase tracking-widest italic">
                             {post.authorName || 'System Agent'}
                          </TableCell>
                          <TableCell>
                             <Badge variant="outline" className="bg-white dark:bg-slate-900 text-indigo-600 border-slate-100 dark:border-slate-800 uppercase text-[8px] font-black tracking-widest px-3 py-1 rounded-full shadow-sm">{post.category}</Badge>
                          </TableCell>
                          <TableCell>
                             <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                post.status === 'published' 
                                ? 'bg-green-50 dark:bg-green-900/20 text-green-600' 
                                : post.status === 'scheduled'
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                                : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600'
                             }`}>
                               <div className={`w-1.5 h-1.5 rounded-full mr-2 ${
                                 post.status === 'published' ? 'bg-green-500' : post.status === 'scheduled' ? 'bg-blue-500' : 'bg-yellow-500'
                               }`}></div>
                               {post.status}
                             </div>
                          </TableCell>
                          <TableCell className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                            {post.status === 'scheduled' 
                                ? new Date(post.publishDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'}) 
                                : new Date(post.publishDate || post.createdAt || post.updatedAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
                          </TableCell>
                          <TableCell className="text-slate-400 text-[10px] font-black uppercase tracking-widest italic">
                            {post.createdAt ? new Date(post.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'}) : 'Historical'}
                          </TableCell>
                          <TableCell className="text-right pr-8">
                            <div className="flex justify-end gap-2 pr-2">
                                <Link to={`/admin/posts/edit/${post.id}`}>
                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 hover:shadow-xl hover:shadow-indigo-100 dark:hover:shadow-none transition-all">
                                  <Edit className="w-4 h-4" />
                                </Button>
                                </Link>
                                <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer">
                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 hover:shadow-xl hover:shadow-indigo-100 dark:hover:shadow-none transition-all">
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                                </a>
                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all" onClick={() => handleDelete(post.id)}>
                                <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                          </TableCell>
                      </TableRow>
                      )) : (
                      <TableRow><TableCell colSpan={7} className="text-center py-40">
                         <div className="flex flex-col items-center gap-4 text-slate-300">
                           <Filter className="w-12 h-12 opacity-20" />
                           <p className="text-[10px] font-black uppercase tracking-[0.3em] italic">Zero archive matches in current lifecycle state.</p>
                         </div>
                      </TableCell></TableRow>
                      )}
                  </TableBody>
                  </Table>
                </div>
                
                {/* Pagination Controls */}
                {!loading && (
                  <div className="flex flex-col sm:flex-row items-center justify-between px-10 py-10 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 gap-6">
                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
                      Asset Matrix: Sector <span className="text-secondary dark:text-white">{currentPage}</span> of Distributed Load
                    </div>
                    <div className="flex items-center gap-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => fetchPosts('prev')} 
                        disabled={currentPage === 1 || loading}
                        className="h-12 px-6 text-[10px] font-black uppercase tracking-[0.3em] bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 disabled:opacity-20 transition-all shadow-sm"
                      >
                        <ChevronLeft className="w-5 h-5 mr-2" /> Previous
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => fetchPosts('next')} 
                        disabled={!hasNextPage || loading}
                        className="h-12 px-6 text-[10px] font-black uppercase tracking-[0.3em] bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 disabled:opacity-20 transition-all shadow-sm"
                      >
                        Next <ChevronRight className="w-5 h-5 ml-2" />
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
