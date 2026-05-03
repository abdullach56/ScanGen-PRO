import { useMemo } from 'react';
import { BarChart3, Activity, PieChart, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

interface ScanHistoryItem {
  id: string;
  text: string;
  timestamp: number;
  type: string;
}

interface StatsProps {
  history: ScanHistoryItem[];
}

export default function Stats({ history }: StatsProps) {
  const totalScans = history.length;
  
  const mostScannedType = useMemo(() => {
    if (history.length === 0) return 'N/A';
    const counts = history.reduce((acc, curr) => {
      acc[curr.type] = (acc[curr.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  }, [history]);

  const linksCount = history.filter(h => h.text.startsWith('http')).length;
  const deepLinksCount = history.filter(h => !h.text.startsWith('http') && h.text.includes(':')).length;
  
  const stats = [
    { label: 'Total Scanned', value: totalScans, icon: <Activity className="w-5 h-5" /> },
    { label: 'Most Scanned Type', value: mostScannedType, icon: <PieChart className="w-5 h-5" /> },
    { label: 'Web Links', value: linksCount, icon: <BarChart3 className="w-5 h-5" /> },
    { label: 'Deep Links / Actions', value: deepLinksCount, icon: <TrendingUp className="w-5 h-5" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-hw-accent" />
        </div>
        <span className="text-sm font-sans font-bold text-slate-900">System Stats Dashboard</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-5 rounded-2xl border border-hw-border shadow-sm flex flex-col gap-3"
          >
            <div className="text-hw-accent bg-blue-50 w-10 h-10 rounded-xl flex items-center justify-center">
              {stat.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-xs font-sans text-slate-500 mt-1">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {history.length === 0 && (
        <div className="py-10 text-center opacity-50">
          <p className="text-sm font-sans text-slate-500">No data available yet</p>
        </div>
      )}
    </div>
  );
}
