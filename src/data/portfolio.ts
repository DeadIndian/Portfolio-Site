export type ProjectCategory =
  "Full Stack" | "Infrastructure" | "Linux & FOSS" | "Experiments";

export interface Project {
  id: string;
  title: string;
  eyebrow: string;
  category: ProjectCategory;
  summary: string;
  role: string;
  status: string;
  stack: string[];
  repo: string;
  live?: string;
  year: string;
  challenge: string;
  approach: string[];
  outcome: string;
  note?: string;
  image?: string;
  featured?: boolean;
}

// Unknown years stay blank. Source boundaries and status evidence live in docs/content-sources.md.
export const projects: Project[] = [
  {
    id: "adb",
    title: "Advanced Discord Bot (ADB)",
    eyebrow: "Plugins with explicit boundaries",
    category: "Full Stack",
    summary:
      "I maintain a self-hostable Discord bot platform where features live in plugins rather than growing into one tangled command handler.",
    role: "Maintainer and plugin-architecture contributor",
    status: "Public implementation",
    stack: [
      "Node.js",
      "discord.js",
      "Fastify",
      "MongoDB",
      "worker_threads",
      "Docker",
    ],
    repo: "https://github.com/AdvancedDiscordBot/Advanced-Discord-Bot",
    live: "https://adb.gollabharath.me",
    year: "",
    challenge:
      "I wanted plugins to be easier to extend and inspect, with explicit limits on what each plugin can access.",
    approach: [
      "I worked on manifest-driven contracts for permissions, dependencies and resource settings, so plugin expectations are visible before loading.",
      "I used worker threads and a capability broker for mediated calls, alongside timeouts, resource tracking and network host restrictions.",
      "I connected plugin loading, reloads and health reporting to a Fastify dashboard, with MongoDB supporting the platform.",
      "I documented the runtime and contributed the merged plugin-architecture change so future work has a reference beyond the code.",
    ],
    outcome:
      "I have a documented plugin platform to maintain, with clearer contracts between features and the core. The architecture work is recorded in an upstream merged PR.",
    note: "Worker isolation is not a blanket secure-sandbox guarantee. Core and raw-client exceptions exist in the capability model and need their own trust review.",
    image: "/images/adb.webp",
    featured: true,
  },
  {
    id: "transitops",
    title: "TransitOps",
    eyebrow: "Dispatch is a state problem",
    category: "Full Stack",
    summary:
      "I built fleet operations around the rules that connect vehicles, drivers, trips, maintenance and costs, not just a set of CRUD screens.",
    role: "Developer",
    status: "Source available",
    stack: [
      "Next.js",
      "React",
      "TypeScript",
      "Prisma",
      "PostgreSQL",
      "Zod",
      "Auth.js",
    ],
    repo: "https://github.com/DeadIndian/TransitOps",
    year: "",
    challenge:
      "I needed dispatch, completion and cancellation to agree on vehicle and driver availability, even when requests overlap.",
    approach: [
      "I put trip transitions inside Prisma transactions and used SELECT FOR UPDATE row locks before changing related records.",
      "I rechecked cargo capacity and licence validity against the locked rows rather than trusting an earlier form check.",
      "I enforced role access at route and server-action boundaries and shared Zod schemas with the forms.",
      "I derived operational summaries from stored records and exposed CSV exports instead of maintaining a second set of totals.",
    ],
    outcome:
      "Dispatch, completion and cancellation are explicit transaction paths, with vehicle and driver state checked together. The source makes those business rules inspectable alongside the interface.",
    featured: true,
  },
  {
    id: "tailscale-widget",
    title: "Tailscale Plasma Widget",
    eyebrow: "Networking from my panel",
    category: "Linux & FOSS",
    summary:
      "I brought Tailscale controls into KDE Plasma so I can inspect peers and manage connections without making the terminal the whole interface.",
    role: "Developer",
    status: "Public Plasma 6 widget",
    stack: [
      "C++",
      "Qt 6",
      "QML",
      "Kirigami",
      "KDE Plasma 6",
      "CMake",
      "Tailscale CLI",
    ],
    repo: "https://github.com/DeadIndian/tailscale-widget",
    year: "",
    challenge:
      "I wanted a responsive desktop view of a CLI-managed service, with useful refresh behaviour and a clear way to handle missing permissions.",
    approach: [
      "I parsed Tailscale JSON into a diffing QAbstractListModel so refreshing peers does not throw away inline ping results.",
      "I invoked the CLI through QProcess argument arrays and validated arguments rather than constructing shell commands.",
      "I exposed connection, profile and exit-node controls in QML, alongside filtering, sorting, ping and clipboard actions.",
      "I surfaced the Tailscale operator-permission setup instead of asking the widget to run through sudo.",
    ],
    outcome:
      "I built a native Plasma control surface while leaving the networking to Tailscale. The interesting work was the boundary between desktop state, CLI output and permissions.",
    featured: true,
  },
  {
    id: "gamify",
    title: "Gamify",
    eyebrow: "An archived community build",
    category: "Full Stack",
    summary:
      "I helped build and maintain an open-source rewards platform with event submissions, points, a reward shop and a companion Discord bot.",
    role: "Former lead maintainer and contributor",
    status: "Archived",
    stack: [
      "React",
      "Vite",
      "Node.js",
      "Express",
      "MongoDB",
      "discord.js",
      "Tailwind CSS",
    ],
    repo: "https://github.com/DeadIndian/Gamify",
    year: "",
    challenge:
      "I needed event review, rewards and Discord interactions to share a consistent permission and points model across organizations.",
    approach: [
      "I worked with role-derived permissions to separate member, moderation, event and administration tasks.",
      "I used atomic point updates and balance-guarded debits rather than relying on read-then-write balance changes.",
      "I connected the web application and Discord companion through scoped authentication paths.",
      "I helped review and coordinate community contributions alongside the application work.",
    ],
    outcome:
      "I gained experience maintaining shared code and reviewing changes across a community project. The repository is now archived, so this is a past-maintenance case, not an ongoing lead role.",
    note: "Archived as of September 2026. This case study preserves the implementation and maintainership lessons; the repository remains available to explore.",
    image: "/images/gamify.webp",
    featured: true,
  },
  {
    id: "wallpaper-carousel",
    title: "Wallpaper Carousel",
    eyebrow: "A small desktop convenience",
    category: "Linux & FOSS",
    summary:
      "A keyboard-driven wallpaper picker for Plasma, plus an optional slideshow plugin based on KDE's wallpaper code. A small fix for a daily desktop task.",
    role: "Picker author; slideshow-plugin adaptation",
    status: "Slideshow plugin v0.1.0 released",
    stack: ["C++", "Qt 6", "QML", "KDE Plasma"],
    repo: "https://github.com/DeadIndian/Wallpaper-Carousel",
    year: "2026",
    challenge:
      "I wanted choosing a wallpaper and letting wallpapers rotate to feel like parts of the same desktop workflow.",
    approach: [
      "I built the keyboard-driven picker with C++, Qt Quick and Plasma's D-Bus interface.",
      "I adapted KDE's slideshow plugin so selecting an image can preserve slideshow rotation.",
      "I kept the picker and the upstream-derived plugin's licensing separate and documented their installation paths.",
    ],
    outcome:
      "The v0.1.0 release includes the slideshow-plugin archive; the picker is built from source. Together they make wallpaper selection a keyboard-friendly part of the desktop.",
    note: "The picker is MIT-licensed; the slideshow plugin derives from KDE code under GPL-2.0-or-later. COPR packaging is not published.",
  },
  {
    id: "sticky-notes",
    title: "Sticky Notes",
    eyebrow: "Notes that fit my desktop",
    category: "Linux & FOSS",
    summary:
      "I adapted KDE's official Notes widget with my own colour and ghost behaviour rather than writing a replacement notes stack.",
    role: "Widget customizations; upstream-based adaptation",
    status: "Released v1.0.0",
    stack: ["QML", "Qt", "KDE Plasma"],
    repo: "https://github.com/DeadIndian/deads-sticky-notes",
    year: "2026",
    challenge:
      "I wanted desktop notes to remain useful without always looking like another prominent window competing for attention.",
    approach: [
      "I started from the official KDE Notes widget and kept that upstream foundation explicit.",
      "I added colour controls and ghost behaviour to change how notes sit on the desktop.",
      "I packaged the adaptation as its own v1.0.0 release while retaining credit for inherited work.",
    ],
    outcome:
      "I released a focused customization of a widget I wanted to use. My contribution is the adaptation, not authorship of the entire inherited implementation.",
    note: "Derived from KDE's official Notes widget; upstream code and credit remain part of the project.",
  },
  {
    id: "kde-ship",
    title: "kde-ship",
    eyebrow: "Tooling around Plasma work",
    category: "Linux & FOSS",
    summary:
      "I put KDE development and packaging workflows into a Python and Bash toolset, including a Claude plugin for assisted workflows.",
    role: "Tooling developer",
    status: "Public tooling",
    stack: ["Python", "Bash", "KDE Plasma", "Claude plugin"],
    repo: "https://github.com/DeadIndian/kde-ship",
    year: "",
    challenge:
      "I wanted the steps around KDE project work to be easier to repeat and inspect instead of keeping them as scattered shell knowledge.",
    approach: [
      "I collected workflow helpers in Python and Bash so the underlying commands remain visible.",
      "I included a Claude plugin as part of the toolset rather than presenting AI assistance as something absent from the project.",
      "I kept tooling separate from claims about whether a particular widget has reached a package repository.",
    ],
    outcome:
      "I have public tooling for the work around KDE extensions. Its existence does not establish that every supported packaging or publishing path has been exercised.",
    note: "Includes AI-assisted tooling. This is not one of the six owner-confirmed no-AI Odin builds.",
  },
  {
    id: "recurse-hq",
    title: "Recurse-HQ",
    eyebrow: "A club space to walk through",
    category: "Experiments",
    summary:
      "I contributed the initial commit for a first-person 3D club website, exploring a different way to present Recurse than a conventional landing page.",
    role: "Initial contributor; Recurse Club Head",
    status: "3D club-site experiment",
    stack: ["React", "React Three Fiber", "Drei", "Rapier", "GSAP"],
    repo: "https://github.com/recursekmit/Recurse-HQ",
    year: "",
    challenge:
      "I wanted to explore a club website as a navigable space while recognizing that 3D interaction adds accessibility and performance questions.",
    approach: [
      "I helped establish the project with a first-person scene built in React Three Fiber and Drei.",
      "I worked with Rapier for the physical interaction layer and GSAP for animation.",
      "I treated it as an experiment in presenting the club, not proof that an immersive interface is the best choice for every visitor.",
    ],
    outcome:
      "The public club repository contains the interactive prototype and my initial contribution. Device testing and accessibility work remain important next steps for this experiment.",
    note: "This is shared club work, not a sole-authorship claim. My current Club Head role is owner-confirmed.",
  },
  {
    id: "studio1440",
    title: "Studio1440",
    eyebrow: "A catalog, not a checkout",
    category: "Full Stack",
    summary:
      "A sneaker catalog with an owner-editable admin panel. Customers browse online, then continue the order conversation on WhatsApp or Instagram.",
    role: "Developer",
    status: "Catalog implementation",
    stack: ["Next.js", "Firebase", "Cloudinary"],
    repo: "https://github.com/DeadIndian/studio-1440",
    year: "",
    challenge:
      "I needed a place to browse products while keeping the actual order conversation in the channels the business uses.",
    approach: [
      "I built the catalog interface in Next.js and used Firebase for the application data layer.",
      "I used Cloudinary for catalog media rather than bundling every product image into the frontend.",
      "I designed the order handoff around WhatsApp and Instagram rather than adding an online payment flow.",
    ],
    outcome:
      "I built the browsing and inquiry side of a storefront. Payments, checkout completion and a currently working deployment are not established by this case.",
    note: "Catalog and order inquiry only. Online payment checkout is not part of this project.",
  },
  {
    id: "gpu-run",
    title: "Gpu-run",
    eyebrow: "A queue for local GPU work",
    category: "Infrastructure",
    summary:
      "I started a Rust CLI for queuing local GPU jobs, keeping the problem smaller than a distributed scheduler or hosted compute service.",
    role: "Developer",
    status: "MVP",
    stack: ["Rust", "Tokio", "CLI"],
    repo: "https://github.com/DeadIndian/Gpu-run",
    year: "",
    challenge:
      "I wanted a more deliberate way to submit local GPU work than starting competing jobs from unrelated terminal sessions.",
    approach: [
      "I put job submission and queue handling behind a local command-line interface.",
      "I used Rust and Tokio for the implementation rather than introducing a web control plane.",
      "I kept the scope at a local GPU queue so the MVP has a clear boundary.",
    ],
    outcome:
      "A local-queue MVP with job submission, cancellation and GPU telemetry. It keeps the scheduling problem close to one machine and exposes the work through a CLI.",
  },
  {
    id: "study-point",
    title: "Study Point",
    eyebrow: "Seats and fees on the desktop",
    category: "Full Stack",
    summary:
      "I built a desktop application for seat and fee records, using Python, PyQt5 and SQLite instead of requiring a web service.",
    role: "Developer",
    status: "Desktop implementation",
    stack: ["Python", "PyQt5", "SQLite"],
    repo: "https://github.com/DeadIndian/library-management-desktop-app",
    year: "",
    challenge:
      "I needed seat assignments and fee records to be manageable together in a straightforward desktop workflow.",
    approach: [
      "I used PyQt5 for the interface and Python for the application logic.",
      "I kept records in SQLite so the data layer stays local to the desktop application.",
      "I focused the scope on seat and fee management rather than expanding it into a general business platform.",
    ],
    outcome:
      "I produced a desktop implementation of that workflow. The public source does not establish a live business rollout or audited financial handling.",
  },
  {
    id: "git-notify",
    title: "Git-Notify",
    eyebrow: "Repository activity in Discord",
    category: "Infrastructure",
    summary:
      "I built a small webhook bridge that brings GitHub and Gitea activity into Discord without tying notifications to a single Git host.",
    role: "Developer",
    status: "Public webhook bridge",
    stack: [
      "Node.js",
      "Express",
      "GitHub webhooks",
      "Gitea webhooks",
      "Discord webhooks",
    ],
    repo: "https://github.com/DeadIndian/Git-Notify",
    year: "",
    challenge:
      "I wanted repository updates from different Git hosts to arrive in a shared communication channel in a readable form.",
    approach: [
      "I used an Express service to receive repository webhook events.",
      "I handled GitHub and Gitea payloads before passing notifications to Discord.",
      "I kept the project focused on the integration path rather than building another repository dashboard.",
    ],
    outcome:
      "A small bridge between repository events and the place a team talks. The source includes webhook verification options, retry handling and a systemd service definition.",
  },
  {
    id: "ai-content-farm",
    title: "AI Content Farm",
    eyebrow: "A media pipeline experiment",
    category: "Experiments",
    summary:
      "I connected script generation, speech synthesis and FFmpeg rendering in a Go pipeline, with queued jobs and more than one provider path.",
    role: "Developer",
    status: "Experimental pipeline",
    stack: [
      "Go",
      "SQLite",
      "FFmpeg",
      "Vanilla JavaScript",
      "Python",
      "Flask",
      "Piper",
      "Docker",
    ],
    repo: "https://github.com/DeadIndian/AI-Content-Farm",
    year: "",
    challenge:
      "I needed long-running media jobs to survive provider failures and process restarts without making the browser manage the whole pipeline.",
    approach: [
      "I used a goroutine worker pool with persisted jobs, cancellation and requeue behaviour for interrupted work.",
      "I separated script generation, TTS provider routing and FFmpeg rendering so failures can be handled at each stage.",
      "I served a small JavaScript interface from the Go application and kept the local Piper TTS path in a Flask sidecar.",
    ],
    outcome:
      "The pipeline brings queued jobs, script review, speech synthesis and rendering into one interface. It is an experiment in orchestrating media work, with manual script approval before rendering.",
    note: "The Docker-socket integration is a privileged local setup choice, not a general-purpose isolation boundary.",
  },
  {
    id: "vijaya-store",
    title: "Vijaya Store",
    eyebrow: "One catalog, two app roles",
    category: "Full Stack",
    summary:
      "I worked on an e-commerce monorepo for a print, stationery and book business, with Flutter customer and admin apps sharing a Next.js API.",
    role: "Developer",
    status: "In development",
    stack: [
      "Flutter",
      "Dart",
      "Next.js",
      "TypeScript",
      "Prisma",
      "PostgreSQL",
      "Firebase",
    ],
    repo: "https://github.com/DeadIndian/EcommerceMobileApp",
    year: "",
    challenge:
      "I needed customer browsing and admin catalog work to use the same product models, including the differences between print variants and PDFs.",
    approach: [
      "I organized customer and admin Flutter source around a shared Dart package for models and API access.",
      "I used a Next.js API with Prisma and PostgreSQL, with separate service, repository and validation concerns.",
      "I worked on catalog variants, authentication and document-preview handling without treating checkout code as evidence of successful payments.",
    ],
    outcome:
      "The monorepo contains separate customer and admin Flutter apps, a shared Dart package, and a Next.js API. Release and payment-flow verification remain separate from the implementation work.",
    note: "The README still describes Flutter work as planned even though source exists. Neither that stale plan nor integration code establishes a completed release.",
  },
  {
    id: "jarvis",
    title: "Jarvis Voice Assistant",
    eyebrow: "Phone-first assistant research",
    category: "Experiments",
    summary:
      "I am exploring a Kotlin and Compose assistant with on-device inference and optional cloud and agent integrations, starting with the phone itself.",
    role: "Developer",
    status: "Android prototype",
    stack: [
      "Kotlin",
      "Jetpack Compose",
      "MediaPipe",
      "Android SpeechRecognizer",
      "Android TTS",
      "Coroutines",
      "MCP",
    ],
    repo: "https://github.com/DeadIndian/Jarvis",
    year: "",
    challenge:
      "I wanted to explore which assistant tasks belong on the device and where optional cloud or tool access makes sense.",
    approach: [
      "I built the public implementation around Android, Kotlin and Compose rather than a required Python server.",
      "I included a MediaPipe on-device inference path alongside optional cloud, agent and MCP integrations.",
      "I kept the current implementation distinct from the v2 server-brain planning notes.",
    ],
    outcome:
      "I have a phone-first prototype with several integration paths to develop. It is not a finished always-listening assistant or a shipped server-brain architecture.",
    note: "Native VAD is not wired into the active path, wake-word support is absent and current app memory is in RAM. The v2 server-brain documents describe plans, not delivered features.",
  },
  {
    id: "arogyakrishi",
    title: "ArogyaKrishi",
    eyebrow: "A prototype, not a diagnosis",
    category: "Experiments",
    summary:
      "I prototyped a crop-advisory flow with Flutter and FastAPI. The active detection route returns random mocked predictions, not real image diagnoses.",
    role: "Prototype developer",
    status: "Prototype; mocked detection",
    stack: ["Flutter", "Dart", "Python", "FastAPI", "SQLAlchemy", "PostgreSQL"],
    repo: "https://github.com/DeadIndian/ArogyaKrishi",
    year: "",
    challenge:
      "I wanted to explore the interface around leaf-photo uploads and multilingual crop guidance, but that workflow needs a validated model before its results can be trusted.",
    approach: [
      "I connected a Flutter photo-upload flow to a FastAPI backend and structured the advisory response for the interface.",
      "I explored multilingual guidance, nearby-service lookups and supporting application flows.",
      "I separated those interface experiments from model quality: the active detect path still uses random mocked predictions.",
    ],
    outcome:
      "I built a prototype of the user journey, not a working crop-disease diagnosis system. Its detection output is not suitable for farming or treatment decisions.",
    note: "Model-related files and README claims do not make the active mocked route real inference. No accuracy or production-readiness claim is made.",
  },
  {
    id: "calico-grafana",
    title: "Calico Kubernetes Observability Lab",
    eyebrow: "Follow the metric to the dashboard",
    category: "Infrastructure",
    summary:
      "I built a local Kubernetes lab to follow Calico networking metrics through Prometheus and into Grafana, then wrote down the setup.",
    role: "Lab author",
    status: "Local lab",
    stack: [
      "Kubernetes",
      "kind",
      "Calico",
      "Prometheus",
      "Grafana",
      "Helm",
      "Docker",
    ],
    repo: "https://github.com/DeadIndian/calico-grafana",
    year: "",
    challenge:
      "I wanted to understand how a networking component becomes an observable Prometheus target, rather than stopping at a running dashboard.",
    approach: [
      "I configured a local kind cluster to use Calico instead of the default CNI.",
      "I exposed Felix metrics and connected them to the monitoring stack through a Prometheus Operator ServiceMonitor.",
      "I used Grafana to inspect the metrics and documented the path from cluster setup to discovery and visualization.",
    ],
    outcome:
      "I produced a documented local lab for learning the monitoring path. It is not a production network case study or a performance benchmark.",
  },
  {
    id: "petrol-pump-management",
    title: "Petrol Pump Management System",
    eyebrow: "Orders, indents and balances",
    category: "Full Stack",
    summary:
      "I built software around the needs of my family petrol pump, connecting fuel orders, indent records, prices and customer balances.",
    role: "Developer",
    status: "Source available",
    stack: [
      "Next.js",
      "TypeScript",
      "Flutter",
      "Riverpod",
      "Prisma",
      "Supabase",
      "PostgreSQL",
    ],
    repo: "https://github.com/DeadIndian/Petrol-pump-management-system",
    year: "",
    challenge:
      "I needed order state, customer indents and balance records to fit the same workflow without making every role an administrator.",
    approach: [
      "I separated customer, employee and admin paths with authenticated role checks.",
      "I used Prisma transactions for per-customer indent allocation and modelled the order lifecycle explicitly.",
      "I connected price history and running-balance records to an admin interface, with validation and audit logging around changes.",
    ],
    outcome:
      "The source connects mobile fuel orders with an admin workflow for indents, prices and balances. Building around a familiar business made the domain rules concrete.",
    note: "This case study covers the implementation. Daily operational rollout and accounting validation are not established here.",
  },
  {
    id: "portfolio-website",
    title: "Portfolio Website",
    eyebrow: "The earlier portfolio",
    category: "Full Stack",
    summary:
      "I built an earlier portfolio with a React and Vite frontend and a Node.js and Express backend for profile and activity integrations.",
    role: "Developer",
    status: "Earlier implementation; public source",
    stack: ["React", "Vite", "JavaScript", "Node.js", "Express"],
    repo: "https://github.com/DeadIndian/Portfolio-Site",
    year: "",
    challenge:
      "I wanted project work and external profile activity to live together without making the frontend responsible for every integration.",
    approach: [
      "I split the React and Vite presentation layer from a Node.js and Express backend.",
      "I brought profile and activity integrations into the portfolio instead of treating it only as a static resume.",
      "I use the public implementation as the stack reference here, correcting the older Go and Next.js description in my resume.",
    ],
    outcome:
      "The earlier site brought together a terminal interface, interactive projects, experience logs and activity feeds. This rebuild keeps the useful parts while making the content easier to navigate.",
    note: "The original resume description is stale. The referenced portfolio uses React/Vite and Node/Express, not the described Go/Next.js stack.",
  },
  {
    id: "tic-tac-toe",
    title: "Tic-Tac-Toe",
    eyebrow: "A small game with clear rules",
    category: "Experiments",
    summary:
      "I built a browser Tic-Tac-Toe game to practise game logic, interaction and the relationship between a move and the board on screen.",
    role: "Developer",
    status: "Browser exercise",
    stack: ["JavaScript", "HTML", "CSS"],
    repo: "https://github.com/DeadIndian/Tic-Tac-Toe",
    year: "",
    challenge:
      "I wanted to work through a complete, small interaction loop where the rules are simple enough to inspect move by move.",
    approach: [
      "I used the board and turn sequence to practise JavaScript game logic.",
      "I worked on DOM interaction and the visual feedback around a move.",
      "I kept the exercise focused on the game rather than wrapping it in a larger application.",
    ],
    outcome:
      "I kept a compact browser-game project in the portfolio as a fundamentals exercise, separate from the six explicitly confirmed Odin builds.",
    image: "/images/tictactoe.webp",
  },
];

