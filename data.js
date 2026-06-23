/* =============================================================================
 * data.js — mock catalog across all five categories.
 *
 * This stands in for real APIs (TMDB + OMDb for film/TV, IGDB/OpenCritic/Steam
 * for games, MAL/AniList for anime, Goodreads/StoryGraph for books). The shape
 * is intentionally close to what those APIs return so the data layer can be
 * swapped without touching the UI or the engine.
 *
 * Posters render as designed duotone gradient cards (the `colors` pair) so the
 * prototype is fully self-contained and works offline. Each item also has an
 * optional `poster` URL slot: when populated with real artwork later, the UI
 * uses it and falls back to the gradient if the image fails to load.
 *
 * `ratings` hold RAW per-source values on each source's native scale — the
 * engine normalizes them. `watch` is keyed by ISO country code and adapts per
 * category (streaming for film/TV, stores for games, retailers for books).
 * ========================================================================== */

export const CATALOG = [
  /* ===== MOVIES =========================================================== */
  {
    id: "movie-dune-2", slug: "dune-part-two", category: "movie",
    title: "Dune: Part Two", year: 2024, certification: "PG-13",
    series: "Dune", seriesIndex: 2,
    genres: ["Sci-Fi", "Adventure"], runtime: "2h 46m",
    colors: ["#c9892f", "#1a0f06"], poster: "assets/dune-part-two-poster.webp", backdrop: "assets/dune-part-two-backdrop.webp", trending: true,
    trailer: "Way9Dexny3w",
    synopsis: "Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family, facing a choice between the love of his life and the fate of the universe.",
    credits: { Director: "Denis Villeneuve", Cast: "Timothée Chalamet, Zendaya, Rebecca Ferguson" },
    ratings: [
      { sourceId: "rt_critic", value: 92, reviewCount: 480 },
      { sourceId: "metacritic_critic", value: 79, reviewCount: 62 },
      { sourceId: "imdb", value: 8.5, reviewCount: 540000 },
      { sourceId: "letterboxd", value: 4.3, reviewCount: 990000 },
      { sourceId: "tmdb", value: 83, reviewCount: 6200 },
      { sourceId: "google", value: 95, reviewCount: 50000 },
    ],
    watch: {
      US: { stream: [{ name: "Max", color: "#5b2bd6", url: "#" }], rentbuy: ["Apple TV", "Prime Video", "Netflix"] },
      GB: { stream: [{ name: "NOW", color: "#00807d", url: "#" }], rentbuy: ["Apple TV", "Prime Video"] },
      AU: { stream: [{ name: "Binge", color: "#e0234e", url: "#" }], rentbuy: ["Apple TV", "Prime Video"] },
    },
  },
  {
    id: "movie-dune-1", slug: "dune-part-one", category: "movie",
    title: "Dune: Part One", year: 2021, certification: "PG-13",
    series: "Dune", seriesIndex: 1,
    genres: ["Sci-Fi", "Adventure"], runtime: "2h 35m",
    colors: ["#b98a4a", "#10141a"], poster: "assets/dune-part-one-poster.webp", backdrop: "assets/dune-part-one-backdrop.webp",
    synopsis: "Paul Atreides, a brilliant and gifted young man born into a great destiny beyond his understanding, must travel to the most dangerous planet in the universe to ensure the future of his family and his people, as malevolent forces explode into conflict over the planet's exclusive supply of the most precious resource in existence.",
    credits: { Director: "Denis Villeneuve", Cast: "Timothée Chalamet, Rebecca Ferguson, Oscar Isaac" },
    ratings: [
      { sourceId: "rt_critic", value: 83, reviewCount: 460 },
      { sourceId: "metacritic_critic", value: 74, reviewCount: 67 },
      { sourceId: "imdb", value: 8.0, reviewCount: 820000 },
      { sourceId: "letterboxd", value: 4.0, reviewCount: 1300000 },
      { sourceId: "tmdb", value: 79, reviewCount: 11000 },
      { sourceId: "google", value: 91, reviewCount: 90000 },
    ],
    watch: {
      US: { stream: [{ name: "Max", color: "#5b2bd6", url: "#" }], rentbuy: ["Apple TV", "Prime Video", "Netflix"] },
      GB: { stream: [{ name: "NOW", color: "#00807d", url: "#" }], rentbuy: ["Apple TV", "Prime Video"] },
    },
  },
  {
    id: "movie-oppenheimer", slug: "oppenheimer", category: "movie",
    title: "Oppenheimer", year: 2023, certification: "R",
    genres: ["Drama", "History"], runtime: "3h 0m",
    colors: ["#c64a2a", "#0a0a0d"], poster: "assets/oppenheimer-poster.webp", backdrop: "assets/oppenheimer-backdrop.webp",
    trailer: "uYPbbksJxIg",
    synopsis: "The story of J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II, and the fallout that defined the rest of his life.",
    credits: { Director: "Christopher Nolan", Cast: "Cillian Murphy, Emily Blunt, Robert Downey Jr." },
    ratings: [
      { sourceId: "rt_critic", value: 93, reviewCount: 510 },
      { sourceId: "metacritic_critic", value: 90, reviewCount: 67 },
      { sourceId: "imdb", value: 8.3, reviewCount: 820000 },
      { sourceId: "letterboxd", value: 4.2, reviewCount: 1100000 },
      { sourceId: "google", value: 93, reviewCount: 70000 },
    ],
    watch: {
      US: { stream: [{ name: "Peacock", color: "#000", url: "#" }], rentbuy: ["Apple TV", "Prime Video"] },
      GB: { stream: [], rentbuy: ["Apple TV", "Prime Video", "Sky Store"] },
    },
  },
  {
    id: "movie-poor-things", slug: "poor-things", category: "movie",
    title: "Poor Things", year: 2023, certification: "R",
    genres: ["Sci-Fi", "Comedy"], runtime: "2h 21m",
    colors: ["#3aa0a0", "#10141f"], poster: "assets/poor-things-poster.webp", backdrop: "assets/poor-things-backdrop.webp", trending: true,
    trailer: "RlbR5N6veqw",
    synopsis: "Brought back to life by an unorthodox scientist, a young woman runs off with a lawyer on a whirlwind adventure across the continents, growing steadfast in her purpose to stand for equality and liberation.",
    credits: { Director: "Yorgos Lanthimos", Cast: "Emma Stone, Mark Ruffalo, Willem Dafoe" },
    ratings: [
      { sourceId: "rt_critic", value: 92, reviewCount: 400 },
      { sourceId: "metacritic_critic", value: 87, reviewCount: 61 },
      { sourceId: "imdb", value: 7.8, reviewCount: 320000 },
      { sourceId: "letterboxd", value: 4.1, reviewCount: 720000 },
      { sourceId: "google", value: 86, reviewCount: 30000 },
    ],
    watch: {
      US: { stream: [{ name: "Hulu", color: "#1ce783", url: "#" }], rentbuy: ["Apple TV", "Prime Video"] },
      GB: { stream: [{ name: "Disney+", color: "#0a2a6b", url: "#" }], rentbuy: ["Apple TV"] },
    },
  },
  {
    id: "movie-spiderverse-2", slug: "across-the-spider-verse", category: "movie", franchiseId: "spider-man",
    title: "Spider-Man: Across the Spider-Verse", year: 2023, certification: "PG",
    genres: ["Animation", "Action"], runtime: "2h 20m",
    colors: ["#d6336c", "#13123a"], poster: "assets/across-the-spider-verse-poster.webp", backdrop: "assets/across-the-spider-verse-backdrop.webp",
    trailer: "shW9i6k8cB0",
    synopsis: "Miles Morales catapults across the multiverse, where he encounters a team of Spider-People charged with protecting its very existence — and clashes with them over how to handle a new threat.",
    credits: { Director: "Joaquim Dos Santos", Cast: "Shameik Moore, Hailee Steinfeld, Oscar Isaac" },
    ratings: [
      { sourceId: "rt_critic", value: 95, reviewCount: 380 },
      { sourceId: "metacritic_critic", value: 86, reviewCount: 60 },
      { sourceId: "imdb", value: 8.5, reviewCount: 430000 },
      { sourceId: "letterboxd", value: 4.4, reviewCount: 880000 },
      { sourceId: "google", value: 97, reviewCount: 60000 },
    ],
    watch: {
      US: { stream: [{ name: "Netflix", color: "#e50914", url: "#" }], rentbuy: ["Apple TV", "Prime Video"] },
    },
  },
  {
    id: "movie-everything", slug: "everything-everywhere-all-at-once", category: "movie",
    title: "Everything Everywhere All at Once", year: 2022, certification: "R",
    genres: ["Sci-Fi", "Comedy"], runtime: "2h 19m",
    colors: ["#e8a13a", "#1b1030"], poster: "assets/everything-everywhere-all-at-once-poster.webp", backdrop: "assets/everything-everywhere-all-at-once-backdrop.webp",
    trailer: "wxN1T1uxQ2g",
    synopsis: "An aging Chinese immigrant is swept up in an insane adventure in which she alone can save existence by exploring other universes and connecting with the lives she could have led.",
    credits: { Director: "Daniels", Cast: "Michelle Yeoh, Ke Huy Quan, Jamie Lee Curtis" },
    ratings: [
      { sourceId: "rt_critic", value: 93, reviewCount: 430 },
      { sourceId: "metacritic_critic", value: 81, reviewCount: 63 },
      { sourceId: "imdb", value: 7.8, reviewCount: 560000 },
      { sourceId: "letterboxd", value: 4.3, reviewCount: 1300000 },
      { sourceId: "google", value: 94, reviewCount: 80000 },
    ],
    watch: {
      US: { stream: [{ name: "Paramount+", color: "#0064ff", url: "#" }], rentbuy: ["Apple TV", "Prime Video"] },
    },
  },

  /* ===== TV SHOWS ========================================================= */
  {
    id: "tv-shogun", slug: "shogun", category: "tv",
    title: "Shōgun", year: 2024, certification: "TV-MA",
    genres: ["Drama", "History"], runtime: "10 episodes",
    colors: ["#9c2a2a", "#0c0a08"], poster: "assets/shogun-poster.webp", backdrop: "assets/shogun-backdrop.webp", trending: true,
    synopsis: "In Japan in the year 1600, at the dawn of a century-defining civil war, Lord Toranaga fights for his life as his enemies on the Council of Regents unite against him, while a mysterious English ship is found marooned in a nearby fishing village.",
    credits: { Creator: "Justin Marks, Rachel Kondo", Cast: "Hiroyuki Sanada, Cosmo Jarvis, Anna Sawai" },
    ratings: [
      { sourceId: "rt_critic", value: 99, reviewCount: 130 },
      { sourceId: "metacritic_critic", value: 89, reviewCount: 38 },
      { sourceId: "imdb", value: 8.7, reviewCount: 180000 },
      { sourceId: "tmdb", value: 86, reviewCount: 1500 },
      { sourceId: "google", value: 96, reviewCount: 20000 },
    ],
    watch: {
      US: { stream: [{ name: "Hulu", color: "#1ce783", url: "#" }, { name: "Disney+", color: "#0a2a6b", url: "#" }], rentbuy: [] },
      GB: { stream: [{ name: "Disney+", color: "#0a2a6b", url: "#" }], rentbuy: [] },
    },
  },
  {
    id: "tv-the-bear", slug: "the-bear", category: "tv",
    title: "The Bear", year: 2022, certification: "TV-MA",
    genres: ["Drama", "Comedy"], runtime: "3 seasons",
    colors: ["#2f6f4f", "#0a0d0b"], poster: "assets/the-bear-poster.webp", backdrop: "assets/the-bear-backdrop.webp",
    synopsis: "A young, award-winning chef from the fine-dining world returns to Chicago to run his late brother's chaotic Italian beef sandwich shop, clashing with the unruly kitchen crew as he fights to transform both the restaurant and himself.",
    credits: { Creator: "Christopher Storer", Cast: "Jeremy Allen White, Ayo Edebiri, Ebon Moss-Bachrach" },
    ratings: [
      { sourceId: "rt_critic", value: 99, reviewCount: 150 },
      { sourceId: "metacritic_critic", value: 90, reviewCount: 40 },
      { sourceId: "imdb", value: 8.6, reviewCount: 210000 },
      { sourceId: "tmdb", value: 82, reviewCount: 1800 },
      { sourceId: "google", value: 95, reviewCount: 25000 },
    ],
    watch: {
      US: { stream: [{ name: "Hulu", color: "#1ce783", url: "#" }], rentbuy: [] },
      GB: { stream: [{ name: "Disney+", color: "#0a2a6b", url: "#" }], rentbuy: [] },
    },
  },
  {
    id: "tv-fallout", slug: "fallout", category: "tv",
    title: "Fallout", year: 2024, certification: "TV-MA",
    genres: ["Sci-Fi", "Adventure"], runtime: "8 episodes",
    colors: ["#3a8f3a", "#0d0f08"], poster: "assets/fallout-poster.webp", backdrop: "assets/fallout-backdrop.webp", trending: true,
    synopsis: "200 years after the apocalypse, the gentle denizens of luxury fallout shelters are forced to return to the irradiated hellscape their ancestors left behind — and are shocked to discover an incredibly complex, gleefully weird, and highly violent universe waiting for them.",
    credits: { Creator: "Geneva Robertson-Dworet, Graham Wagner", Cast: "Ella Purnell, Aaron Moten, Walton Goggins" },
    ratings: [
      { sourceId: "rt_critic", value: 93, reviewCount: 120 },
      { sourceId: "metacritic_critic", value: 81, reviewCount: 34 },
      { sourceId: "imdb", value: 8.4, reviewCount: 230000 },
      { sourceId: "tmdb", value: 82, reviewCount: 2100 },
      { sourceId: "google", value: 94, reviewCount: 30000 },
    ],
    watch: {
      US: { stream: [{ name: "Prime Video", color: "#00a8e1", url: "#" }], rentbuy: [] },
      GB: { stream: [{ name: "Prime Video", color: "#00a8e1", url: "#" }], rentbuy: [] },
    },
  },
  {
    id: "tv-succession", slug: "succession", category: "tv",
    title: "Succession", year: 2018, certification: "TV-MA",
    genres: ["Drama"], runtime: "4 seasons",
    colors: ["#6b5b3a", "#0c0b08"], poster: "assets/succession-poster.webp", backdrop: "assets/succession-backdrop.webp",
    synopsis: "The Roy family controls one of the biggest media and entertainment conglomerates in the world. As their ageing patriarch's health declines, each of his children jockeys for control of the empire.",
    credits: { Creator: "Jesse Armstrong", Cast: "Brian Cox, Jeremy Strong, Sarah Snook" },
    ratings: [
      { sourceId: "rt_critic", value: 94, reviewCount: 200 },
      { sourceId: "metacritic_critic", value: 89, reviewCount: 45 },
      { sourceId: "imdb", value: 8.9, reviewCount: 250000 },
      { sourceId: "tmdb", value: 82, reviewCount: 3000 },
      { sourceId: "google", value: 93, reviewCount: 28000 },
    ],
    watch: {
      US: { stream: [{ name: "Max", color: "#5b2bd6", url: "#" }], rentbuy: ["Apple TV", "Prime Video"] },
      GB: { stream: [{ name: "NOW", color: "#00807d", url: "#" }], rentbuy: ["Apple TV"] },
    },
  },
  {
    id: "tv-severance", slug: "severance", category: "tv",
    title: "Severance", year: 2022, certification: "TV-MA",
    genres: ["Sci-Fi", "Thriller"], runtime: "2 seasons",
    colors: ["#2a4a6f", "#080b12"], poster: "assets/severance-poster.webp", backdrop: "assets/severance-backdrop.webp", trending: true,
    synopsis: "Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives. When a mysterious colleague appears outside of work, it begins a journey to discover the truth about their jobs.",
    credits: { Creator: "Dan Erickson", Cast: "Adam Scott, Britt Lower, Patricia Arquette" },
    ratings: [
      { sourceId: "rt_critic", value: 97, reviewCount: 120 },
      { sourceId: "metacritic_critic", value: 83, reviewCount: 36 },
      { sourceId: "imdb", value: 8.7, reviewCount: 250000 },
      { sourceId: "tmdb", value: 84, reviewCount: 2400 },
      { sourceId: "google", value: 95, reviewCount: 22000 },
    ],
    watch: {
      US: { stream: [{ name: "Apple TV+", color: "#000", url: "#" }], rentbuy: [] },
      GB: { stream: [{ name: "Apple TV+", color: "#000", url: "#" }], rentbuy: [] },
    },
  },
  {
    id: "tv-breaking-bad", slug: "breaking-bad", category: "tv",
    title: "Breaking Bad", year: 2008, certification: "TV-MA",
    series: "Breaking Bad Universe", seriesIndex: 1,
    genres: ["Drama", "Crime"], runtime: "5 seasons",
    colors: ["#6f8a2a", "#0c0f0a"], poster: "assets/breaking-bad-poster.webp", backdrop: "assets/breaking-bad-backdrop.webp",
    synopsis: "A struggling high-school chemistry teacher, diagnosed with terminal lung cancer, teams with a former student to manufacture and sell crystal meth to secure his family's future — and is gradually transformed into a ruthless kingpin of the drug trade.",
    credits: { Creator: "Vince Gilligan", Cast: "Bryan Cranston, Aaron Paul, Anna Gunn" },
    ratings: [
      { sourceId: "rt_critic", value: 96, reviewCount: 220 },
      { sourceId: "metacritic_critic", value: 87, reviewCount: 95 },
      { sourceId: "imdb", value: 9.5, reviewCount: 2200000 },
      { sourceId: "tmdb", value: 89, reviewCount: 14000 },
      { sourceId: "google", value: 98, reviewCount: 120000 },
    ],
    watch: {
      US: { stream: [{ name: "Netflix", color: "#e50914", url: "#" }], rentbuy: ["Apple TV", "Prime Video"] },
      GB: { stream: [{ name: "Netflix", color: "#e50914", url: "#" }], rentbuy: ["Apple TV", "Prime Video"] },
    },
  },
  {
    id: "tv-better-call-saul", slug: "better-call-saul", category: "tv",
    title: "Better Call Saul", year: 2015, certification: "TV-MA",
    series: "Breaking Bad Universe", seriesIndex: 2,
    genres: ["Drama", "Crime"], runtime: "6 seasons",
    colors: ["#3a6a9c", "#0a0d12"], poster: "assets/better-call-saul-poster.webp", backdrop: "assets/better-call-saul-backdrop.webp",
    synopsis: "The trials and tribulations of small-time lawyer Jimmy McGill in the years leading up to his fateful run-in with Walter White and Jesse Pinkman, charting his transformation into the morally compromised attorney Saul Goodman.",
    credits: { Creator: "Vince Gilligan, Peter Gould", Cast: "Bob Odenkirk, Rhea Seehorn, Jonathan Banks" },
    ratings: [
      { sourceId: "rt_critic", value: 98, reviewCount: 180 },
      { sourceId: "metacritic_critic", value: 86, reviewCount: 70 },
      { sourceId: "imdb", value: 8.9, reviewCount: 600000 },
      { sourceId: "tmdb", value: 87, reviewCount: 5200 },
      { sourceId: "google", value: 97, reviewCount: 45000 },
    ],
    watch: {
      US: { stream: [{ name: "Netflix", color: "#e50914", url: "#" }], rentbuy: ["Apple TV", "Prime Video"] },
      GB: { stream: [{ name: "Netflix", color: "#e50914", url: "#" }], rentbuy: ["Apple TV", "Prime Video"] },
    },
  },

  /* ===== GAMES ============================================================ */
  {
    id: "game-bg3", slug: "baldurs-gate-3", category: "game",
    title: "Baldur's Gate 3", year: 2023, certification: "M",
    genres: ["RPG", "Strategy"], runtime: "PC, PS5, Xbox",
    colors: ["#b03a2e", "#0d0a14"], poster: "assets/baldurs-gate-3-poster.jpg", backdrop: "assets/baldurs-gate-3-backdrop.jpg", trending: true,
    synopsis: "Gather your party and return to the Forgotten Realms in a tale of fellowship and betrayal, sacrifice and survival, and the lure of absolute power. Mysterious abilities are awakening inside you as you fight to resist a corruption that threatens to remake you.",
    credits: { Developer: "Larian Studios", Platforms: "PC, PlayStation 5, Xbox Series X/S" },
    ratings: [
      { sourceId: "opencritic", value: 96, reviewCount: 180 },
      { sourceId: "metacritic_critic", value: 96, reviewCount: 120 },
      { sourceId: "steam", value: 96, reviewCount: 720000 },
      { sourceId: "igdb", value: 93, reviewCount: 1400 },
    ],
    watch: {
      US: { stream: [{ name: "Steam", color: "#1b2838", url: "#" }], rentbuy: ["PS Store", "Xbox", "GOG"] },
      GB: { stream: [{ name: "Steam", color: "#1b2838", url: "#" }], rentbuy: ["PS Store", "Xbox", "GOG"] },
    },
  },
  {
    id: "game-elden-ring", slug: "elden-ring", category: "game",
    title: "Elden Ring", year: 2022, certification: "M",
    genres: ["Action RPG"], runtime: "PC, PS5, Xbox",
    colors: ["#c79a3a", "#0c0a08"], poster: "assets/elden-ring-poster.jpg", backdrop: "assets/elden-ring-backdrop.jpg", trending: true,
    synopsis: "Rise, Tarnished, and be guided by grace to brandish the power of the Elden Ring and become an Elden Lord in the Lands Between — a vast world where open fields and huge dungeons are seamlessly connected.",
    credits: { Developer: "FromSoftware", Platforms: "PC, PlayStation 5, Xbox Series X/S" },
    ratings: [
      { sourceId: "opencritic", value: 95, reviewCount: 200 },
      { sourceId: "metacritic_critic", value: 96, reviewCount: 130 },
      { sourceId: "steam", value: 92, reviewCount: 720000 },
      { sourceId: "igdb", value: 92, reviewCount: 2200 },
    ],
    watch: {
      US: { stream: [{ name: "Steam", color: "#1b2838", url: "#" }], rentbuy: ["PS Store", "Xbox"] },
    },
  },
  {
    id: "game-zelda-totk", slug: "tears-of-the-kingdom", category: "game",
    title: "The Legend of Zelda: Tears of the Kingdom", year: 2023, certification: "E10+",
    genres: ["Adventure"], runtime: "Nintendo Switch",
    colors: ["#3a8fa0", "#0a1014"], poster: "assets/tears-of-the-kingdom-poster.jpg", backdrop: "assets/tears-of-the-kingdom-backdrop.jpg",
    synopsis: "An epic adventure across the land and skies of Hyrule awaits. Explore floating islands and battle threatening foes with powerful new abilities to craft, build, and fuse your way through the kingdom.",
    credits: { Developer: "Nintendo EPD", Platforms: "Nintendo Switch" },
    ratings: [
      { sourceId: "opencritic", value: 96, reviewCount: 170 },
      { sourceId: "metacritic_critic", value: 96, reviewCount: 130 },
      { sourceId: "igdb", value: 91, reviewCount: 1200 },
    ],
    watch: {
      US: { stream: [{ name: "eShop", color: "#e60012", url: "#" }], rentbuy: ["Nintendo eShop"] },
    },
  },
  {
    id: "game-bg-spiderman2", slug: "marvels-spider-man-2", category: "game", franchiseId: "spider-man",
    title: "Marvel's Spider-Man 2", year: 2023, certification: "T",
    series: "Marvel's Spider-Man", seriesIndex: 3,
    genres: ["Action Adventure"], runtime: "PlayStation 5",
    colors: ["#c0392b", "#0b0d1a"], poster: "assets/marvels-spider-man-2-poster.jpg", backdrop: "assets/marvels-spider-man-2-backdrop.jpg",
    synopsis: "Spider-Men Peter Parker and Miles Morales return for an exhilarating new adventure, swinging across Marvel's New York while facing the ultimate test of strength against the symbiote and the menace of Venom.",
    credits: { Developer: "Insomniac Games", Platforms: "PlayStation 5" },
    ratings: [
      { sourceId: "opencritic", value: 90, reviewCount: 160 },
      { sourceId: "metacritic_critic", value: 90, reviewCount: 130 },
      { sourceId: "igdb", value: 88, reviewCount: 900 },
    ],
    watch: {
      US: { stream: [{ name: "PS Store", color: "#0070d1", url: "#" }], rentbuy: ["PS Store"] },
    },
  },
  {
    id: "game-spiderman-1", slug: "marvels-spider-man", category: "game", franchiseId: "spider-man",
    title: "Marvel's Spider-Man", year: 2018, certification: "T",
    series: "Marvel's Spider-Man", seriesIndex: 1,
    genres: ["Action Adventure"], runtime: "PlayStation 4",
    colors: ["#c0392b", "#0b0d1a"], poster: "assets/marvels-spider-man-poster.jpg", backdrop: "assets/marvels-spider-man-backdrop.jpg",
    synopsis: "Starring an experienced Peter Parker, this blockbuster open-world adventure sends Spider-Man swinging across a vast and dynamic New York City. As Peter balances the chaos of his personal life and his life as the hero, a brutal new villain threatens to destroy everything he holds dear.",
    credits: { Developer: "Insomniac Games", Platforms: "PlayStation 4" },
    ratings: [
      { sourceId: "opencritic", value: 87, reviewCount: 130 },
      { sourceId: "metacritic_critic", value: 87, reviewCount: 110 },
      { sourceId: "steam", value: 92, reviewCount: 90000 },
      { sourceId: "igdb", value: 86, reviewCount: 1200 },
    ],
    watch: {
      US: { stream: [{ name: "PS Store", color: "#0070d1", url: "#" }], rentbuy: ["PS Store", "Steam"] },
    },
  },
  {
    id: "game-spiderman-miles", slug: "marvels-spider-man-miles-morales", category: "game", franchiseId: "spider-man",
    title: "Marvel's Spider-Man: Miles Morales", year: 2020, certification: "T",
    series: "Marvel's Spider-Man", seriesIndex: 2,
    genres: ["Action Adventure"], runtime: "PlayStation 5, PlayStation 4",
    colors: ["#9c2a3a", "#0a0d16"], poster: "assets/marvels-spider-man-miles-morales-poster.jpg", backdrop: "assets/marvels-spider-man-miles-morales-backdrop.jpg",
    synopsis: "Teenager Miles Morales is adjusting to his new home while following in the footsteps of his mentor, Peter Parker, as the new Spider-Man. When a fierce power struggle threatens to destroy his neighbourhood, Miles discovers he has incredible new powers and must rise to own the mantle.",
    credits: { Developer: "Insomniac Games", Platforms: "PlayStation 5, PlayStation 4" },
    ratings: [
      { sourceId: "opencritic", value: 85, reviewCount: 140 },
      { sourceId: "metacritic_critic", value: 85, reviewCount: 120 },
      { sourceId: "steam", value: 90, reviewCount: 40000 },
      { sourceId: "igdb", value: 84, reviewCount: 700 },
    ],
    watch: {
      US: { stream: [{ name: "PS Store", color: "#0070d1", url: "#" }], rentbuy: ["PS Store", "Steam"] },
    },
  },
  {
    id: "game-gow-ragnarok", slug: "god-of-war-ragnarok", category: "game",
    title: "God of War Ragnarök", year: 2022, certification: "M",
    genres: ["Action Adventure"], runtime: "PC, PS5, PS4",
    colors: ["#3a5a7a", "#0a0c12"], poster: "assets/god-of-war-ragnarok-poster.jpg", backdrop: "assets/god-of-war-ragnarok-backdrop.jpg", trending: true,
    synopsis: "Kratos and Atreus journey through the Nine Realms in search of answers as Asgardian forces prepare for a prophesied battle that will end the world. Together they face the wrath of the gods on the road to Ragnarök.",
    credits: { Developer: "Santa Monica Studio", Platforms: "PC, PlayStation 5, PlayStation 4" },
    ratings: [
      { sourceId: "opencritic", value: 94, reviewCount: 190 },
      { sourceId: "metacritic_critic", value: 94, reviewCount: 130 },
      { sourceId: "steam", value: 96, reviewCount: 60000 },
      { sourceId: "igdb", value: 90, reviewCount: 800 },
    ],
    watch: {
      US: { stream: [{ name: "Steam", color: "#1b2838", url: "#" }], rentbuy: ["PS Store", "Epic"] },
    },
  },

  /* ===== BOOKS ============================================================ */
  {
    id: "book-project-hail-mary", slug: "project-hail-mary", category: "book",
    title: "Project Hail Mary", year: 2021, certification: "",
    genres: ["Sci-Fi"], runtime: "496 pages",
    colors: ["#2a6f9c", "#08101a"], poster: "assets/project-hail-mary-poster.jpg", trending: true,
    synopsis: "Ryland Grace is the sole survivor on a desperate, last-chance mission — and if he fails, humanity and the Earth itself will perish. Except he can't remember that, or even his own name. Slowly, he pieces together the truth: he's been asleep for a very, very long time.",
    credits: { Author: "Andy Weir", Publisher: "Ballantine Books" },
    ratings: [
      { sourceId: "goodreads", value: 4.5, reviewCount: 1100000 },
      { sourceId: "storygraph", value: 4.5, reviewCount: 90000 },
    ],
    watch: {
      US: { stream: [{ name: "Kindle", color: "#232f3e", url: "#" }], rentbuy: ["Audible", "Apple Books", "Libraries"] },
    },
  },
  {
    id: "book-the-midnight-library", slug: "the-midnight-library", category: "book",
    title: "The Midnight Library", year: 2020, certification: "",
    genres: ["Fiction", "Fantasy"], runtime: "304 pages",
    colors: ["#2a6f5f", "#0a1311"], poster: "assets/the-midnight-library-poster.jpg",
    synopsis: "Between life and death there is a library, and within it the shelves go on forever. Every book provides a chance to try another life you could have lived — to see how things would be if you had made other choices.",
    credits: { Author: "Matt Haig", Publisher: "Canongate Books" },
    ratings: [
      { sourceId: "goodreads", value: 4.0, reviewCount: 1500000 },
      { sourceId: "storygraph", value: 3.9, reviewCount: 110000 },
    ],
    watch: {
      US: { stream: [{ name: "Kindle", color: "#232f3e", url: "#" }], rentbuy: ["Audible", "Apple Books", "Libraries"] },
    },
  },
  {
    id: "book-fourth-wing", slug: "fourth-wing", category: "book",
    title: "Fourth Wing", year: 2023, certification: "",
    series: "The Empyrean", seriesIndex: 1,
    genres: ["Fantasy", "Romance"], runtime: "528 pages",
    colors: ["#8a2e4a", "#0e0a0c"], poster: "assets/fourth-wing-poster.jpg", trending: true,
    synopsis: "Twenty-year-old Violet Sorrengail is forced to join the deadly riders quadrant of an elite war college for dragon riders, where the friends she makes are few and the death toll is high. With fewer dragons than candidates, most cadets won't survive.",
    credits: { Author: "Rebecca Yarros", Publisher: "Entangled: Red Tower" },
    ratings: [
      { sourceId: "goodreads", value: 4.6, reviewCount: 980000 },
      { sourceId: "storygraph", value: 4.3, reviewCount: 120000 },
    ],
    watch: {
      US: { stream: [{ name: "Kindle", color: "#232f3e", url: "#" }], rentbuy: ["Audible", "Apple Books", "Libraries"] },
    },
  },
  {
    id: "book-tomorrow", slug: "tomorrow-and-tomorrow", category: "book",
    title: "Tomorrow, and Tomorrow, and Tomorrow", year: 2022, certification: "",
    genres: ["Fiction"], runtime: "416 pages",
    colors: ["#3a5a9c", "#080c16"], poster: "assets/tomorrow-poster.jpg",
    synopsis: "Two friends — often in love, but never lovers — come together as creative partners in the world of video game design, where success brings them fame, joy, tragedy, duplicity, and, ultimately, a kind of immortality.",
    credits: { Author: "Gabrielle Zevin", Publisher: "Knopf" },
    ratings: [
      { sourceId: "goodreads", value: 4.2, reviewCount: 800000 },
      { sourceId: "storygraph", value: 4.2, reviewCount: 95000 },
    ],
    watch: {
      US: { stream: [{ name: "Kindle", color: "#232f3e", url: "#" }], rentbuy: ["Audible", "Apple Books", "Libraries"] },
    },
  },
  {
    id: "book-iron-flame", slug: "iron-flame", category: "book",
    title: "Iron Flame", year: 2023, certification: "",
    series: "The Empyrean", seriesIndex: 2,
    genres: ["Fantasy", "Romance"], runtime: "640 pages",
    colors: ["#6f2a3a", "#0e0a0c"], poster: "assets/iron-flame-poster.jpg", trending: true,
    synopsis: "Everyone expected Violet Sorrengail to die during her first year at Basgiath War College — but now the real test begins under a brutal new leadership intent on breaking her. With the world on the brink of war, she must keep the dragons' secrets and her own.",
    credits: { Author: "Rebecca Yarros", Publisher: "Entangled: Red Tower" },
    ratings: [
      { sourceId: "goodreads", value: 4.3, reviewCount: 600000 },
      { sourceId: "storygraph", value: 4.1, reviewCount: 70000 },
    ],
    watch: {
      US: { stream: [{ name: "Kindle", color: "#232f3e", url: "#" }], rentbuy: ["Audible", "Apple Books", "Libraries"] },
    },
  },
];

