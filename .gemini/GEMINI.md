# Design Document: "Video Clerk"

### 1\. The Core Concept

A mobile-first web application that solves the "what do we watch?" conundrum. It separates the **Discovery Phase** (adding things to the list when you hear about them) from the **Decision Phase** (filtering that list based on current mood to find a winner).

### 2\. Tech Stack

* **Frontend:** React (great ecosystem for swipe components) + Tailwind CSS (fast styling).
* **Swipe Logic:** `motion` for smooth, physics-based gestures.
* **Backend/Database:** Supabase (Free tier). We need a real-time database so the list persists across devices.
* **Data Source:** **The Movie Database (TMDB) API**. It is free, authoritative, and provides posters, runtime, genres, and ratings.

#### react-router Features

- 🚀 Server-side rendering (disabled)
- ⚡️ Hot Module Replacement (HMR)
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling
- 📖 [React Router docs](https://reactrouter.com/)

#### Design practices

* Use responsive design: make it work on small screens by default, then add Tailwind CSS classes that give things a little more space on medium or large screens.
* The primary color is electric indigo, `indigo-500` in Tailwind CSS. According to [the Material color tool](https://m2.material.io/inline-tools/color/), that also leads to the following colors:
  * Complementary: `#f1ef63` (approx. `yellow-200`)
  * Analagous:
    * `#63acf1` (approx. `blue-300`)
    * `#a863f1` (approx. `purple-400`)
  * Triadic:
    * `#ef63f1` (approx. `fuchsia-300`)
    * `#f16365` (approx. `red-400`)
* Backgrounds, dark mode foregrounds, and other muted colors are based on `zinc`

#### Coding practices

* After modifying the routes, run `npm run typecheck` to generate types.
* Use container components for things like API requests, and keep presentational components pure.
* Keep Components Small and Focused: A component should ideally do one thing well. Large, “God components” are hard to test and maintain. Split big components into smaller, reusable ones.
* When rendering a context, do not use `.Provider` - this is now legacy. Render the context directly, e.g. `<TMDBAPIContext></TMDBAPIContext>`.

#### Testing practices

* All new pages, features, classes, public methods, etc. must be tested.
  * Create unit tests for classes and public methods
  * Create interaction tests for pages and features
* Write tests in a spec style, e.g. `it('does something')` with a verb and then the expected effect. Do not start tests with "should."
* After making changes, run `npm test` to validate your changes.

-----

### 3\. Application Architecture

The app has two distinct "modes" or views. A tab bar at the bottom of the screen chooses which view is active.

#### View A: "The Shelf" (Management Mode)

  * **Purpose:** To quickly add movies or shows when someone recommends them, and to see your total backlog.
  * **UI Layout:**
      * **Top Bar:** A search bar connected to the TMDB API.
      * **Action:** When you search and click a movie or show, it saves to your database.
      * **Main Area:** A scrolling list of movie posters/titles you have already saved.
      * **Action:** Tap on a movie or show to edit the tags or remove it from the list.
      * **Tagging:** *Crucial Feature.* Upon saving, a modal pops up asking: "What's the vibe?" You can select standard tags (sourced from TMDB like 'Horror', 'Comedy') or custom tags you create (e.g., 'Brainless', 'Tear-jerker', 'Date Night').

#### View B: "The Stack" (Decision Mode)

  * **Purpose:** To narrow down the list and pick something for *right now*.
  * **UI Layout:**
      * **The Filter (Step 1):** Before seeing cards, you answer 3 quick questions to build the "deck":
        1.  *TV or Movie?*
        2.  *How much time do we have?* (30m / 60m / "Don't care" for TV; 90m / 2hrs / "Don't care" for movies)
        3.  *What's the vibe?* (Select from your tags, e.g., "Light-hearted")
      * **The Swipe (Step 2):** The screen shows a single card (movie poster) taking up 80% of the view with visual hints for the swiping.
          * **Swipe Left:** "Not tonight" (Returns to the pile for another day).
          * **Swipe Right:** "Shortlist" (Adds to the temporary candidates list).
      * **The Podium (Step 3):** Once you have Swiped Right on **3 items**, the swiping stops. The app presents the 3 winners side-by-side. You tap one to declare the winner.

-----

### 4. Relational Database Schema

This schema organizes the information into four related tables: `entries`, `tmdb_details`, `tags`, and the `entry_tags` join table.

#### Table 1: `entries` (The Watchlist)

| Column Name | Data Type | Constraint | Description |
| :--- | :--- | :--- | :--- |
| **id** | SERIAL | PRIMARY KEY | Unique identifier for the entry in your personal list. |
| **title** | VARCHAR(255) | NOT NULL | The title of the movie or show. |
| **tmdb\_id** | INTEGER | UNIQUE, NOT NULL | The unique ID from the TMDB API. Used for linking to `tmdb_details`. |
| **added\_at** | TIMESTAMP | NOT NULL | Date/time the entry was added to the jar. |
| **watched\_at** | TIMESTAMP | NOT NULL | Date/time the entry was added to the jar. |

#### Table 2: `tmdb_details` (The External Data)

| Column Name | Data Type | Constraint | Description |
| :--- | :--- | :--- | :--- |
| **entry\_id** | INTEGER | PRIMARY KEY, FK to `entries(id)` | Links to the main watchlist entry. |
| **is\_movie** | BOOLEAN | NOT NULL | True if movie, False if TV series. |
| **runtime\_minutes** | INTEGER | NULLABLE | Length of the content (total for TV, standard for movie). |
| **poster\_path** | VARCHAR(255) | NULLABLE | The file path for the image poster. FIXME: how is it stored in Supabase? |
| **release\_date** | DATE | NULLABLE | The original release date. |
| **rating** | NUMERIC(3, 1) | NULLABLE | The average rating from TMDB (e.g., 7.8). |

#### Table 3: `tags` (The Vibe Labels)

| Column Name | Data Type | Constraint | Description |
| :--- | :--- | :--- | :--- |
| **id** | SERIAL | PRIMARY KEY | Unique identifier for the tag. |
| **name** | VARCHAR(50) | UNIQUE, NOT NULL | The tag name (e.g., 'light-hearted', 'comedy', 'complex'). |
| **is\_custom** | BOOLEAN | NOT NULL | True for user-created tags, False for TMDB genres. |

#### Table 4: `entry_tags` (The Join Table)

| Column Name | Data Type | Constraint | Description |
| :--- | :--- | :--- | :--- |
| **entry\_id** | INTEGER | PRIMARY KEY, FK to `entries(id)` | Links to the movie/show. |
| **tag\_id** | INTEGER | PRIMARY KEY, FK to `tags(id)` | Links to the tag name. |

> **Note:** The `(entry_id, tag_id)` pair forms the **Composite Primary Key** in the `entry_tags` table, ensuring no duplicate tag can be assigned to the same entry.

-----

### 5\. UI/UX "Vibe Check"

Since this is for personal use, the UI should feel friendly, not corporate.

* **Visual Feedback:**
    * When you swipe right, the card should show a "Thumbs Up" overlay.
    * When you swipe left, the card should show a "Thumbs Down" overlay.
    * When you match 3, throw some confetti (using a library like `canvas-confetti`) to celebrate the decision.
* **The Dashboard (Future Feature):**
    * Add a small **"Toggle Switch"** in the top right corner.
    * *Toggle Off:* "Date Night Mode" (The Tinder Swipe interface).
    * *Toggle On:* "Power User Mode" (A dense table view where you can sort by Rotten Tomatoes score, release date, or manually delete items).

-----

### 6\. Implementation Plan (Step-by-Step)

✅ **Phase 1: The Connector**

  * Get a TMDB API Key.
  * Build a simple page that logs `console.log` results when you type a movie name.

**Phase 2: The Shelf**

  * Set up your database (Firebase/Supabase).
  * Create the ability to "Save" a result from Phase 1 into your database.
  * Display the database list on the screen.

**Phase 3: The Stack**

  * Build the filtering logic: Query your database for `runtime < 100` AND `tag == 'comedy'`.
  * Install `react-tinder-cards` (or similar).
  * Feed the filtered results into the card deck.
  * Create the logic: `if (swipedRightCount === 3) { showWinnerScreen() }`.
