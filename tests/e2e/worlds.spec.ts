import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import resume from "../../resumeData.json";

const date = "2026-09-24T12:00:00.000Z";
const calendar = [
  { date: "2026-09-22", count: 3 },
  { date: "2026-09-23", count: 1 },
];
const fixtures = {
  github: {
    username: "DeadIndian",
    followers: 8,
    publicRepos: 12,
    stars: 7,
    contributions: calendar,
    languages: [{ name: "TypeScript", value: 3 }],
    repos: [
      {
        name: "Public-example",
        url: "https://github.com/DeadIndian/Gamify",
        description: "A deterministic test repository.",
        language: "TypeScript",
        stars: 7,
        forks: 2,
        archived: true,
        updatedAt: date,
      },
    ],
  },
  wakatime: {
    totalSeconds: 72000,
    dailyAverageSeconds: 1800,
    range: "all_time",
    start: null,
    end: null,
    bestDay: null,
    languages: [{ name: "TypeScript", percent: 70, seconds: 50400 }],
    editors: [{ name: "VS Code", percent: 100 }],
  },
  discord: {
    username: "deadindian",
    displayName: "Dead Indian",
    status: "offline",
    avatarUrl: null,
    platforms: [],
    customStatus: null,
    activities: [],
  },
  spotify: {
    isPlaying: false,
    title: null,
    artist: null,
    album: null,
    albumArt: null,
    trackUrl: null,
    durationMs: 0,
    progressMs: 0,
    sampledAt: date,
  },
  leetcode: {
    totalSolved: 10,
    ranking: 900,
    easy: 7,
    medium: 3,
    hard: 0,
    totalEasy: 100,
    totalMedium: 100,
    totalHard: 100,
    submissions: 4,
    acceptanceRate: null,
    calendar,
  },
};

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/signals/*", (route) => {
    const provider = route
      .request()
      .url()
      .split("/")
      .at(-1) as keyof typeof fixtures;
    return route.fulfill({
      json: {
        status: "ok",
        source: "Deterministic test fixture",
        updatedAt: date,
        data: fixtures[provider],
      },
    });
  });
  await page.route("**/api/writing", (route) =>
    route.fulfill({
      json: {
        status: "unconfigured",
        profileUrl: null,
        updatedAt: null,
        articles: [],
      },
    }),
  );
  await page.goto("/");
  await expect(page.locator(".world-root")).toHaveAttribute(
    "data-world",
    "studio",
  );
});

test("renders working 3D, changes the assembly, and reuses the renderer across genuinely different worlds", async ({
  page,
}) => {
  const scene = page.locator(".world-scene");
  await expect(scene).toHaveAttribute("data-scene-ready", "true", {
    timeout: 45000,
  });
  await expect(scene).toHaveAttribute("data-webgl", "available");
  const canvas = scene.locator("canvas");
  await canvas.evaluate((element) =>
    element.setAttribute("data-persistent-test", "same-renderer"),
  );
  const before = await canvas.screenshot({
    style: "main { visibility: hidden !important; }",
  });
  await page.getByRole("button", { name: "Assemble", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Explode the view", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  const after = await canvas.screenshot({
    style: "main { visibility: hidden !important; }",
  });
  expect(after.equals(before)).toBe(false);
  await page
    .getByRole("button", { name: "Meet Golla Bharath", exact: true })
    .click();
  await expect(page.locator(".personal-desktop")).toBeVisible();
  await expect(page.locator(".engineering-studio")).toHaveCount(0);
  await expect(
    page.getByRole("navigation", { name: "Workspace dock" }),
  ).toBeVisible();
  await expect(page.locator(".world-scene canvas")).toHaveAttribute(
    "data-persistent-test",
    "same-renderer",
  );
  await page
    .getByRole("button", { name: "Back to Dead Indian", exact: true })
    .click();
  await expect(page.locator(".engineering-studio")).toBeVisible();
  await expect(page.locator(".world-scene canvas")).toHaveAttribute(
    "data-persistent-test",
    "same-renderer",
  );
});

test("project directory search, nested dossiers and keyboard dismissal remain functional", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "All 20 projects", exact: true })
    .click();
  const directory = page.locator(".studio-dossier");
  await expect(directory).toBeVisible();
  await directory
    .getByRole("button", { name: "Linux & FOSS", exact: true })
    .click();
  await expect(directory.locator(".project-card")).toHaveCount(4);
  await directory
    .getByRole("textbox", { name: "Search projects" })
    .fill("tailscale");
  await directory
    .getByRole("button", { name: "Read case study: Tailscale Plasma Widget" })
    .click();
  const dossier = page.locator(".project-dialog");
  await expect(dossier).toBeVisible();
  await expect(
    dossier.getByRole("link", { name: "Explore the source" }),
  ).toHaveAttribute("href", "https://github.com/DeadIndian/tailscale-widget");
  await page.keyboard.press("Escape");
  await expect(dossier).not.toBeVisible();
  await expect(directory).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(directory).not.toBeVisible();
});

