import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Save, Globe, Shield, CreditCard, Sparkles, Zap } from 'lucide-react';
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
    <div className="max-w-4xl space-y-8">
      <form onSubmit={handleSave} className="space-y-8">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-5 h-5 text-indigo-600" />
              <CardTitle>General Settings</CardTitle>
            </div>
            <CardDescription>Basic site identity and information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Site Name</Label>
                <Input 
                  value={settings.siteTitle || ""} 
                  onChange={e => setSettings({...settings, siteTitle: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label>Contact Email</Label>
                <Input 
                  value={settings.contactEmail || ""} 
                  onChange={e => setSettings({...settings, contactEmail: e.target.value})} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Site Tagline</Label>
              <Input 
                value={settings.siteTagline || ""} 
                onChange={e => setSettings({...settings, siteTagline: e.target.value})} 
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-yellow-600" />
              <CardTitle>Auto Blog Generator</CardTitle>
            </div>
            <CardDescription>AI-powered autonomous content creation targeting USA & Canada.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed">
               <div className="space-y-0.5">
                  <Label className="text-base font-bold">Enable Auto-Generator</Label>
                  <p className="text-xs text-slate-500">System will automatically discover topics and generate 5 posts daily.</p>
               </div>
               <Switch 
                checked={autoConfig.isEnabled} 
                onCheckedChange={val => setAutoConfig({...autoConfig, isEnabled: val})} 
               />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <Label>Daily Generation Count</Label>
                  <Input 
                    type="number" 
                    min="1" 
                    max="10" 
                    value={autoConfig.generationCountPerDay || 5} 
                    onChange={e => setAutoConfig({...autoConfig, generationCountPerDay: parseInt(e.target.value) || 5})}
                  />
               </div>
               <div className="space-y-2">
                  <Label>Target Region</Label>
                  <Input 
                    value={autoConfig.targetRegion || ""} 
                    onChange={e => setAutoConfig({...autoConfig, targetRegion: e.target.value})}
                  />
               </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-800">
               <div className="space-y-0.5">
                  <Label className="text-base font-bold text-indigo-900 dark:text-indigo-400">Auto-Publisher</Label>
                  <p className="text-xs text-indigo-600">If enabled, posts will be published/scheduled immediately. If disabled, they will save as drafts.</p>
               </div>
               <Switch 
                checked={autoConfig.publishDirectly || false} 
                onCheckedChange={val => setAutoConfig({...autoConfig, publishDirectly: val})} 
               />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-5 h-5 text-green-600" />
              <CardTitle>AdSense Integration</CardTitle>
            </div>
            <CardDescription>Insert your Google AdSense code. It will be auto-placed in optimized slots.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>AdSense Script Code</Label>
              <Textarea 
                placeholder="<script async src='...'></script>" 
                className="font-mono text-xs h-32"
                value={settings.adSenseCode || ""}
                onChange={e => setSettings({...settings, adSenseCode: e.target.value})}
              />
              <p className="text-[10px] text-gray-400">Copy the header script from your AdSense dashboard.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-red-600" />
              <CardTitle>Compliance & Disclaimer</CardTitle>
            </div>
            <CardDescription>Footer disclaimer shown on all pages for AdSense compliance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Global Disclaimer</Label>
              <Textarea 
                className="h-24"
                value={settings.disclaimer || ""}
                onChange={e => setSettings({...settings, disclaimer: e.target.value})}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading} className="bg-indigo-600 h-12 px-8">
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Saving..." : "Save All Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