export const odinProjects: {
  id: string;
  title: string;
  repo: string;
  focus: string;
  number: string;
  image?: string;
}[] = [
  {
    id: "odin-recipes",
    title: "Odin Recipes",
    repo: "https://github.com/DeadIndian/odin-recipes",
    focus:
      "I practised semantic HTML, links and a readable document structure.",
    number: "01",
  },
  {
    id: "rock-paper-scissors",
    title: "Rock Paper Scissors",
    repo: "https://github.com/DeadIndian/rock-paper-scissors",
    focus:
      "I worked through game logic and DOM events, connecting decisions to what appears on the page.",
    number: "02",
  },
  {
    id: "calculator-odin",
    title: "Calculator",
    repo: "https://github.com/DeadIndian/Calculator-Odin-",
    focus:
      "I practised JavaScript state, keyboard input and button interactions in a calculator.",
    number: "03",
    image: "/images/calculator.webp",
  },
  {
    id: "sign-up-page",
    title: "Sign-up Page",
    repo: "https://github.com/DeadIndian/Sign-up-page",
    focus: "I built a form and worked on input styling, layout and CSS.",
    number: "04",
  },
  {
    id: "admin-dashboard",
    title: "Admin Dashboard",
    repo: "https://github.com/DeadIndian/admin-dashboard",
    focus:
      "I used CSS Grid to organize dashboard regions and practise two-dimensional layout.",
    number: "05",
  },
  {
    id: "library-odin",
    title: "Library",
    repo: "https://github.com/DeadIndian/Library-Odin",
    focus:
      "I modelled books as JavaScript objects and kept application state in sync with the interface.",
    number: "06",
  },
];

