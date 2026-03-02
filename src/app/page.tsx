/** Home: marketing landing with hero, features, and CTA to dashboard. */

import { LandingNav, LandingHero, LandingFeatures } from "@/components/features/landing";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <LandingNav />
      <main>
        <LandingHero />
        <LandingFeatures />
      </main>
    </div>
  );
}
