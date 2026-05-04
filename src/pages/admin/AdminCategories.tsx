import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Content Categories</h1>
          <p className="text-gray-500 text-sm">Organize your financial and legal insights systematically</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button onClick={() => handleOpenDialog()} className="bg-indigo-600 hover:bg-indigo-700 font-bold h-12 px-6"><Plus className="w-4 h-4 mr-2" /> Add New Category</Button>}>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Edit Category' : 'Create New Category'}</DialogTitle>
              <DialogDescription>
                Categorize your content to help users find relevant financial guidance.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name</Label>
                <Input 
                  id="name" 
                  value={formData.name || ""} 
                  onChange={e => {
                    setFormData({...formData, name: e.target.value, slug: (e.target.value || '').toLowerCase().replace(/\s+/g, '-')});
                  }}
                  placeholder="e.g. Personal Loans"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL friendly)</Label>
                <Input 
                  id="slug" 
                  value={formData.slug || ""} 
                  onChange={e => setFormData({...formData, slug: e.target.value})}
                  placeholder="e.g. personal-loans"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea 
                  id="description" 
                  value={formData.description || ""} 
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Briefly describe what this category covers..."
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={submitting} className="w-full bg-indigo-600">
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-xl dark:bg-slate-900 border-l-4 border-indigo-600">
        <CardHeader className="pb-3 px-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg text-indigo-600">
              <Layers className="w-5 h-5" />
            </div>
            <CardTitle className="text-lg">Management Console</CardTitle>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search by name or slug..." 
              className="pl-10 h-11"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="px-6">
          <div className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-gray-500 uppercase text-[10px] font-black tracking-widest border-b dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Category Detail</th>
                  <th className="px-6 py-4">Slug</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
                      <p className="mt-2 text-gray-500 font-medium">Syncing categories...</p>
                    </td>
                  </tr>
                ) : filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                      No categories found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((category) => (
                    <tr key={category.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 dark:text-white uppercase tracking-tight">{category.name}</span>
                          <span className="text-[10px] text-gray-400 line-clamp-1 max-w-[200px]">{category.description || 'No description provided'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs text-indigo-600">{category.slug}</code>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-green-600 font-bold text-[10px]">
                          <CheckCircle2 className="w-3 h-3" /> ACTIVE
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>}>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenDialog(category)}>
                              <Edit2 className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(category.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