export const contributions: {
  title: string;
  project: string;
  url: string;
  status: "Merged" | "Open" | "Closed";
  description: string;
}[] = [
  {
    title: "Keep the task widget hidden until hover",
    project: "TaskWidget",
    url: "https://github.com/WanderFox/TaskWidget/pull/2",
    status: "Merged",
    description:
      "I added a hide-and-reveal-on-hover option so this community Plasma widget can stay out of the way.",
  },
  {
    title: "Connect TaskWidget to Google Tasks",
    project: "TaskWidget",
    url: "https://github.com/WanderFox/TaskWidget/pull/3",
    status: "Open",
    description:
      "I proposed Google Tasks support for the community widget. The upstream pull request is still open.",
  },
  {
    title: "Organize Plasma Drawer with drag and drop",
    project: "Plasma Drawer",
    url: "https://github.com/p-connor/plasma-drawer/pull/92",
    status: "Open",
    description:
      "I proposed drag-and-drop organization for Plasma Drawer. This remains an open community-project contribution.",
  },
  {
    title: "Sequence the splash-screen animation",
    project: "Fastfetch KDE Splash",
    url: "https://github.com/herzane52/fastfetch-kde-splash/pull/2",
    status: "Closed",
    description:
      "I proposed a SequentialAnimation change to a community KDE splash screen. The pull request was closed without merging.",
  },
];

