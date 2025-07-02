import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function RoomSelectionPage() {
  return (
    <div className="container mx-auto py-16">
      <h1 className="text-3xl font-bold mb-8 text-center">Select Room Type</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 justify-center">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>1-on-1 Room</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col flex-1">
            <p className="flex-1 mb-4">Chat with a confederate in a private session.</p>
            <Link href="/chat?type=1v1">
              <Button className="w-full">Start 1-on-1</Button>
            </Link>
          </CardContent>
        </Card>
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>1v1 Confederate</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col flex-1">
            <p className="flex-1 mb-4">Chat with a human confederate in a private session.</p>
            <Link href="/chat?type=1v1-human">
              <Button className="w-full">Start 1v1 Confederate</Button>
            </Link>
          </CardContent>
        </Card>
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>2-on-1 Room</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col flex-1">
            <p className="flex-1 mb-4">Join a room with another user and a confederate.</p>
            <Link href="/chat?type=2v1">
              <Button className="w-full">Start 2-on-1</Button>
            </Link>
          </CardContent>
        </Card>
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>2vs4 Room</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col flex-1">
            <p className="flex-1 mb-4">Join a room with another user and debate against 4 participants (1 confederate + 3 users).</p>
            <Link href="/chat?type=2vs4">
              <Button className="w-full">Start 2vs4</Button>
            </Link>
          </CardContent>
        </Card>
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Team vs Team</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col flex-1">
            <p className="flex-1 mb-4">Red Team vs Blue Team: 8 participants (4 humans + 4 participants) with random team assignment.</p>
            <Link href="/chat?type=team-vs-team">
              <Button className="w-full">Join Battle</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 