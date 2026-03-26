import Link from "next/link";

import { Radio, Vote, Zap, ListVideoIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/ui/site-footer";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen items-center px-5">
      <main className="flex flex-col gap-8 mt-4">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-black text-white rounded-xl">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <p className="text-sm font-medium uppercase tracking-widest text-neutral-400">
                Realtime · Collaborative · YouTube
              </p>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Stream together. Build the playlist as a group.
                </h1>
                <p className="mx-auto max-w-screen-lg text-gray-300 md:text-xl">
                  Open a stream room, invite people with a link, and suggest tracks via YouTube URLs.
                  Everyone upvotes their favorites and the queue reshuffles live,
                  all synced in real time over WebSockets.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-4 pt-2">
                <Button className="bg-white text-black hover:bg-gray-200" asChild>
                  <Link href="/dashboard">Get started</Link>
                </Button>
                <Button
                  variant="outline"
                  className="border-white/80 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  asChild
                >
                  <Link href="/#how-it-works">How it works</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 rounded-xl"
        >
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-4">
              Built for shared listening
            </h2>
            <p className="text-center text-gray-600 max-w-2xl mx-auto mb-12 md:text-lg">
              Myujik is a live listening room: one queue, many contributors, and
              updates the moment someone suggests a song or changes a vote.
            </p>
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col items-center text-center">
                <Radio className="h-12 w-12 mb-4 text-primary" aria-hidden />
                <h3 className="text-xl font-bold mb-2">Stream rooms</h3>
                <p className="text-gray-600">
                  Create a room and share a link so friends can join the same
                  session, no extra apps required.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <ListVideoIcon className="h-12 w-12 mb-4 text-primary" aria-hidden />
                <h3 className="text-xl font-bold mb-2">YouTube suggestions</h3>
                <p className="text-gray-600">
                  Paste a YouTube link to propose a track. Suggestions feed one
                  collaborative playlist for the room.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <Vote className="h-12 w-12 mb-4 text-primary" aria-hidden />
                <h3 className="text-xl font-bold mb-2">Upvote the queue</h3>
                <p className="text-gray-600">
                  Upvotes reorder the queue so popular picks surface first, ideal
                  when you want the crowd to steer what plays next.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <Zap className="h-12 w-12 mb-4 text-primary" aria-hidden />
                <h3 className="text-xl font-bold mb-2">Live sync</h3>
                <p className="text-gray-600">
                  WebSockets keep votes, queue order, and room state aligned for
                  everyone in real time.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="w-full py-12 md:py-24 lg:py-32 bg-black text-white rounded-xl"
        >
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-6 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Ready to host a room?
                </h2>
                <p className="mx-auto max-w-[600px] text-gray-300 md:text-xl">
                  Sign in to create a stream, share the link, and start building
                  a collaborative queue with your listeners.
                </p>
              </div>
              <Button className="bg-white text-black hover:bg-gray-200" asChild>
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
