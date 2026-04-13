import { Card } from "../ui/card";
import { LucideIcon } from "lucide-react";
import { motion } from "motion/react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: LucideIcon;
  trend?: "up" | "down";
  chart?: React.ReactNode;
}

export function StatCard({ title, value, change, icon: Icon, trend, chart }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {change && (
              <div className={`flex items-center gap-1 text-sm ${
                trend === "up" ? "text-secondary" : "text-destructive"
              }`}>
                <span>{change}</span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-4">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            {chart && <div className="w-24">{chart}</div>}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
