import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Badge } from "@/components/ui/badge";

import { Mail, Phone, Globe, FolderKanban, IndianRupee } from "lucide-react";

export default function ClientCard({ client }) {
  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            <Avatar className="size-16 ring-2 ring-primary/20">
              <AvatarImage src="https://api.dicebear.com/10.x/notionists/svg?seed=abc" />
              <AvatarFallback className="text-lg font-bold">AB</AvatarFallback>
            </Avatar>

            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl">{client.companyName}</CardTitle>

                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-700"
                >
                  Active
                </Badge>
              </div>

              <CardDescription>{client.notes}</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Contact Info */}
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="size-4" />
            {client.email}
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="size-4" />
            {client.phone}
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Globe className="size-4" />
            {client.website}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <FolderKanban className="size-4" />
              Projects
            </div>

            <p className="mt-2 text-2xl font-bold">12</p>
          </div>

          <div className="rounded-xl border p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <IndianRupee className="size-4" />
              Revenue
            </div>

            <p className="mt-2 text-2xl font-bold">₹1.2L</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 pt-2">
          <button className="flex-1 rounded-lg bg-primary text-primary-foreground py-2 text-sm font-medium hover:opacity-90 transition">
            View Client
          </button>

          <button className="flex-1 rounded-lg border py-2 text-sm font-medium hover:bg-muted transition">
            Edit
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
