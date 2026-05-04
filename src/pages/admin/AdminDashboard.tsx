import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, Eye, Clock, ListChecks, TrendingUp, Users, MousePointer2, 
  Activity as ActivityIcon, ShieldCheck, AlertCircle, 
  ArrowRight, CheckCircle2, Info, Zap, Loader2, Sparkles, Layers
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] luxury-shadow border border-primary/5">
        <div>
          <Badge className="bg-primary/10 text-primary border-none px-4 py-1.5 rounded-full uppercase text-[10px] tracking-[0.3em] font-black mb-4 block w-fit">
            Operational Intelligence
          </Badge>
          <h1 className="text-4xl font-heading text-secondary leading-tight">Advisor Command Vault</h1>
          <p className="text-secondary/60 text-xs font-bold uppercase tracking-widest mt-2 italic">Institutional Oversight for USA & Canada Market</p>
        </div>
        <div className="flex items-center gap-4">
           {isPending && (
             <Button 
                onClick={handleManualCycle}
                disabled={runningCycle}
                className="bg-primary text-secondary hover:bg-primary/90 font-black uppercase tracking-widest text-[10px] rounded-full px-8 h-12 gold-gradient border-none shadow-lg shadow-primary/20"
              >
                {runningCycle ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Daily Cycle Ready
             </Button>
           )}
           <Button variant="outline" className="rounded-full border-primary/20 text-primary hover:bg-primary/5 h-12 px-6 uppercase text-[10px] font-black tracking-widest">
              Export Analysis
           </Button>
        </div>
      </div>

      {/* Quick Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <OverviewCard title="Net Impressions" value={stats.views.toLocaleString()} icon={Eye} trend="+12.5%" />
        <OverviewCard title="Asset Readers" value={stats.activeUsers} icon={Users} trend="+5.2%" />
        <OverviewCard title="Retention Core" value={stats.bounceRate} icon={MousePointer2} trend="-2.4%" />
        <OverviewCard title="Session Depth" value={stats.avgSession} icon={Clock} trend="+0.8%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Traffic Chart */}
        <Card className="lg:col-span-2 border border-primary/5 luxury-shadow rounded-[3rem] overflow-hidden bg-white">
          <CardHeader className="p-8 pb-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-heading text-secondary">Asset Performance Flow</CardTitle>
                <CardDescription className="text-xs uppercase tracking-widest font-bold text-secondary/40">Temporal traffic auditing</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                 <span className="text-[9px] font-black uppercase tracking-widest text-primary">Live Pulse</span>
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
                  contentStyle={{ borderRadius: '24px', border: '1px solid rgba(11, 61, 51, 0.1)', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)', backgroundColor: '#fff' }}
                  labelClassName="font-heading text-secondary"
                  itemStyle={{ fontWeight: 800, fontSize: '10px', textTransform: 'uppercase' }}
                />
                <Line 
                  name="Impressions"
                  type="monotone" 
                  dataKey="views" 
                  stroke="#C5A059" // Gold
                  strokeWidth={4} 
                  dot={false}
                  activeDot={{ r: 8, strokeWidth: 0, fill: '#C5A059' }} 
                />
                <Line 
                  name="Verified Users"
                  type="monotone" 
                  dataKey="users" 
                  stroke="#0B3D33" // Emerald
                  strokeWidth={4} 
                  dot={false} 
                  activeDot={{ r: 8, strokeWidth: 0, fill: '#0B3D33' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Traffic Sources */}
        <Card className="border border-primary/5 luxury-shadow rounded-[3rem] bg-white text-secondary overflow-hidden">
          <CardHeader className="p-8">
            <CardTitle className="text-2xl font-heading">Source Attribution</CardTitle>
            <CardDescription className="text-[10px] uppercase tracking-widest font-black text-secondary/30">Referral architecture</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] flex flex-col justify-center p-8">
            <ResponsiveContainer width="100%" height="70%">
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
            <div className="space-y-4 mt-8">
               {sourceStats.map((item: any, i: number) => (
                 <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                       <span className="text-[10px] font-black uppercase tracking-widest text-secondary/60">{item.name}</span>
                    </div>
                    <span className="text-sm font-black text-secondary">{item.value}%</span>
                 </div>
               ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Engagement Grid */}
        <Card className="border border-primary/5 luxury-shadow rounded-[3rem] bg-white">
          <CardHeader className="p-8">
            <CardTitle className="font-heading text-xl">Sector Dominance</CardTitle>
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
                  tick={{ fontSize: 9, fill: '#0B3D33', fontWeight: 900 }}
                  width={80}
                />
                <Bar 
                  dataKey="value" 
                  fill="#C5A059" 
                  radius={[0, 20, 20, 0]} 
                  barSize={12}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Content Vault Summary */}
        <Card className="border border-primary/5 luxury-shadow rounded-[3rem] bg-secondary text-background">
          <CardHeader className="p-8">
            <CardTitle className="font-heading text-xl text-primary italic">Portfolio Audit</CardTitle>
            <CardDescription className="text-[9px] uppercase tracking-[0.2em] font-black text-primary/40">Total system assets</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-8">
            <div className="flex items-center justify-between pb-6 border-b border-primary/10">
               <div>
                 <p className="text-3xl font-heading text-background leading-none mb-1">{stats.totalPosts}</p>
                 <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Strategic Reserves</p>
               </div>
               <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                 <FileText className="w-5 h-5 text-primary" />
               </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
               {[
                 { label: 'Deployed', val: stats.published, color: 'text-primary' },
                 { label: 'Pipeline', val: stats.scheduled, color: 'text-white' },
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
        <Card className="border border-primary/5 luxury-shadow rounded-[3rem] bg-white">
          <CardHeader className="p-8">
            <CardTitle className="font-heading text-xl">Recent Intake</CardTitle>
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
                    <p className="text-[11px] font-black text-secondary uppercase tracking-tighter truncate group-hover:text-primary transition-colors leading-none mb-1">{post.title}</p>
                    <div className="flex items-center gap-2">
                       <span className="text-[8px] font-black text-primary uppercase tracking-widest">{post.category}</span>
                       <div className="w-1 h-1 rounded-full bg-secondary/10"></div>
                       <span className="text-[8px] font-bold text-secondary/40 uppercase font-mono">{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strategic Discovery Section */}
      <section className="bg-secondary p-12 lg:p-20 rounded-[4rem] text-background relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary/20 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-4 space-y-8">
            <Badge className="bg-primary text-secondary border-none px-5 py-2 rounded-full font-black uppercase text-[10px] tracking-[0.4em]">Section 04</Badge>
            <h2 className="text-4xl lg:text-6xl font-heading leading-tight">High-CPC <br/><span className="text-primary italic">Intelligence</span></h2>
            <p className="text-background/60 text-sm leading-relaxed font-light">
              AI-driven market discovery optimized for premium advertising yields in North American regions. High-density topical clustering.
            </p>
            <Button onClick={fetchMarketInsights} variant="outline" className="rounded-full border-primary/20 text-primary hover:bg-primary/5 h-12 px-8 uppercase text-[10px] font-black tracking-[0.3em]">
               Refresh Market Data
            </Button>
          </div>
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {fetchingInsights ? Array(3).fill(0).map((_, i) => <div key={i} className="h-64 bg-white/5 animate-pulse rounded-[2.5rem]" />) : 
             marketInsights.map((item, i) => (
              <div key={i} className="bg-white/5 border border-white/5 p-8 rounded-[2.5rem] hover:bg-white/10 transition-all group">
                <TrendingUp className="w-8 h-8 text-primary mb-8" />
                <h4 className="text-xl font-heading mb-6 leading-tight group-hover:text-primary transition-colors uppercase tracking-tight">{item.title}</h4>
                <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                   <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">$12 - $75 CPC</span>
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
      <Card className="border border-primary/5 luxury-shadow rounded-[2.5rem] h-full bg-white transition-all overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-5 transform group-hover:rotate-12 transition-all">
          <Icon size={80} className="text-primary" />
        </div>
        <CardContent className="p-8 flex flex-col justify-between h-full relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="w-12 h-12 rounded-2xl bg-secondary/5 flex items-center justify-center border border-primary/5">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            {trend && (
              <Badge variant="outline" className={`text-[10px] font-black px-3 py-1 rounded-full border-none ${
                trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
              }`}>
                {trend}
              </Badge>
            )}
          </div>
          <div>
            <p className="text-[9px] font-black text-secondary/40 uppercase tracking-[0.3em] mb-2">{title}</p>
            <p className="text-4xl font-heading text-secondary tracking-tighter leading-none">{value}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