test("desktop windows drag, minimize, restore, maximize and open actual project files", async ({
  page,
}, testInfo) => {
  await page
    .getByRole("button", { name: "Meet Golla Bharath", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Open Projects", exact: true })
    .click();
  const directory = page.locator('[data-window-id="projects"]');
  await expect(directory.locator(".project-file")).toHaveCount(20);
  let movedX: number | undefined;
  if (testInfo.project.name === "desktop") {
    const box = (await directory
      .locator(".desktop-window-title")
      .boundingBox())!;
    await page.mouse.move(box.x + 180, box.y + 18);
    await page.mouse.down();
    await page.mouse.move(box.x + 105, box.y + 18, { steps: 6 });
    await page.mouse.up();
    movedX = (await directory.boundingBox())!.x;
    expect(movedX).toBeLessThan(box.x - 35);
  }
  await page
    .getByRole("button", { name: "Minimize Project directory", exact: true })
    .click();
  await expect(directory).not.toBeVisible();
  await page
    .getByRole("navigation", { name: "Workspace dock" })
    .getByRole("button", { name: "Projects", exact: true })
    .click();
  await expect(directory).toBeVisible();
  if (movedX !== undefined)
    expect((await directory.boundingBox())!.x).toBeCloseTo(movedX, 0);
  await page
    .getByRole("button", { name: "Maximize Project directory", exact: true })
    .click();
  await expect(directory).toHaveClass(/is-maximized/);
  await page
    .getByRole("button", { name: "Restore Project directory", exact: true })
    .click();
  await directory
    .locator(".project-file")
    .filter({ hasText: "Tailscale Plasma Widget" })
    .click();
  const file = page.locator('[data-window-id="project:tailscale-widget"]');
  await expect(file).toBeVisible();
  await expect(
    file.getByRole("link", { name: "Read the source", exact: true }),
  ).toHaveAttribute("href", "https://github.com/DeadIndian/tailscale-widget");
  await page.keyboard.press("Escape");
  await expect(file).toHaveCount(0);
  await expect(directory).toBeVisible();
});

test("the handmade shelf, Linux journey, Recurse and writing are separate, detailed applications", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Meet Golla Bharath", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Open No-AI work", exact: true })
    .click();
  const shelf = page.locator('[data-window-id="handmade"]');
  await expect(shelf.locator(".floppy")).toHaveCount(6);
  await expect(shelf).toContainText("not to other projects or this portfolio");
  await page
    .getByRole("button", { name: "Close The no-AI collection", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Open My Linux", exact: true })
    .click();
  await expect(page.locator('[data-window-id="linux"]')).toContainText(
    "Debian / Dell OptiPlex",
  );
  await page
    .getByRole("button", { name: "Close Linux & the home lab", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Open Community", exact: true })
    .click();
  await expect(page.locator('[data-window-id="opensource"]')).toContainText(
    "Club Head / Recurse, KMIT",
  );
  await expect(page.locator(".patch-list > a")).toHaveCount(4);
  await page
    .getByRole("button", { name: "Close Open source & Recurse", exact: true })
    .click();
  await page.getByRole("button", { name: "Open Writing", exact: true }).click();
  await expect(
    page.locator('[data-window-id="writing"] .writing-entry'),
  ).toHaveCount(3);
  await expect(page.locator(".medium-panel")).toContainText(
    "MEDIUM FEED NOT CONNECTED YET",
  );
});

test("the terminal routes commands into the correct world", async ({
  page,
}) => {
  await page.keyboard.press("/");
  const input = page.locator("#terminal-input");
  await expect(input).toBeFocused();
  await input.fill("who");
  await page.keyboard.press("Tab");
  await expect(input).toHaveValue("whoami");
  await page.keyboard.press("Enter");
  // The studio is Dead Indian's world, so its terminal must answer as him.
  await expect(page.getByRole("log")).toContainText("KDE Plasma tinkerer");
  await input.fill("theme");
  await page.keyboard.press("Enter");
  await expect(page.locator(".personal-desktop")).toBeVisible();
  await expect(page.locator(".terminal-dialog")).not.toBeVisible();
  await page.keyboard.press("/");
  await expect(page.locator(".terminal-dialog")).toBeVisible();
  await expect(input).toBeFocused();
  // The desktop is Bharath's world, so the same terminal must answer as him.
  await input.fill("whoami");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("log")).toContainText("Club Head, Recurse");
  await input.fill("projects");
  await page.keyboard.press("Enter");
  await expect(page.locator(".terminal-dialog")).not.toBeVisible();
  await expect(page.locator('[data-window-id="projects"]')).toBeVisible();
});

test("real-feed UI distinguishes idle from failure and survives independent provider errors", async ({
  page,
}) => {
  await page.getByRole("button", { name: /Live signals Code, music/ }).click();
  await expect(page.locator(".github-stats")).toContainText("12");
  await expect(page.locator(".discord-signal")).toContainText("offline");
  await expect(page.locator(".spotify-signal")).toContainText(
    "Between soundtracks.",
  );
  await page.route("**/api/signals/wakatime", (route) =>
    route.fulfill({
      json: {
        status: "unavailable",
        source: "Test fixture",
        updatedAt: null,
        data: null,
      },
    }),
  );
  await page
    .getByRole("button", { name: "Refresh feeds", exact: true })
    .click();
  await expect(page.locator(".wakatime-signal")).toContainText("UNAVAILABLE");
  await expect(page.locator(".github-stats")).toContainText("12");
});

test("public contact and print actions work without serializing private resume fields", async ({
  page,
  context,
}) => {
  const html = await page.content();
  expect(html).not.toContain(resume.personalInfo.dob);
  expect(html).not.toContain(resume.personalInfo.phone);
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page
    .getByRole("button", { name: "Contact & links", exact: true })
    .click();
  await page.getByRole("button", { name: "Copy email", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Email copied", exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    resume.personalInfo.email,
  );
  await page.getByRole("link", { name: "Read / download my resume" }).click();
  await expect(page).toHaveURL(/\/resume$/);
  await expect(page.locator(".resume-sheet")).toContainText("Club Head");
  await page.evaluate(() => {
    window.print = () =>
      document.documentElement.setAttribute("data-print-invoked", "true");
  });
  await page.getByRole("button", { name: "Print / Save PDF" }).click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-print-invoked",
    "true",
  );
});

test("motion preferences and narrow viewports keep both experiences usable", async ({
  page,
}) => {
  await expect(page.locator(".world-root")).toHaveAttribute(
    "data-motion",
    "off",
  );
  await page.locator(".alternate-process").scrollIntoViewIfNeeded();
  await page.waitForTimeout(4500);
  await expect(page.locator(".alternate-process")).not.toHaveClass(
    /is-peeking/,
  );
  expect(
    await page.evaluate(() => sessionStorage.getItem("world-glimpse")),
  ).toBeNull();
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "Meet Golla Bharath", exact: true })
    .click();
  await expect(page.locator(".desktop-dock")).toBeInViewport();
  await page
    .getByRole("button", { name: "Open My Linux", exact: true })
    .click();
  const window = page.locator('[data-window-id="linux"]');
  const bounds = (await window.boundingBox())!;
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
  await expect(
    page.getByRole("button", { name: "Close Linux & the home lab" }),
  ).toBeInViewport();
});

