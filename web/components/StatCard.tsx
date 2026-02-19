type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
};

export function StatCard({ title, value, subtitle }: StatCardProps) {
  return (
    <div className="glass-card">
      <p className="text-sm text-white/70">{title}</p>
      <p className="mt-1 text-2xl font-semibold text-accent">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-white/60">{subtitle}</p>}
    </div>
  );
}
