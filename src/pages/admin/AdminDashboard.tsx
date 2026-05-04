import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, Eye, Clock, ListChecks, TrendingUp, Users, MousePointer2, 
  Activity as ActivityIcon, ShieldCheck, AlertCircle, 
  ArrowRight, CheckCircle2, Info, Zap, Loader2, Sparkles, Layers,
  Globe
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

import { getRealAnalytics } from '@/services/analyticsService';
import { getAutoBlogConfig, processAutoBlogCycle, AutoBlogConfig, discoverHighCPCTopics, HighCPCTopic } from '@/services/autoBlogService';
import { toast } from 'sonner';
import { motion } from 'motion/react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalPosts: 0,
    published: 0,
    drafts: 0,
    scheduled: 0,
    views: 0,
    activeUsers: 0,
    bounceRate: '0%',
    avgSession: '0s'
  });
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [sourceStats, setSourceStats] = useState<any[]>([
    { name: 'Google Search', value: 0, color: '#C5A059' }, // Gold
    { name: 'Direct', value: 0, color: '#0B3D33' }, // Emerald
    { name: 'Social Media', value: 0, color: '#d1d5db' },
    { name: 'Referrals', value: 0, color: '#6b7280' },
  ]);
  const [autoConfig, setAutoConfig] = useState<AutoBlogConfig | null>(null);
  const [runningCycle, setRunningCycle] = useState(false);
  const [marketInsights, setMarketInsights] = useState<HighCPCTopic[]>([]);
  const [fetchingInsights, setFetchingInsights] = useState(false);
  
  const [trafficData, setTrafficData] = useState<any[]>([
    { name: 'Mon', views: 0, users: 0 },
    { name: 'Tue', views: 0, users: 0 },
    { name: 'Wed', views: 0, users: 0 },
    { name: 'Thu', views: 0, users: 0 },
    { name: 'Fri', views: 0, users: 0 },
    { name: 'Sat', views: 0, users: 0 },
    { name: 'Sun', views: 0, users: 0 },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const postsRef = collection(db, 'posts');
        const snapshot = await getDocs(postsRef);
        const docs = snapshot.docs.map(doc => doc.data());
        
        const realAnalytics = await getRealAnalytics();
        const abConfig = await getAutoBlogConfig();
        setAutoConfig(abConfig);

        setStats(prev => ({
          ...prev,
          totalPosts: docs.length,
          published: docs.filter(d => d.status === 'published').length,
          drafts: docs.filter(d => d.status === 'draft').length,
          scheduled: docs.filter(d => d.status === 'scheduled').length,
          views: realAnalytics?.views || 0,
          activeUsers: realAnalytics?.activeUsers || 0,
          bounceRate: realAnalytics?.bounceRate || '0%',
          avgSession: realAnalytics?.avgSession || '0s'
        }));

        if (realAnalytics?.dailyTraffic) {
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const formattedTraffic = realAnalytics.dailyTraffic.map(d => ({
            name: days[new Date(d.date).getDay()],
            views: d.views,
            users: Math.round(d.views * 0.7)
          }));
          setTrafficData(formattedTraffic);
        }

        if (realAnalytics?.sourceStats) {
          setSourceStats(realAnalytics.sourceStats);
        }

        const q = query(postsRef, orderBy('createdAt', 'desc'), limit(5));
        const recentSnapshot = await getDocs(q);
        setRecentPosts(recentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      }
    };
    fetchData();
    fetchMarketInsights();
  }, []);

  const fetchMarketInsights = async () => {
    setFetchingInsights(true);
    try {
      const insights = await discoverHighCPCTopics("Financial Law", "USA & Canada");
      setMarketInsights(insights.slice(0, 3));
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingInsights(false);
    }
  };

  const handleManualCycle = async () => {
    setRunningCycle(true);
    try {
      const result = await processAutoBlogCycle(auth.currentUser?.uid || 'admin', auth.currentUser?.displayName || 'Admin');
      if (result.success) {
        toast.success(`Successfully generated ${result.count} posts!`);
        const config = await getAutoBlogConfig();
        setAutoConfig(config);
      } else {
        toast.info(result.message);
      }
    } catch (err: any) {
      toast.error("Auto-cycle failed: " + err.message);
    } finally {
      setRunningCycle(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const isPending = autoConfig?.isEnabled && (!autoConfig.lastRun || !autoConfig.lastRun.startsWith(today));

  const engagementData = [
    { name: 'Loans', value: 85 },
    { name: 'Insurance', value: 65 },
    { name: 'Scholarships', value: 92 },
    { name: 'Credit Cards', value: 78 },
    { name: 'Travel', value: 54 },
  ];

  return (
    <div className="space-y-10 pb-20">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-primary/10 transition-colors">
        <div>
          <Badge className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-none px-4 py-1.5 rounded-full uppercase text-[10px] tracking-[0.3em] font-black mb-4 block w-fit">
            Operational Intelligence
          </Badge>
          <h1 className="text-4xl font-heading text-secondary dark:text-white leading-tight">Command Center</h1>
          <p className="text-secondary/60 dark:text-muted-foreground text-xs font-bold uppercase tracking-widest mt-2 italic flex items-center gap-2">
            <Globe className="w-3 h-3" /> Institutional Oversight for USA & Canada Market
          </p>
        </div>
        <div className="flex items-center gap-4">
           {isPending && (
             <Button 
                onClick={handleManualCycle}
                disabled={runningCycle}
                className="bg-indigo-600 text-white hover:bg-indigo-700 font-black uppercase tracking-widest text-[10px] rounded-full px-8 h-12 shadow-lg shadow-indigo-100 dark:shadow-none border-none"
              >
                {runningCycle ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Daily Cycle Ready
             </Button>
           )}
           <Button variant="outline" className="rounded-full border-primary/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 h-12 px-6 uppercase text-[10px] font-black tracking-widest">
              Export Analysis
           </Button>
        </div>
      </div>

      {/* Quick Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <OverviewCard title="Net Impressions" value={stats.views.toLocaleString()} icon={Eye} trend="+12.5%" />
        <OverviewCard title="Asset Readers" value={stats.activeUsers.toLocaleString()} icon={Users} trend="+5.2%" />
        <OverviewCard title="Retention Core" value={stats.bounceRate} icon={MousePointer2} trend="-2.4%" />
        <OverviewCard title="Session Depth" value={stats.avgSession} icon={Clock} trend="+0.8%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Traffic Chart */}
        <Card className="lg:col-span-2 border border-primary/10 shadow-none rounded-[3rem] overflow-hidden bg-white dark:bg-slate-900">
          <CardHeader className="p-8 pb-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-heading text-secondary dark:text-white">Asset Performance Flow</CardTitle>
                <CardDescription className="text-xs uppercase tracking-widest font-bold text-secondary/40">Temporal traffic auditing</CardDescription>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800 rounded-full">
                 <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                 <span className="text-[9px] font-black uppercase tracking-widest text-green-700 dark:text-green-400">Live Pulse</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[400px] p-8 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trafficData}>
                <CartesianGrid strokeDasharray="5 5" vertical={false} strokeOpacity={0.05} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', border: '1px solid rgba(79, 70, 229, 0.1)', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)', backgroundColor: 'var(--card)' }}
                  labelStyle={{ color: 'var(--foreground)', fontFamily: 'var(--font-heading)', fontWeight: 800 }}
                  itemStyle={{ fontWeight: 800, fontSize: '10px', textTransform: 'uppercase' }}
                />
                <Line 
                  name="Impressions"
                  type="monotone" 
                  dataKey="views" 
                  stroke="#4f46e5" 
                  strokeWidth={4} 
                  dot={false}
                  activeDot={{ r: 8, strokeWidth: 0, fill: '#4f46e5' }} 
                />
                <Line 
                  name="Verified Users"
                  type="monotone" 
                  dataKey="users" 
                  stroke="#10b981" 
                  strokeWidth={4} 
                  dot={false} 
                  activeDot={{ r: 8, strokeWidth: 0, fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Traffic Sources */}
        <Card className="border border-primary/10 shadow-none rounded-[3rem] bg-white dark:bg-slate-900 text-secondary dark:text-white overflow-hidden">
          <CardHeader className="p-8">
            <CardTitle className="text-2xl font-heading">Source Attribution</CardTitle>
            <CardDescription className="text-[10px] uppercase tracking-widest font-black text-secondary/30">Referral architecture</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] flex flex-col justify-center p-8">
            <div className="flex-grow">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {sourceStats.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4 mt-8">
               {sourceStats.map((item: any, i: number) => (
                 <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                       <span className="text-[10px] font-black uppercase tracking-widest text-secondary/60 dark:text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="text-sm font-black text-secondary dark:text-white">{item.value}%</span>
                 </div>
               ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Engagement Grid */}
        <Card className="border border-primary/10 shadow-none rounded-[3rem] bg-white dark:bg-slate-900">
          <CardHeader className="p-8">
            <CardTitle className="font-heading text-xl dark:text-white">Sector Dominance</CardTitle>
            <CardDescription className="text-[9px] uppercase tracking-[0.2em] font-black text-secondary/30">Reader engagement scores</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] p-8 pt-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={engagementData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fill: 'currentColor', fontWeight: 900 }}
                  width={80}
                />
                <Bar 
                  dataKey="value" 
                  fill="#4f46e5" 
                  radius={[0, 20, 20, 0]} 
                  barSize={12}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Content Vault Summary */}
        <Card className="border border-primary/10 shadow-none rounded-[3rem] bg-indigo-600 dark:bg-indigo-950 text-white">
          <CardHeader className="p-8">
            <CardTitle className="font-heading text-xl italic">Portfolio Audit</CardTitle>
            <CardDescription className="text-[9px] uppercase tracking-[0.2em] font-black text-white/40">Total system assets</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-8">
            <div className="flex items-center justify-between pb-6 border-b border-white/10">
               <div>
                 <p className="text-3xl font-heading text-white leading-none mb-1">{stats.totalPosts}</p>
                 <p className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-200">Strategic Reserves</p>
               </div>
               <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                 <FileText className="w-5 h-5 text-white" />
               </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
               {[
                 { label: 'Deployed', val: stats.published, color: 'text-emerald-400' },
                 { label: 'Pipeline', val: stats.scheduled, color: 'text-blue-400' },
                 { label: 'Pending', val: stats.drafts, color: 'text-white/40' }
               ].map((item, i) => (
                 <div key={i} className="text-center">
                    <p className="text-2xl font-heading mb-1">{item.val}</p>
                    <p className={`text-[8px] font-black uppercase tracking-widest ${item.color}`}>{item.label}</p>
                 </div>
               ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Operations */}
        <Card className="border border-primary/10 shadow-none rounded-[3rem] bg-white dark:bg-slate-900 overflow-hidden">
          <CardHeader className="p-8">
            <CardTitle className="font-heading text-xl dark:text-white">Recent Intake</CardTitle>
            <CardDescription className="text-[9px] uppercase tracking-[0.2em] font-black text-secondary/30">Latest asset acquisition</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <div className="space-y-6">
              {recentPosts.map((post) => (
                <div key={post.id} className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-2xl bg-secondary/5 overflow-hidden flex-shrink-0 grayscale group-hover:grayscale-0 transition-all border border-primary/5">
                    <img src={post.thumbnail || `https://picsum.photos/seed/${post.id}/200`} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-[11px] font-black text-secondary dark:text-white uppercase tracking-tighter truncate group-hover:text-indigo-600 transition-colors leading-none mb-1">{post.title}</p>
                    <div className="flex items-center gap-2">
                       <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest">{post.category}</span>
                       <div className="w-1 h-1 rounded-full bg-secondary/10"></div>
                       <span className="text-[8px] font-bold text-secondary/40 dark:text-muted-foreground uppercase font-mono">{new Date(post.createdAt || post.publishDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strategic Discovery Section */}
      <section className="bg-slate-900 p-8 sm:p-12 lg:p-20 rounded-[3rem] sm:rounded-[4rem] text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-indigo-600/20 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-4 space-y-8">
            <Badge className="bg-indigo-600 text-white border-none px-5 py-2 rounded-full font-black uppercase text-[10px] tracking-[0.4em]">Insight Engine</Badge>
            <h2 className="text-4xl lg:text-6xl font-heading leading-tight">High-CPC <br/><span className="text-indigo-400 italic">Intelligence</span></h2>
            <p className="text-white/60 text-sm leading-relaxed font-light">
              AI-driven market discovery optimized for premium advertising yields in North American regions. High-density topical clustering.
            </p>
            <Button onClick={fetchMarketInsights} variant="outline" className="rounded-full border-white/20 text-white hover:bg-white/10 h-12 px-8 uppercase text-[10px] font-black tracking-[0.3em]">
               Refresh Market Data
            </Button>
          </div>
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {fetchingInsights ? Array(3).fill(0).map((_, i) => <div key={i} className="h-64 bg-white/5 animate-pulse rounded-[2.5rem]" />) : 
             marketInsights.map((item, i) => (
              <div key={i} className="bg-white/5 border border-white/5 p-8 rounded-[2.5rem] hover:bg-white/10 transition-all group">
                <TrendingUp className="w-8 h-8 text-indigo-400 mb-8" />
                <h4 className="text-xl font-heading mb-6 leading-tight group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{item.title}</h4>
                <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                   <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">$12 - $75 CPC</span>
                   <Layers className="w-3 h-3 text-white/20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function OverviewCard({ title, value, icon: Icon, trend }: any) {
  return (
    <motion.div whileHover={{ y: -8 }} transition={{ duration: 0.4 }}>
      <Card className="border border-primary/10 shadow-none rounded-[2.5rem] h-full bg-white dark:bg-slate-900 transition-colors overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-5 transform group-hover:rotate-12 transition-all">
          <Icon size={80} className="text-indigo-600" />
        </div>
        <CardContent className="p-8 flex flex-col justify-between h-full relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center border border-indigo-100 dark:border-indigo-800">
              <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            {trend && (
              <Badge variant="outline" className={`text-[10px] font-black px-3 py-1 rounded-full border-none ${
                trend.startsWith('+') ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
              }`}>
                {trend}
              </Badge>
            )}
          </div>
          <div>
            <p className="text-[9px] font-black text-secondary/40 dark:text-muted-foreground uppercase tracking-[0.3em] mb-2">{title}</p>
            <p className="text-4xl font-heading text-secondary dark:text-white tracking-tighter leading-none">{value}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