test("the automatic glimpse and dimensional transition do not get stuck", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.locator(".alternate-process").scrollIntoViewIfNeeded();
  await expect(page.locator(".alternate-process")).toHaveClass(/is-peeking/, {
    timeout: 12000,
  });
  await expect(page.locator(".alternate-process")).not.toHaveClass(
    /is-peeking/,
    { timeout: 6000 },
  );
  await page
    .getByRole("button", { name: "Meet Golla Bharath", exact: true })
    .click();
  await expect(page.locator(".personal-desktop")).toBeVisible({
    timeout: 15000,
  });
  await expect(page.locator(".world-transition")).not.toBeVisible({
    timeout: 15000,
  });
  await page
    .getByRole("button", { name: "Back to Dead Indian", exact: true })
    .click();
  await expect(page.locator(".engineering-studio")).toBeVisible({
    timeout: 15000,
  });
  await expect(page.locator(".world-transition")).not.toBeVisible({
    timeout: 15000,
  });
});

test("both worlds and their content pass automated accessibility checks", async ({
  page,
}) => {
  const check = async () => {
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      result.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
  };
  await check();
  await page
    .getByRole("button", { name: "CyberParadigm", exact: true })
    .click();
  await check();
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Meet Golla Bharath", exact: true })
    .click();
  await check();
  await page
    .getByRole("button", { name: "Open No-AI work", exact: true })
    .click();
  await check();
});

test("a missing WebGL context leaves an honest static preview and working content", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      value: function (kind: string, ...args: unknown[]) {
        if (kind.startsWith("webgl")) return null;
        return Reflect.apply(original, this, [kind, ...args]);
      },
    });
  });
  await page.reload();
  await expect(page.locator(".world-scene")).toHaveAttribute(
    "data-webgl",
    "unavailable",
  );
  await expect(page.locator(".scene-fallback")).toContainText("Static preview");
  await page
    .getByRole("button", { name: "All 20 projects", exact: true })
    .click();
  await expect(page.locator(".studio-dossier")).toBeVisible();
  await expect(page.locator(".project-card")).toHaveCount(4);
});
