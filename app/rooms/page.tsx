import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function RoomSelectionPage() {
  return (
    <div className="container mx-auto py-16">
      <h1 className="text-3xl font-bold mb-8 text-center">Select Room Type</h1>
      <p className="text-lg text-gray-600 text-center mb-8">Choose from 9 different room types for various research experiences</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-center max-w-6xl mx-auto">
        {/* Priority rooms - featured first */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Participant vs LLM Debate</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col flex-1">
            <p className="flex-1 mb-4">1 Participant vs 1 LLM debates on various topics with real-time sentiment tracking.</p>
            <Link href="/chat/llm-vs-confederate">
              <Button className="w-full bg-purple-600 hover:bg-purple-700">Start LLM Debate</Button>
            </Link>
          </CardContent>
        </Card>
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Scotobot</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col flex-1">
            <p className="flex-1 mb-4">Have a conversation with a digital twin of Chief Justice Roberts with no knowledge of the world after August 2024.</p>
            <Link href="/chat/scotobot">
              <Button className="w-full bg-green-600 hover:bg-green-700">Start Scotobot</Button>
            </Link>
          </CardContent>
        </Card>
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Enron Whaling Project</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col flex-1">
            <p className="flex-1 mb-4">Explore insider threat models and whaling attack scenarios with an LLM trained on Enron executive emails.</p>
            <Link href="/chat/enron">
              <Button className="w-full bg-red-600 hover:bg-red-700">Start Enron AI</Button>
            </Link>
          </CardContent>
        </Card>
        
        {/* Additional room types */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>1-on-1 Room</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col flex-1">
            <p className="flex-1 mb-4">Chat with an LLM Assistant in a private session.</p>
            <Link href="/chat?type=1v1">
              <Button className="w-full">Start 1-on-1</Button>
            </Link>
          </CardContent>
        </Card>
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>2 Human Debate</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col flex-1">
            <p className="flex-1 mb-4">1 Participant vs 1 Human Assistant in a debate.</p>
            <Link href="/chat?type=1v1-human">
              <Button className="w-full">Start Human Debate</Button>
            </Link>
          </CardContent>
        </Card>
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>2-on-1 Room</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col flex-1">
            <p className="flex-1 mb-4">1 Participant vs 1 Human Assistant and 1 LLM Assistant in a Debate.</p>
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
            <p className="flex-1 mb-4">Join a room with another user and debate against 4 participants (1 LLM Assistant + 3 users).</p>
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
            <p className="flex-1 mb-4">8 participants (4 humans + 4 LLMs) with random team assignment.</p>
            <Link href="/chat?type=team-vs-team">
              <Button className="w-full">Join Battle</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 