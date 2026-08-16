type DashboardCardProps = {
  title: string;
  value: string;
  description: string;
  icon: string;
};

export default function DashboardCard({
  title,
  value,
  description,
  icon,
}: DashboardCardProps) {
  return (
    <div className="dashboardCard">
      <div className="dashboardCardTop">
        <div className="dashboardIcon">{icon}</div>
      </div>

      <h3>{title}</h3>
      <strong>{value}</strong>
      <p>{description}</p>
    </div>
  );
}