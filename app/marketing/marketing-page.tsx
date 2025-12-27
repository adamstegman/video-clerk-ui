import { Link } from "react-router";
import { FeatureCard } from "./feature-card";
import { LightbulbIcon } from "./lightbulb-icon";
import { AddToListIcon } from "./add-to-list-icon";
import { FilterIcon } from "./filter-icon";

const ICON_CLASSES = "w-6 h-6 md:w-8 md:h-8";

export function MarketingPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 md:py-20 lg:py-24">
        <div className="w-full max-w-4xl lg:max-w-6xl mx-auto text-center space-y-8 md:space-y-12">
          {/* Hero Section */}
          <div className="space-y-6 md:space-y-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-zinc-900 dark:text-zinc-100">
              Video Clerk
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-zinc-700 dark:text-zinc-200 max-w-2xl mx-auto">
              Solve the "what do we watch?" conundrum
            </p>
            <div className="pt-4">
              <Link
                to="/app"
                className="inline-block px-8 py-3 md:px-10 md:py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg text-lg md:text-xl transition-colors shadow-lg hover:shadow-xl"
              >
                Log In
              </Link>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 pt-8 md:pt-12">
            <FeatureCard
              icon={<LightbulbIcon className={ICON_CLASSES} />}
              iconBgColor="bg-yellow-200 dark:bg-yellow-300/20"
              iconTextColor="text-yellow-700 dark:text-yellow-300"
              title='Solve the "what do we watch?" conundrum'
              description="Never waste time deciding what to watch again. Video Clerk helps you make quick, satisfying choices."
            />
            <FeatureCard
              icon={<AddToListIcon className={ICON_CLASSES} />}
              iconBgColor="bg-blue-300 dark:bg-blue-400/20"
              iconTextColor="text-blue-700 dark:text-blue-300"
              title="Add things to watch to your list when you hear about them"
              description="Build your watchlist over time. When someone recommends a show or movie, add it instantly—no decision needed."
            />
            <FeatureCard
              icon={<FilterIcon className={ICON_CLASSES} />}
              iconBgColor="bg-purple-400 dark:bg-purple-500/20"
              iconTextColor="text-purple-700 dark:text-purple-300"
              title="Filter that list based on your mood to find a winner"
              description="When it's time to watch, filter your list by mood, genre, or length. Find the perfect match for right now."
            />
          </div>
        </div>
      </main>
    </div>
  );
}

