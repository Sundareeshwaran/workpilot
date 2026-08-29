import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { TrendingUp } from "lucide-react";
import ActivityContent from "./activity-content";

export default function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          Stay updated with your latest activities and notifications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ActivityContent />
      </CardContent>
    </Card>
  );
}
