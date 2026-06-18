/**
 * Reusable Props:
 * title
 * value
 * icon
 * description
 */
import { Users, Briefcase, FileText, IndianRupee } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export default function MetricCard({ title, value, icon, description }) {
  const iconMap = {
    Clients: Users,
    Projects: Briefcase,
    Invoices: FileText,
    Revenue: IndianRupee,
  };

  const Icon = iconMap[icon];
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-muted-foreground mt-2">{description}</p>
      </CardContent>
    </Card>
  );
}
