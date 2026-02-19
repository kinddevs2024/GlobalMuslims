type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
};

export function StatCard({ title, value, subtitle }: StatCardProps) {
  return (
    <div className="glass-card">
      <p className="text-sm text-[#6b7d74]">{title}</p>
      <p className="mt-1 text-3xl font-semibold text-[#0d6b4f]">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-[#7a8d83]">{subtitle}</p>}
    </div>
  );
}
