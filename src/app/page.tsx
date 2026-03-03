/** Home: marketing landing with hero, features, and CTA to dashboard. */

import { LandingNav, LandingHero, LandingFeatures } from "@/components/features/landing";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-950 text-white">
      <LandingNav />
      <main className="flex-1">
        <LandingHero />
        <LandingFeatures />
      </main>
    </div>
  );
}
