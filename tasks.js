/* tasks.js — canonical project checklist (the source of truth).
 *
 * The assistant maintains this file via commits: it adds items and sets statuses,
 * but only ever advances something as far as "review" (never "done"/"wontdo").
 * The USER confirms "done" (or "wontdo") in the Studio UI; those taps are stored
 * locally (localStorage overlay) and handed back via the "Export for Claude"
 * button to be baked in here.
 *
 * status: "todo" | "doing" | "review" | "done" | "wontdo"
 * Ids are STABLE, immutable, dotted-slug — they are the join key for the local
 * overlay. Never rederive an id from a renamed title; renaming keeps the old id.
 * Depth is capped at 3 levels (root → child → grandchild).
 */
export const TASKS = [
  {
    id: "foundation", title: "Foundation & engine", status: "done", area: "core",
    children: [
      { id: "foundation.shell", title: "App shell + hash router (landing ⇄ detail ⇄ studio)", status: "done" },
      { id: "foundation.pwa", title: "PWA: installable manifest + offline service worker", status: "done" },
      { id: "foundation.engine", title: "Scoring engine (normalize → aggregate → headline + divergence)", status: "done" },
      { id: "foundation.data", title: "Data layer (catalog, sources registry, config)", status: "done" },
      { id: "foundation.mobile", title: "Mobile-first layout + portrait orientation notice", status: "done" },
    ],
  },
  {
    id: "content", title: "Content & data", status: "doing", area: "data",
    children: [
      { id: "content.catalog", title: "Mock catalog across movies / TV / games / books", status: "done" },
      { id: "content.series", title: "Series & franchise linking (popup, reading order)", status: "done" },
      {
        id: "content.quotes", title: "Homepage quote database", status: "done",
        children: [
          { id: "content.quotes.shuffle", title: "Non-repeating shuffle-bag + tap-to-new", status: "done" },
          { id: "content.quotes.db", title: "460 curated quotes (Coen, Monty Python, Anchorman, Shrek, sitcoms, South Park…)", status: "done" },
        ],
      },
    ],
  },
  {
    id: "homepage", title: "Homepage", status: "doing", area: "homepage",
    children: [
      {
        id: "homepage.backdrop", title: "Backdrop & top blend", status: "review",
        children: [
          { id: "homepage.backdrop.fill", title: "Sampled top-strip colour fill + blend distance", status: "review" },
          { id: "homepage.backdrop.overlay", title: "Defined top colour overlay (scrolls with page)", status: "review" },
        ],
      },
      {
        id: "homepage.logo", title: "Logo wordmark", status: "review",
        children: [
          { id: "homepage.logo.render", title: "CSS-mask fill + real SVG outline + two shadows", status: "review" },
          { id: "homepage.logo.taphbug", title: "Fix outline drift on tap (whole-wordmark hover)", status: "review" },
        ],
      },
      { id: "homepage.quote", title: "Random quote block (style, width, type)", status: "review" },
      { id: "homepage.type", title: "Type & spacing controls baked", status: "review" },
    ],
  },
  {
    id: "detail", title: "Detail (rating) page", status: "review", area: "detail",
    children: [
      { id: "detail.hero", title: "Hero poster + tap-to-zoom", status: "review" },
      { id: "detail.ratings", title: "Critic/user score breakdown + divergence", status: "review" },
      { id: "detail.related", title: "Related-content sections (Same Universe / From the Same Mind / Watch Next…)", status: "review" },
    ],
  },
  {
    id: "studio", title: "Studio (component sandbox)", status: "doing", area: "studio",
    children: [
      {
        id: "studio.core", title: "Core tooling", status: "review",
        children: [
          { id: "studio.core.hub", title: "Hub, routing, pick-mode, zoom loupe", status: "review" },
          { id: "studio.core.picker", title: "Colour picker (gradients, +/- fine controls, manual entry)", status: "review" },
          { id: "studio.core.type", title: "Universal Type editor + curated fonts", status: "review" },
        ],
      },
      {
        id: "studio.editors", title: "Component editors", status: "doing",
        children: [
          { id: "studio.editors.home", title: "Homepage editor (+ backdrop cycle, locked inspect)", status: "review" },
          { id: "studio.editors.logo", title: "Logo editors (front page + header)", status: "review" },
          { id: "studio.editors.poster", title: "Poster Card editor", status: "review" },
          { id: "studio.editors.corner", title: "Corner Icon editor", status: "review" },
          { id: "studio.editors.search", title: "Search Bar editor", status: "review" },
          { id: "studio.editors.tabs", title: "Tab editors (active / idle / inactive)", status: "review" },
          { id: "studio.editors.brand", title: "Brand Tokens editor", status: "review" },
        ],
      },
      { id: "studio.tasks", title: "Tasks checklist (this page)", status: "review" },
      { id: "studio.lab", title: "Lab (v2) — auto-detect & edit any element (MVP)", status: "review",
        note: "Tap any element → introspect computed styles → edit live → export selector+props. Isolated from the main Studio." },
    ],
  },
  {
    id: "roadmap", title: "Roadmap / ideas", status: "todo", area: "roadmap",
    children: [
      { id: "roadmap.studio-standalone", title: "Branch the Studio into its own standalone, reusable project (use on other sites)", status: "todo",
        note: "Extract Studio into a portable overlay/module that can attach to any site." },
      { id: "roadmap.studio-introspect", title: "Studio auto-detects an element and exposes editable properties", status: "review",
        note: "MVP shipped as Studio → Lab (beta). Future: broaden the property set, map exports onto the token system, gradient/background editing." },
      { id: "roadmap.icon-outline", title: "Optional real SVG outline for category icons", status: "todo" },
      { id: "roadmap.real-apis", title: "Real API integration (TMDB/OMDb/IGDB/OpenCritic/Steam/Goodreads) behind a proxy", status: "todo" },
      { id: "roadmap.accounts", title: "User accounts: submitted ratings, watchlist, sync", status: "todo" },
    ],
  },
];
