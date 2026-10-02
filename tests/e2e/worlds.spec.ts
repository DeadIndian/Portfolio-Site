import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import resume from "../../resumeData.json";

/**
 * Switch to a world if it is not already showing. The desktop opens with
 * Bharath, so most tests that exercise studio-only UI have to switch first.
 */
const goTo = async (page: Page, world: "studio" | "desktop") => {
  if ((await page.locator(".world-root").getAttribute("data-world")) === world)
    return;
  const label =
    world === "studio" ? "Back to Dead Indian" : "Meet Golla Bharath";
  await page.getByRole("button", { name: label, exact: true }).click();
  await expect(page.locator(".world-root")).toHaveAttribute(
    "data-world",
    world,
  );
};

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
    "desktop",
  );
});

test("renders the arc reactor, explodes and assembles it, and reuses the renderer across genuinely different worlds", async ({
  page,
}, testInfo) => {
  const scene = page.locator(".world-scene");
  await expect(scene).toHaveAttribute("data-scene-ready", "true", {
    timeout: 45000,
  });
  await expect(scene).toHaveAttribute("data-webgl", "available");
  await goTo(page, "studio");
  await expect(scene).toHaveAttribute(
    "aria-label",
    "Arc reactor with copper coils and an illuminated core",
  );
  const canvas = scene.locator("canvas");
  await canvas.evaluate((element) =>
    element.setAttribute("data-persistent-test", "same-renderer"),
  );
  const explodeButton = page.getByRole("button", {
    name: "Explode reactor",
    exact: true,
  });
  const assembleButton = page.getByRole("button", {
    name: "Assemble reactor",
    exact: true,
  });
  await expect(explodeButton).toHaveAttribute("aria-pressed", "false");
  const before = await canvas.screenshot({
    style: "main { visibility: hidden !important; }",
  });
  await explodeButton.click();
  await expect(assembleButton).toHaveAttribute("aria-pressed", "true");
  const exploded = await canvas.screenshot({
    style: "main { visibility: hidden !important; }",
  });
  expect(exploded.equals(before)).toBe(false);
  await assembleButton.click();
  await expect(explodeButton).toHaveAttribute("aria-pressed", "false");
  const assembled = await canvas.screenshot({
    style: "main { visibility: hidden !important; }",
  });
  expect(assembled.equals(exploded)).toBe(false);
  const bounds = (await canvas.boundingBox())!;
  await canvas.click({
    position: { x: bounds.width / 2, y: bounds.height * 0.4 },
  });
  await expect(assembleButton).toHaveAttribute("aria-pressed", "true");
  await assembleButton.click();
  await expect(explodeButton).toHaveAttribute("aria-pressed", "false");
  if (testInfo.project.name === "desktop") {
    const x = bounds.x + bounds.width / 2;
    const y = bounds.y + bounds.height * 0.4;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 70, y - 25, { steps: 8 });
    await page.mouse.move(x, y, { steps: 8 });
    await page.mouse.up();
    await expect(explodeButton).toHaveAttribute("aria-pressed", "false");
  }
  await page
    .getByRole("button", { name: "Rotate model right", exact: true })
    .click();
  const rotated = await canvas.screenshot({
    style: "main { visibility: hidden !important; }",
  });
  expect(rotated.equals(assembled)).toBe(false);
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

test("reactor motion separates all five layers and the pause control stops movement", async ({
  page,
}) => {
  await goTo(page, "studio");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const scene = page.locator(".world-scene");
  await expect(scene).toHaveAttribute("data-scene-ready", "true", {
    timeout: 45000,
  });
  await page
    .getByRole("button", { name: "Explode reactor", exact: true })
    .click();
  const layers = page.locator(".reactor-layer-anchor");
  await expect(layers).toHaveCount(5);
  await expect
    .poll(
      () =>
        layers.evaluateAll((elements) => {
          const heights = elements
            .map((element) => element.getBoundingClientRect().y)
            .sort((a, b) => a - b);
          return Math.min(
            ...heights.slice(1).map((height, i) => height - heights[i]),
          );
        }),
      { timeout: 15000 },
    )
    .toBeGreaterThan(25);
  await page.getByRole("button", { name: "Pause motion", exact: true }).click();
  await expect(page.locator(".world-root")).toHaveAttribute(
    "data-motion",
    "off",
  );
  await scene.scrollIntoViewIfNeeded();
  const canvas = scene.locator("canvas");
  const paused = await canvas.screenshot({
    style: "main { visibility: hidden !important; }",
  });
  await page.waitForTimeout(500);
  const stillPaused = await canvas.screenshot({
    style: "main { visibility: hidden !important; }",
  });
  expect(stillPaused.equals(paused)).toBe(true);
});

test("project directory search, nested dossiers and keyboard dismissal remain functional", async ({
  page,
}) => {
  await goTo(page, "studio");
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
  await goTo(page, "studio");
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
  await goTo(page, "studio");
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
  await goTo(page, "studio");
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
  await goTo(page, "studio");
  await page.locator(".alternate-process").scrollIntoViewIfNeeded();
  await page.waitForTimeout(4500);
  await expect(page.locator(".alternate-process")).not.toHaveClass(
    /is-peeking/,
  );
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    const controlsOverlapSwitch = await page.evaluate(() => {
      const controls = document
        .querySelector(".assembly-control")!
        .getBoundingClientRect();
      const gateway = document
        .querySelector(".alternate-process")!
        .getBoundingClientRect();
      return (
        controls.left < gateway.right &&
        controls.right > gateway.left &&
        controls.top < gateway.bottom &&
        controls.bottom > gateway.top
      );
    });
    expect(controlsOverlapSwitch).toBe(false);
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

test("the studio teaser stays suppressed and the dimensional transition does not get stuck", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await goTo(page, "studio");
  // Bharath is the entry world now, so reaching the studio always happens via a
  // switch, and a switch marks the teaser as already seen. It must not fire.
  await page.locator(".alternate-process").scrollIntoViewIfNeeded();
  await page.waitForTimeout(6000);
  await expect(page.locator(".alternate-process")).not.toHaveClass(
    /is-peeking/,
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
  await goTo(page, "studio");
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
  await goTo(page, "studio");
  await page
    .getByRole("button", { name: "All 20 projects", exact: true })
    .click();
  await expect(page.locator(".studio-dossier")).toBeVisible();
  await expect(page.locator(".project-card")).toHaveCount(4);
});
