import { useParams, Link, useLocation } from "wouter";
import { useGetFolders } from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { formatCurrency } from "@/lib/expense-processor";
import { ArrowRight, Calendar, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export function YearView() {
  const { year } = useParams();
  const [, navigate] = useLocation();
  const { data: folders, isLoading } = useGetFolders();

  if (isLoading) return (
    <div className="p-8 space-y-8 animate-fade-in-up">
      <div className="h-12 w-64 skeleton mb-4" />
      <div className="h-8 w-96 skeleton mb-8" />
      <div className="h-[300px] w-full skeleton rounded-3xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1,2,3,4,5,6].map(i => <div key={i} className="h-40 skeleton rounded-2xl" />)}
      </div>
    </div>
  );

  const folder = folders?.find(f => f.year === year);
  if (!folder) return <div className="p-8 text-xl font-bold">Year not found.</div>;

  const chartData = folder.months.map(m => ({
    name: m.name.substring(0, 3),
    fullName: m.name,
    monthNum: m.month,
    total: m.total
  }));

  const handleBarClick = (data: any) => {
    if (data?.activePayload?.[0]?.payload?.monthNum) {
      navigate(`/year/${year}/month/${data.activePayload[0].payload.monthNum}`);
    }
  };

  return (
    <div className="p-8 animate-fade-in-up max-w-6xl mx-auto">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">{year} Overview</h1>
            <Badge variant="outline" className="bg-white/5 border-white/10 text-sm py-1 px-3 ml-2">
              <Calendar className="w-3.5 h-3.5 mr-2" /> {folder.expenseCount} Transactions
            </Badge>
          </div>
          <p className="text-muted-foreground text-xl mt-2">
            Total expenses: <span className="text-foreground font-bold">{formatCurrency(folder.totalExpenses)}</span>
          </p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="glass-panel p-8 rounded-[2rem] mb-10 border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
        <h3 className="text-xl font-display font-bold mb-8 flex items-center gap-2">Monthly Spending <span className="text-sm font-normal text-muted-foreground ml-2">(Click bar to view month)</span></h3>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} onClick={handleBarClick} className="cursor-pointer">
              <XAxis dataKey="name" stroke="#888888" fontSize={13} tickLine={false} axisLine={false} dy={10} />
              <YAxis 
                stroke="#888888" 
                fontSize={13} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => `$${value}`}
                dx={-10}
              />
              <Tooltip 
                cursor={{fill: 'rgba(255,255,255,0.05)'}}
                contentStyle={{ 
                  backgroundColor: 'rgba(17, 19, 26, 0.95)', 
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '16px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                  padding: '12px 16px'
                }}
                labelStyle={{ fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}
                itemStyle={{ color: '#34d399', fontWeight: 'bold' }}
                formatter={(value: number) => [formatCurrency(value), "Total Spending"]}
              />
              <Bar dataKey="total" radius={[8, 8, 8, 8]} barSize={40}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill="hsl(142 71% 45%)" className="hover:opacity-80 transition-opacity" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Month Cards */}
      <h3 className="text-2xl font-display font-bold mb-6">Months</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {folder.months.map(m => (
          <Link key={m.month} href={`/year/${year}/month/${m.month}`}>
            <div className="glass-panel p-6 rounded-2xl hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_10px_30px_rgba(34,197,94,0.1)] transition-all duration-300 cursor-pointer group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
                <span className="font-bold text-primary flex items-center gap-2">View Month <ArrowRight className="w-4 h-4" /></span>
              </div>
              
              <div className="flex justify-between items-start mb-6 relative z-10">
                <h4 className="text-2xl font-bold font-display">{m.name}</h4>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              
              <div className="space-y-3 relative z-10">
                <div className="flex justify-between items-end border-b border-white/5 pb-3">
                  <span className="text-muted-foreground text-sm">Total Spend</span>
                  <span className="font-bold text-xl text-emerald-400">{formatCurrency(m.total)}</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-muted-foreground text-sm">Transactions</span>
                  <span className="font-semibold bg-white/10 px-2.5 py-0.5 rounded-lg text-sm">{m.expenseCount}</span>
                </div>
              </div>
              
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary/50 to-primary transform scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
