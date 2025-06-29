import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function RoomSelectionPage() {
  return (
    <div className="container mx-auto py-16">
      <h1 className="text-3xl font-bold mb-8 text-center">Select Room Type</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 justify-center">
        <Card>
          <CardHeader>
            <CardTitle>1-on-1 Room</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Chat with a confederate (LLM) in a private session.</p>
            <Link href="/chat?type=1v1">
              <Button className="mt-4 w-full">Start 1-on-1</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>1v1 Human Room</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Chat with a human confederate in a private session.</p>
            <Link href="/chat?type=1v1-human">
              <Button className="mt-4 w-full">Start 1v1 Human</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>2-on-1 Room</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Join a room with another user and a confederate (LLM).</p>
            <Link href="/chat?type=2v1">
              <Button className="mt-4 w-full">Start 2-on-1</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>2vs4 Room</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Join a room with another user and debate against 4 LLMs (1 confederate + 3 LLM users).</p>
            <Link href="/chat?type=2vs4">
              <Button className="mt-4 w-full">Start 2vs4</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 