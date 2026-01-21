import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { statsApi, productsApi } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, Users, DollarSign, Package, Loader2 } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { useSettings, formatCurrency } from '@/lib/settings';
import { useI18n } from '@/lib/i18n';

export default function DashboardPage() {
  const { currency } = useSettings();
  const { t } = useI18n();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: () => statsApi.getSales(7),
  });

  const { data: weeklyData = [], isLoading: weeklyLoading } = useQuery({
    queryKey: ['stats-weekly'],
    queryFn: statsApi.getWeekly,
  });

  const { data: categoryData = [], isLoading: categoryLoading } = useQuery({
    queryKey: ['stats-categories'],
    queryFn: statsApi.getCategories,
  });

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: productsApi.getAll,
  });

  const totalRevenue = stats?.total ? parseFloat(stats.total) : 0;
  const transactionCount = stats?.count || 0;
  const avgSale = transactionCount > 0 ? totalRevenue / transactionCount : 0;
  const lowStockCount = products.filter((p: any) => p.stock < 20).length;

  const StatCard = ({ title, value, sub, icon: Icon, color }: any) => (
    <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all">
      <div className={`h-2 w-full ${color}`} />
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
             <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
             <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
          </div>
          <div className={`p-3 rounded-xl bg-slate-50 ${color.replace('bg-', 'text-')}`}>
            <Icon size={24} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
          <TrendingUp size={12} className="text-green-500" />
          <span className="text-green-600 font-medium">{sub}</span>
        </p>
      </CardContent>
    </Card>
  );

  const isLoading = statsLoading || productsLoading || weeklyLoading || categoryLoading;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t('dashboard.title')}</h1>
          <p className="text-slate-500 mt-2">{t('dashboard.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title={t('dashboard.total_revenue')} 
            value={formatCurrency(totalRevenue, currency)} 
            sub={t('dashboard.last_7_days')} 
            icon={DollarSign} 
            color="bg-primary" 
          />
          <StatCard 
            title={t('dashboard.transactions')} 
            value={transactionCount.toString()} 
            sub={t('dashboard.last_7_days')} 
            icon={Package} 
            color="bg-blue-500" 
          />
          <StatCard 
            title={t('dashboard.low_stock')} 
            value={lowStockCount.toString()} 
            sub={t('dashboard.need_restock')} 
            icon={Users} 
            color="bg-orange-500" 
          />
          <StatCard 
            title={t('dashboard.avg_sale')} 
            value={formatCurrency(avgSale, currency)} 
            sub={t('dashboard.per_transaction')} 
            icon={TrendingUp} 
            color="bg-emerald-500" 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <Card className="border-none shadow-md">
             <CardHeader>
               <CardTitle>{t('dashboard.weekly_revenue')}</CardTitle>
               <CardDescription>{t('dashboard.weekly_desc')}</CardDescription>
             </CardHeader>
             <CardContent>
               <div className="h-[300px] w-full">
                 {weeklyData.length > 0 ? (
                   <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={weeklyData}>
                       <defs>
                         <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                           <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                         </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} dy={10} />
                       <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                       <Tooltip 
                         contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                         formatter={(value: number) => [formatCurrency(value, currency), 'Penjualan']}
                       />
                       <Area type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                     </AreaChart>
                   </ResponsiveContainer>
                 ) : (
                   <div className="flex items-center justify-center h-full text-slate-400">
                     {t('dashboard.no_data')}
                   </div>
                 )}
               </div>
             </CardContent>
           </Card>

           <Card className="border-none shadow-md">
             <CardHeader>
               <CardTitle>{t('dashboard.top_products')}</CardTitle>
               <CardDescription>{t('dashboard.top_products_desc')}</CardDescription>
             </CardHeader>
             <CardContent>
               <div className="h-[300px] w-full">
                 {categoryData.length > 0 ? (
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={categoryData} layout="vertical">
                       <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                       <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                       <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} width={100} />
                       <Tooltip 
                          cursor={{fill: '#f8fafc'}}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          formatter={(value: number) => [formatCurrency(value, currency), 'Total']}
                       />
                       <Bar dataKey="sales" fill="hsl(var(--sidebar))" radius={[0, 4, 4, 0]} barSize={24} />
                     </BarChart>
                   </ResponsiveContainer>
                 ) : (
                   <div className="flex items-center justify-center h-full text-slate-400">
                     {t('dashboard.no_data')}
                   </div>
                 )}
               </div>
             </CardContent>
           </Card>
        </div>
      </div>
    </MainLayout>
  );
}
