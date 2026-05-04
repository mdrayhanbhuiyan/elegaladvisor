import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Loader2, 
  Layers, 
  CheckCircle2, 
  XCircle,
  MoreVertical
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'categories'), orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error: any) {
      toast.error("Failed to load categories: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (category: any = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name || '',
        slug: category.slug || '',
        description: category.description || ''
      });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', slug: '', description: '' });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.slug) {
      toast.error("Name and Slug are required");
      return;
    }

    setSubmitting(true);
    try {
      if (editingCategory) {
        await updateDoc(doc(db, 'categories', editingCategory.id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
        toast.success("Category updated successfully");
      } else {
        await addDoc(collection(db, 'categories'), {
          ...formData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        toast.success("Category created successfully");
      }
      setIsDialogOpen(false);
      fetchCategories();
    } catch (error: any) {
      toast.error("Operation failed: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will not delete posts in this category but may affect filtering.")) return;
    try {
      await deleteDoc(doc(db, 'categories', id));
      toast.success("Category deleted");
      fetchCategories();
    } catch (error: any) {
      toast.error("Failed to delete: " + error.message);
    }
  };

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-primary/10 transition-colors">
        <div>
          <Badge className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-none px-4 py-1.5 rounded-full uppercase text-[10px] tracking-[0.3em] font-black mb-4 block w-fit">System Taxonomy</Badge>
          <h1 className="text-4xl font-heading text-secondary dark:text-white leading-tight">Archive Segments</h1>
          <p className="text-secondary/60 dark:text-muted-foreground text-xs font-bold uppercase tracking-widest mt-2 italic flex items-center gap-2">
            <Layers className="w-3 h-3 text-indigo-600" /> Relational data organization for financial intelligence
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button onClick={() => handleOpenDialog()} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black h-14 px-10 rounded-2xl shadow-xl shadow-indigo-100 dark:shadow-none uppercase text-xs tracking-widest">
              <Plus className="w-5 h-5 mr-3" /> Initialize Logic
            </Button>} />
          <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-heading">Segment Protocol</DialogTitle>
              <DialogDescription className="text-xs uppercase font-black tracking-widest opacity-50">
                Define a new classification node for the intelligence matrix.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 py-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Node Label</Label>
                <Input 
                  id="name" 
                  value={formData.name || ""} 
                  onChange={e => {
                    setFormData({...formData, name: e.target.value, slug: (e.target.value || '').toLowerCase().replace(/\s+/g, '-')});
                  }}
                  placeholder="e.g. Personal Financial Strategy"
                  className="h-12 bg-muted/20 border-primary/5 rounded-xl text-sm font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Electronic Slug</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">/</span>
                  <Input 
                    id="slug" 
                    value={formData.slug || ""} 
                    onChange={e => setFormData({...formData, slug: e.target.value})}
                    placeholder="personal-strategy"
                    className="h-12 pl-8 bg-muted/20 border-primary/10 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Functional Intent</Label>
                <Textarea 
                  id="description" 
                  value={formData.description || ""} 
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Define the strategic purpose of this node..."
                  rows={4}
                  className="bg-muted/20 border-primary/5 rounded-xl text-sm font-medium resize-none p-4"
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={submitting} className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg transition-all">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5 mr-3" />}
                  {editingCategory ? 'Commit Changes' : 'Finalize Logic Node'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border border-slate-100 dark:border-slate-900 shadow-[0_15px_60px_-15px_rgba(0,0,0,0.05)] rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-950 transition-all duration-500">
        <CardHeader className="pb-8 p-10 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/40 rounded-2xl text-indigo-600 shadow-inner">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-heading text-secondary dark:text-white leading-tight">Segment Console</CardTitle>
                <CardDescription className="text-[10px] uppercase font-black tracking-widest opacity-50">Active Classification Matrix Nodes</CardDescription>
              </div>
            </div>
            <div className="relative w-full sm:w-80 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              <Input 
                placeholder="Filter matrix nodes..." 
                className="h-12 pl-12 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 rounded-xl shadow-sm focus:ring-indigo-600 transition-all text-sm font-medium"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/30 dark:bg-slate-900/30 text-slate-400 uppercase text-[9px] font-black tracking-[0.2em] border-bottom border-slate-100 dark:border-slate-900">
                <tr>
                  <th className="px-10 py-5">Node Identity</th>
                  <th className="px-10 py-5">Electronic Slug</th>
                  <th className="px-10 py-5">Operational State</th>
                  <th className="px-10 py-5 text-right pr-12">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-900">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-10 py-40 text-center">
                      <div className="flex flex-col items-center gap-6">
                        <div className="w-12 h-12 border-t-2 border-indigo-600 rounded-full animate-spin"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 bg-slate-100 dark:bg-slate-900 px-6 py-2 rounded-full">Synchronizing Taxonomy...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-10 py-40 text-center">
                       <div className="flex flex-col items-center gap-4 text-slate-300">
                         <XCircle className="w-16 h-16 opacity-10" />
                         <p className="text-[10px] font-black uppercase tracking-[0.3em] italic">Zero archive nodes matching current filter.</p>
                       </div>
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((category) => (
                    <tr key={category.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all duration-300 group">
                      <td className="px-10 py-8">
                        <div className="flex flex-col">
                          <span className="font-heading font-black text-secondary dark:text-white group-hover:text-indigo-600 transition-colors uppercase tracking-tight text-base leading-tight">{category.name}</span>
                          <span className="text-[10px] text-slate-400 font-bold mt-2 line-clamp-1 max-w-[400px] uppercase tracking-wide opacity-80">{category.description || 'No descriptive logic defined'}</span>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-2">
                           <span className="text-[9px] text-slate-400 font-mono">/</span>
                           <code className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-widest uppercase">{category.slug}</code>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-2.5 bg-green-50/50 dark:bg-green-900/10 text-green-600 px-4 py-1.5 rounded-full w-fit">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="font-black text-[9px] tracking-[0.2em] uppercase">Tactical Active</span>
                        </div>
                      </td>
                      <td className="px-10 py-8 text-right pr-12">
                        <div className="flex justify-end gap-3 opacity-40 group-hover:opacity-100 transition-all duration-300">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleOpenDialog(category)} 
                            className="h-10 w-10 rounded-xl hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 hover:shadow-xl transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDelete(category.id)}
                            className="h-10 w-10 rounded-xl text-red-400 hover:text-red-600 hover:bg-white dark:hover:bg-slate-800 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