/* Country metadata for the Where-to-Watch selector (flag + label). */
export const COUNTRIES = {
  US: { flag: "🇺🇸", label: "United States" },
  GB: { flag: "🇬🇧", label: "United Kingdom" },
  AU: { flag: "🇦🇺", label: "Australia" },
};

/* Cast lists (name + character) keyed by slug. Photos are optional — when a
 * `photo` path is absent the UI renders an initials avatar. Merged into the
 * catalog below so item objects keep a single shape (`item.cast`). */
const CAST = {
  "dune-part-two": [
    { name: "Timothée Chalamet", character: "Paul Atreides" },
    { name: "Zendaya", character: "Chani" },
    { name: "Rebecca Ferguson", character: "Lady Jessica" },
    { name: "Javier Bardem", character: "Stilgar" },
    { name: "Austin Butler", character: "Feyd-Rautha" },
    { name: "Florence Pugh", character: "Princess Irulan" },
  ],
  "oppenheimer": [
    { name: "Cillian Murphy", character: "J. Robert Oppenheimer" },
    { name: "Emily Blunt", character: "Kitty Oppenheimer" },
    { name: "Matt Damon", character: "Leslie Groves" },
    { name: "Robert Downey Jr.", character: "Lewis Strauss" },
    { name: "Florence Pugh", character: "Jean Tatlock" },
  ],
  "poor-things": [
    { name: "Emma Stone", character: "Bella Baxter" },
    { name: "Mark Ruffalo", character: "Duncan Wedderburn" },
    { name: "Willem Dafoe", character: "Dr. Godwin Baxter" },
    { name: "Ramy Youssef", character: "Max McCandles" },
  ],
  "across-the-spider-verse": [
    { name: "Shameik Moore", character: "Miles Morales" },
    { name: "Hailee Steinfeld", character: "Gwen Stacy" },
    { name: "Oscar Isaac", character: "Miguel O'Hara" },
    { name: "Jake Johnson", character: "Peter B. Parker" },
  ],
  "everything-everywhere-all-at-once": [
    { name: "Michelle Yeoh", character: "Evelyn Wang" },
    { name: "Ke Huy Quan", character: "Waymond Wang" },
    { name: "Jamie Lee Curtis", character: "Deirdre Beaubeirdre" },
    { name: "Stephanie Hsu", character: "Joy Wang" },
  ],
  "shogun": [
    { name: "Hiroyuki Sanada", character: "Lord Toranaga" },
    { name: "Cosmo Jarvis", character: "John Blackthorne" },
    { name: "Anna Sawai", character: "Toda Mariko" },
  ],
  "the-bear": [
    { name: "Jeremy Allen White", character: "Carmy Berzatto" },
    { name: "Ayo Edebiri", character: "Sydney Adamu" },
    { name: "Ebon Moss-Bachrach", character: "Richie Jerimovich" },
  ],
  "fallout": [
    { name: "Ella Purnell", character: "Lucy MacLean" },
    { name: "Aaron Moten", character: "Maximus" },
    { name: "Walton Goggins", character: "The Ghoul" },
  ],
  "succession": [
    { name: "Brian Cox", character: "Logan Roy" },
    { name: "Jeremy Strong", character: "Kendall Roy" },
    { name: "Sarah Snook", character: "Shiv Roy" },
  ],
  "severance": [
    { name: "Adam Scott", character: "Mark Scout" },
    { name: "Britt Lower", character: "Helly R." },
    { name: "Patricia Arquette", character: "Harmony Cobel" },
  ],
};
CATALOG.forEach((it) => { if (CAST[it.slug]) it.cast = CAST[it.slug]; });

export function getItem(slug) {
  return CATALOG.find((i) => i.slug === slug) || null;
}

export function itemsByCategory(category) {
  return CATALOG.filter((i) => i.category === category);
}
