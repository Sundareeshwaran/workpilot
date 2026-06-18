import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

export default function RevenueChart() {
  return (
    <Card className="w-full mt-4">
      <CardHeader>
        <CardTitle>Revenue Board</CardTitle>
        <CardDescription>Track Your Income and Expenses</CardDescription>
      </CardHeader>
      <CardContent></CardContent>
    </Card>
  );
}
