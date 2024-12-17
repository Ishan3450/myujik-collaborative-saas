import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Vote, ListMusic } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen items-center">
      <main className="flex flex-col gap-8 mt-4">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-black text-white rounded-xl">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Live Music Streams with Collaborative Playlists
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-300 md:text-xl">
                  Start your own music stream, get song suggestions from
                  listeners, and let the crowd vote for the next track.
                </p>
              </div>
              <div className="space-x-4">
                <Button className="bg-white text-black hover:bg-gray-200">
                  Get Started
                </Button>
                <Button>Learn More</Button>
              </div>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 rounded-xl"
        >
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12">
              Key Features
            </h2>
            <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <Play className="h-12 w-12 mb-4 text-primary" />
                <h3 className="text-xl font-bold mb-2">Live Streaming</h3>
                <p className="text-gray-600">
                  Start your own music stream and share it with the world.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <ListMusic className="h-12 w-12 mb-4 text-primary" />
                <h3 className="text-xl font-bold mb-2">Song Suggestions</h3>
                <p className="text-gray-600">
                  Listeners can suggest songs to add to the playlist.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <Vote className="h-12 w-12 mb-4 text-primary" />
                <h3 className="text-xl font-bold mb-2">Voting System</h3>
                <p className="text-gray-600">
                  Users vote for their favorite songs to play next.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12">
              How It Works
            </h2>
            <ol className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
              <li className="flex flex-col items-center text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white text-xl font-bold mb-4 bg-black">
                  1
                </div>
                <h3 className="text-xl font-bold mb-2">Start a Stream</h3>
                <p className="text-gray-600">
                  Create your music stream and invite listeners.
                </p>
              </li>
              <li className="flex flex-col items-center text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white text-xl font-bold mb-4 bg-black">
                  2
                </div>
                <h3 className="text-xl font-bold mb-2">Suggest Songs</h3>
                <p className="text-gray-600">
                  Listeners suggest songs to add to the playlist.
                </p>
              </li>
              <li className="flex flex-col items-center text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white text-xl font-bold mb-4 bg-black">
                  3
                </div>
                <h3 className="text-xl font-bold mb-2">Vote and Play</h3>
                <p className="text-gray-600">
                  Users vote, and the top song plays automatically.
                </p>
              </li>
            </ol>
          </div>
        </section>

        <section
          id="pricing"
          className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 rounded-xl"
        >
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12">
              Simple Pricing
            </h2>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col p-6 bg-white rounded-lg shadow-lg">
                <h3 className="text-2xl font-bold mb-4">Free</h3>
                <p className="text-4xl font-bold mb-4">
                  $0<span className="text-base font-normal">/month</span>
                </p>
                <ul className="mb-6 space-y-2">
                  <li className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                    1 hour of streaming per day
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                    Up to 50 listeners
                  </li>
                </ul>
                <Button className="mt-auto">Sign Up</Button>
              </div>
              <div className="flex flex-col p-6 bg-white rounded-lg shadow-lg border-2 border-primary">
                <h3 className="text-2xl font-bold mb-4">Pro</h3>
                <p className="text-4xl font-bold mb-4">
                  $19<span className="text-base font-normal">/month</span>
                </p>
                <ul className="mb-6 space-y-2">
                  <li className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                    Unlimited streaming
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                    Up to 500 listeners
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                    Advanced analytics
                  </li>
                </ul>
                <Button className="mt-auto">Start Free Trial</Button>
              </div>
              <div className="flex flex-col p-6 bg-white rounded-lg shadow-lg">
                <h3 className="text-2xl font-bold mb-4">Enterprise</h3>
                <p className="text-4xl font-bold mb-4">Custom</p>
                <ul className="mb-6 space-y-2">
                  <li className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                    Unlimited everything
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                    Dedicated support
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                    Custom integrations
                  </li>
                </ul>
                <Button className="mt-auto">Contact Sales</Button>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-black text-white rounded-xl">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Ready to Start Your Music Stream?
                </h2>
                <p className="mx-auto max-w-[600px] text-gray-300 md:text-xl">
                  Join thousands of music lovers and start your collaborative
                  music journey today.
                </p>
              </div>
              <div className="w-full max-w-sm space-y-2">
                <form className="flex space-x-2">
                  <Input
                    className="max-w-lg flex-1 bg-white text-black"
                    placeholder="Enter your email"
                    type="email"
                  />
                  <Button
                    className="bg-white text-black hover:bg-gray-200"
                    type="submit"
                  >
                    Sign Up
                  </Button>
                </form>
                <p className="text-xs text-gray-400">
                  By signing up, you agree to our{" "}
                  <Link className="underline underline-offset-2" href="#">
                    Terms & Conditions
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500">
          © 2024 Myujik. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