export const engineeringNotes: {
  title: string;
  description: string;
  url: string;
  label: string;
  tags: string[];
}[] = [
  {
    title: "Getting Packet Tracer running on Fedora 44",
    description:
      "I wrote down the installation steps for Packet Tracer on Fedora 44 so the setup is easier to repeat.",
    url: "https://gist.github.com/DeadIndian/ce9c7cda99793728adacaa0c385f840e",
    label: "Gist",
    tags: ["Fedora 44", "Linux", "Packet Tracer"],
  },
  {
    title: "Following Calico metrics into Grafana",
    description:
      "I documented a local kind cluster, Calico Felix metrics and the Prometheus-to-Grafana monitoring path.",
    url: "https://github.com/DeadIndian/calico-grafana/blob/main/README.md",
    label: "Lab notes",
    tags: ["Kubernetes", "Calico", "Prometheus", "Grafana"],
  },
  {
    title: "How ADB's plugin runtime fits together",
    description:
      "I documented the plugin contracts, worker runtime and capability broker that structure the bot platform.",
    url: "https://github.com/AdvancedDiscordBot/Advanced-Discord-Bot/blob/main/ARCHITECTURE.md",
    label: "Project documentation",
    tags: ["Node.js", "Discord", "Plugin architecture"],
  },
];

