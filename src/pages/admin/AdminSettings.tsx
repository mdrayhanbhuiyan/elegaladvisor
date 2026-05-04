import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Save, Globe, Shield, CreditCard, Sparkles, Zap, Loader2 } from 'lucide-react';
import { getAutoBlogConfig, saveAutoBlogConfig, AutoBlogConfig } from '@/services/autoBlogService';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    siteTitle: 'E-Legal Advisor',
    siteTagline: 'Smart Financial & Legal Guidance for USA & Canada',
    adSenseCode: '',
    disclaimer: 'This article is for informational purposes only and not legal or financial advice.',
    contactEmail: 'contact@e-legal-advisor.com'
  });
  
  const [autoConfig, setAutoConfig] = useState<AutoBlogConfig>({
    isEnabled: false,
    lastRun: null,
    generationCountPerDay: 5,
    targetRegion: "USA & Canada",
    categories: ["Loans", "Insurance", "Education", "Law"],
    publishDirectly: true
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const configDoc = await getDoc(doc(db, 'settings', 'config'));
      if (configDoc.exists()) {
        setSettings(prev => ({ ...prev, ...configDoc.data() }));
      }
      
      const abConfig = await getAutoBlogConfig();
      setAutoConfig(prev => ({ ...prev, ...abConfig }));
    };
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await Promise.all([
        setDoc(doc(db, 'settings', 'config'), settings),
        saveAutoBlogConfig(autoConfig)
      ]);
      toast.success("Settings updated successfully");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-primary/10 transition-colors">
        <div>
          <Badge className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-none px-4 py-1.5 rounded-full uppercase text-[10px] tracking-[0.3em] font-black mb-4 block w-fit">Core Configuration</Badge>
          <h1 className="text-4xl font-heading text-secondary dark:text-white leading-tight">System Parameters</h1>
          <p className="text-secondary/60 dark:text-muted-foreground text-xs font-bold uppercase tracking-widest mt-2 italic flex items-center gap-2">
            <Zap className="w-3 h-3 text-indigo-600" /> Operational overrides and autonomous logic management
          </p>
        </div>
        <Button onClick={handleSave} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black h-14 px-10 rounded-2xl shadow-xl shadow-indigo-100 dark:shadow-none uppercase text-xs tracking-widest">
          {loading ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <Save className="w-5 h-5 mr-3" />}
          Commit Logic
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <form onSubmit={handleSave} className="lg:col-span-2 space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <Card className="border border-primary/5 shadow-none bg-white dark:bg-slate-950 rounded-[2.5rem] overflow-hidden">
              <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-primary/5 p-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-primary/5 text-indigo-600">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-heading">Site Identity</CardTitle>
                    <CardDescription className="text-[10px] font-black uppercase tracking-widest opacity-50">Matrix Branding Nodes</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 p-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Entity Label</Label>
                  <Input 
                    value={settings.siteTitle || ""} 
                    onChange={e => setSettings({...settings, siteTitle: e.target.value})} 
                    className="h-12 bg-muted/20 border-primary/5 rounded-xl text-sm font-bold px-4"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Contact Channel</Label>
                  <Input 
                    value={settings.contactEmail || ""} 
                    onChange={e => setSettings({...settings, contactEmail: e.target.value})} 
                    className="h-12 bg-muted/20 border-primary/5 rounded-xl text-sm font-bold px-4 font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Strategic Tagline</Label>
                  <Input 
                    value={settings.siteTagline || ""} 
                    onChange={e => setSettings({...settings, siteTagline: e.target.value})} 
                    className="h-12 bg-muted/20 border-primary/5 rounded-xl text-sm font-medium px-4"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-primary/5 shadow-none bg-white dark:bg-slate-950 rounded-[2.5rem] overflow-hidden">
              <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-primary/5 p-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-primary/5 text-emerald-600">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-heading">Autonomous Engine</CardTitle>
                    <CardDescription className="text-[10px] font-black uppercase tracking-widest opacity-50">Relational Content Synthesis</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 p-8">
                <div className="flex items-center justify-between p-6 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/40">
                   <div className="space-y-1">
                      <Label className="text-[11px] font-black uppercase tracking-widest text-emerald-900 dark:text-emerald-400">Tactical Growth Engaged</Label>
                      <p className="text-[9px] text-emerald-600 font-bold leading-tight max-w-[200px]">Autonomous discovery and generation protocol targeting high-intent regions.</p>
                   </div>
                   <Switch 
                    checked={autoConfig.isEnabled} 
                    onCheckedChange={val => setAutoConfig({...autoConfig, isEnabled: val})} 
                    className="data-[state=checked]:bg-emerald-600"
                   />
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Daily Quota</Label>
                      <Input 
                        type="number" 
                        min="1" 
                        max="10" 
                        value={autoConfig.generationCountPerDay || 5} 
                        onChange={e => setAutoConfig({...autoConfig, generationCountPerDay: parseInt(e.target.value) || 5})}
                        className="h-12 bg-muted/20 border-primary/5 rounded-xl text-sm font-black px-4"
                      />
                   </div>
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sector Focus</Label>
                      <Input 
                        value={autoConfig.targetRegion || ""} 
                        onChange={e => setAutoConfig({...autoConfig, targetRegion: e.target.value})}
                        className="h-12 bg-muted/20 border-primary/5 rounded-xl text-sm font-bold px-4"
                      />
                   </div>
                </div>

                <div className="flex items-center justify-between p-6 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/40">
                   <div className="space-y-1">
                      <Label className="text-[11px] font-black uppercase tracking-widest text-indigo-900 dark:text-indigo-400">Auto-Deploy Protocol</Label>
                      <p className="text-[9px] text-indigo-600 font-bold leading-tight max-w-[200px]">Bypass manual review and initialize immediate asset publication via internal routing.</p>
                   </div>
                   <Switch 
                    checked={autoConfig.publishDirectly || false} 
                    onCheckedChange={val => setAutoConfig({...autoConfig, publishDirectly: val})} 
                    className="data-[state=checked]:bg-indigo-600"
                   />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-primary/5 shadow-none bg-white dark:bg-slate-950 rounded-[2.5rem] overflow-hidden">
              <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-primary/5 p-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-primary/5 text-green-600">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-heading">Revenue Vector</CardTitle>
                    <CardDescription className="text-[10px] font-black uppercase tracking-widest opacity-50">AdSense Logic Integration</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 p-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Script Injection Node</Label>
                  <Textarea 
                    placeholder="<script async src='...'></script>" 
                    className="font-mono text-[11px] h-40 bg-muted/20 border-primary/5 rounded-2xl p-6 leading-relaxed"
                    value={settings.adSenseCode || ""}
                    onChange={e => setSettings({...settings, adSenseCode: e.target.value})}
                  />
                  <div className="flex items-center gap-2 mt-2 opacity-60">
                    <div className="w-1 h-1 rounded-full bg-slate-400"></div>
                    <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest leading-loose">Verify AdSense console connectivity before commit.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-primary/5 shadow-none bg-white dark:bg-slate-950 rounded-[2.5rem] overflow-hidden">
              <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-primary/5 p-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-primary/5 text-rose-600">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-heading">Compliance Layer</CardTitle>
                    <CardDescription className="text-[10px] font-black uppercase tracking-widest opacity-50">Global Risk Disclaimer Matrix</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 p-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Legal Dispatch Footer</Label>
                  <Textarea 
                    className="h-40 bg-muted/20 border-primary/5 rounded-2xl p-6 text-sm font-medium leading-relaxed italic"
                    value={settings.disclaimer || ""}
                    onChange={e => setSettings({...settings, disclaimer: e.target.value})}
                  />
                  <div className="flex items-center gap-2 mt-2 opacity-60">
                    <div className="w-1 h-1 rounded-full bg-slate-400"></div>
                    <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest leading-loose">Automated footer insertion engaged for AdSense parity.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
}