export const socials: {
  name: string;
  url: string;
  handle: string;
}[] = [
  {
    name: "GitHub",
    url: "https://github.com/DeadIndian",
    handle: "DeadIndian",
  },
  {
    name: "LinkedIn",
    url: "https://www.linkedin.com/in/golla-bharath/",
    handle: "golla-bharath",
  },
  {
    name: "Discord",
    url: "https://discordapp.com/users/972801524092776479",
    handle: "deadindian",
  },
  {
    name: "Spotify",
    url: "https://open.spotify.com/user/31enxavrkyobb5lbp4phl33jgnwq",
    handle: "31enxavrkyobb5lbp4phl33jgnwq",
  },
  {
    name: "YouTube",
    url: "https://www.youtube.com/channel/UCQn4-TWf2So7nvGOPesGoaQ",
    handle: "UCQn4-TWf2So7nvGOPesGoaQ",
  },
  {
    name: "Instagram",
    url: "https://www.instagram.com/gollabharath_/",
    handle: "gollabharath_",
  },
  {
    name: "Reddit",
    url: "https://www.reddit.com/user/Dead-Indian/",
    handle: "Dead-Indian",
  },
  {
    name: "WakaTime",
    url: "https://wakatime.com/@deadindian",
    handle: "deadindian",
  },
  {
    name: "LeetCode",
    url: "https://leetcode.com/u/deadindian/",
    handle: "deadindian",
  },
];

export const communities: {
  name: string;
  description: string;
  url: string;
}[] = [
  {
    name: "Let Us Hack",
    description:
      "I spend time here around cybersecurity, CTFs and hands-on learning.",
    url: "https://discord.gg/CAKYpFKjsW",
  },
  {
    name: "TH11-14 Clash Community",
    description:
      "I hang out with Clash of Clans players and talk strategy beyond my coding projects.",
    url: "https://discord.gg/th11-clash-community-593285788414902277",
  },
  {
    name: "The Imperial Empire",
    description: "A Discord community where I hang out beyond code.",
    url: "https://discord.gg/8Nvy7NGCq6",
  },
];
