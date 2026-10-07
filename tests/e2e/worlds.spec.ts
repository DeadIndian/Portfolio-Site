import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import resume from "../../resumeData.json";

const date = "2026-09-24T12:00:00.000Z";
const calendar = [{ date: "2026-09-22", count: 3 }, { date: "2026-09-23", count: 1 }];
const fixtures = {
  github: {
    username: "DeadIndian", followers: 8, publicRepos: 12, stars: 7, contributions: calendar,
    languages: [{ name: "TypeScript", value: 3 }],
    repos: [{ name: "Public-example", url: "https://github.com/DeadIndian/Gamify", description: "A deterministic test repository.", language: "TypeScript", stars: 7, forks: 2, archived: true, updatedAt: date }],
  },
  wakatime: {
    totalSeconds: 72000, dailyAverageSeconds: 1800, range: "all_time", start: null, end: null, bestDay: null,
    languages: [{ name: "TypeScript", percent: 70, seconds: 50400 }], editors: [{ name: "VS Code", percent: 100 }],
  },
  discord: { username: "deadindian", displayName: "Dead Indian", status: "offline", avatarUrl: null, platforms: [], customStatus: null, activities: [] },
  spotify: { isPlaying: false, title: null, artist: null, album: null, albumArt: null, trackUrl: null, durationMs: 0, progressMs: 0, sampledAt: date },
  leetcode: { totalSolved: 10, ranking: 900, easy: 7, medium: 3, hard: 0, totalEasy: 100, totalMedium: 100, totalHard: 100, submissions: 4, acceptanceRate: null, calendar },
};

async function enterJourney(page: Page) {
  await page.getByRole("button", { name: "DeadIndian", exact: true }).click();
  await expect(page.locator(".world-root")).toHaveAttribute("data-world", "journey");
  await expect(page.locator(".journey-root")).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/signals/*", (route) => {
    const provider = route.request().url().split("/").at(-1) as keyof typeof fixtures;
    return route.fulfill({ json: { status: "ok", source: "Deterministic test fixture", updatedAt: date, data: fixtures[provider] } });
  });
  await page.route("**/api/writing", (route) => route.fulfill({ json: { status: "unconfigured", profileUrl: null, updatedAt: null, articles: [] } }));
  await page.goto("/");
  await expect(page.locator(".world-root")).toHaveAttribute("data-world", "desktop");
});

test("the professional desktop renders real 3D and responds to its rotation control", async ({ page }) => {
  await page.getByRole("button", { name: "Close readme.md", exact: true }).click();
  const scene = page.locator(".world-scene");
  await expect(scene).toHaveAttribute("data-scene-ready", "true", { timeout: 45000 });
  await expect(scene).toHaveAttribute("data-webgl", "available");
  const canvas = scene.locator("canvas");
  const before = await canvas.screenshot({ style: "main { visibility: hidden !important; }" });
  await page.getByRole("button", { name: "Rotate retro computer" }).click();
  const after = await canvas.screenshot({ style: "main { visibility: hidden !important; }" });
  expect(after.equals(before)).toBe(false);
});

test("desktop windows drag, resize, minimize, restore, maximize and open actual project files", async ({ page }, testInfo) => {
  await page.getByRole("button", { name: "Open Projects", exact: true }).click();
  const directory = page.locator('[data-window-id="projects"]');
  await expect(directory.locator(".project-file")).toHaveCount(20);
  let movedX: number | undefined;
  if (testInfo.project.name === "desktop") {
    const title = (await directory.locator(".desktop-window-title").boundingBox())!;
    await page.mouse.move(title.x + 180, title.y + 18);
    await page.mouse.down(); await page.mouse.move(title.x + 105, title.y + 18, { steps: 6 }); await page.mouse.up();
    const initial = (await directory.boundingBox())!;
    expect(initial.x).toBeLessThan(title.x - 35);
    const handle = (await directory.locator('[data-edge="w"]').boundingBox())!;
    await page.mouse.move(handle.x + 3, handle.y + 30); await page.mouse.down();
    await page.mouse.move(handle.x + 73, handle.y + 30, { steps: 6 }); await page.mouse.up();
    const resized = (await directory.boundingBox())!;
    expect(resized.width).toBeLessThan(initial.width - 40);
    expect(resized.x + resized.width).toBeCloseTo(initial.x + initial.width, 0);
    movedX = resized.x;
  }
  await page.getByRole("button", { name: "Minimize Project directory", exact: true }).click();
  await expect(directory).not.toBeVisible();
  await page.getByRole("navigation", { name: "Workspace dock" }).getByRole("button", { name: "Projects", exact: true }).click();
  await expect(directory).toBeVisible();
  if (movedX !== undefined) expect((await directory.boundingBox())!.x).toBeCloseTo(movedX, 0);
  await page.getByRole("button", { name: "Maximize Project directory", exact: true }).click();
  await expect(directory).toHaveClass(/is-maximized/);
  if (testInfo.project.name === "desktop") {
    expect(await directory.evaluate((node) => Number(getComputedStyle(node).zIndex))).toBeGreaterThan(
      await page.locator(".desktop-dock").evaluate((node) => Number(getComputedStyle(node).zIndex)),
    );
  }
  await page.getByRole("button", { name: "Restore Project directory", exact: true }).click();
  await directory.locator(".project-file").filter({ hasText: "Tailscale Plasma Widget" }).click();
  const file = page.locator('[data-window-id="project:tailscale-widget"]');
  await expect(file).toBeVisible();
  await expect(file.getByRole("link", { name: "Read the source", exact: true })).toHaveAttribute("href", "https://github.com/DeadIndian/tailscale-widget");
  await page.keyboard.press("Escape");
  await expect(file).toHaveCount(0);
  await expect(directory).toBeVisible();
});

test("handmade builds, Linux, Recurse and writing retain their detailed applications", async ({ page }) => {
  await page.getByRole("button", { name: "Open No-AI work", exact: true }).click();
  const shelf = page.locator('[data-window-id="handmade"]');
  await expect(shelf.locator(".floppy")).toHaveCount(6);
  await expect(shelf).toContainText("not to other projects or this portfolio");
  await page.getByRole("button", { name: "Close The no-AI collection", exact: true }).click();
  await page.getByRole("button", { name: "Open My Linux", exact: true }).click();
  await expect(page.locator('[data-window-id="linux"]')).toContainText("Debian / Dell OptiPlex");
  await page.getByRole("button", { name: "Close Linux & the home lab", exact: true }).click();
  await page.getByRole("button", { name: "Open Community", exact: true }).click();
  await expect(page.locator('[data-window-id="opensource"]')).toContainText("Club Head / Recurse, KMIT");
  await expect(page.locator(".patch-list > a")).toHaveCount(4);
  await page.getByRole("button", { name: "Close Open source & Recurse", exact: true }).click();
  await page.getByRole("button", { name: "Open Writing", exact: true }).click();
  await expect(page.locator('[data-window-id="writing"] .writing-entry')).toHaveCount(3);
  await expect(page.locator(".medium-panel")).toContainText("MEDIUM FEED NOT CONNECTED YET");
});

test("the desktop terminal keeps its commands and hands off to the journey", async ({ page }) => {
  await page.keyboard.press("/");
  const input = page.locator("#terminal-input");
  await expect(input).toBeFocused();
  await input.fill("who"); await page.keyboard.press("Tab");
  await expect(input).toHaveValue("whoami"); await page.keyboard.press("Enter");
  await expect(page.locator(".terminal-dialog").getByRole("log")).toContainText("Club Head, Recurse");
  await input.fill("projects"); await page.keyboard.press("Enter");
  await expect(page.locator(".terminal-dialog")).not.toBeVisible();
  await expect(page.locator('[data-window-id="projects"]')).toBeVisible();
  await page.keyboard.press("Control+k"); await expect(input).toBeFocused();
  await input.fill("theme"); await page.keyboard.press("Enter");
  await expect(page.locator(".world-root")).toHaveAttribute("data-world", "journey");
  await expect(page.locator(".terminal-dialog")).not.toBeVisible();
  await page.locator(".journey-root #journey-return").click();
  await expect(page.locator(".personal-desktop")).toBeVisible();
  await page.keyboard.press("/"); await expect(input).toBeFocused();
  await input.fill("whoami"); await page.keyboard.press("Enter");
  await expect(page.locator(".terminal-dialog").getByRole("log")).toContainText("Club Head, Recurse");
  await page.keyboard.press("Escape");
  await expect(page.locator(".terminal-dialog")).not.toBeVisible();
  await expect(page.locator('[data-window-id="projects"]')).toBeVisible();
});

test("feed UI distinguishes idle from failure and survives independent provider errors", async ({ page }) => {
  await page.getByRole("navigation", { name: "Workspace dock" }).getByRole("button", { name: "Now", exact: true }).click();
  await expect(page.locator(".github-stats")).toContainText("12");
  await expect(page.locator(".discord-signal")).toContainText("offline");
  await expect(page.locator(".spotify-signal")).toContainText("Between soundtracks.");
  await page.route("**/api/signals/wakatime", (route) => route.fulfill({ json: { status: "unavailable", source: "Test fixture", updatedAt: null, data: null } }));
  await page.getByRole("button", { name: "Refresh feeds", exact: true }).click();
  await expect(page.locator(".wakatime-signal")).toContainText("UNAVAILABLE");
  await expect(page.locator(".github-stats")).toContainText("12");
});

test("contact and print actions work without serializing private resume fields", async ({ page, context }) => {
  const html = await page.content();
  expect(html).not.toContain(resume.personalInfo.dob); expect(html).not.toContain(resume.personalInfo.phone);
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.getByRole("navigation", { name: "Workspace dock" }).getByRole("button", { name: "Contact", exact: true }).click();
  await page.getByRole("button", { name: "Copy email", exact: true }).click();
  await expect(page.getByRole("button", { name: "Email copied", exact: true })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(resume.personalInfo.email);
  await page.getByRole("link", { name: "Read / download my resume" }).click();
  await expect(page).toHaveURL(/\/resume$/);
  await expect(page.locator(".resume-sheet")).toContainText("Club Head");
  await page.evaluate(() => { window.print = () => document.documentElement.setAttribute("data-print-invoked", "true"); });
  await page.getByRole("button", { name: "Print / Save PDF" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-print-invoked", "true");
});

test("narrow viewports and reduced motion keep the desktop usable", async ({ page }) => {
  await expect(page.locator(".world-root")).toHaveAttribute("data-motion", "off");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator(".desktop-dock")).toBeInViewport();
  await page.getByRole("button", { name: "Open My Linux", exact: true }).click();
  const bounds = (await page.locator('[data-window-id="linux"]').boundingBox())!;
  expect(bounds.x).toBeGreaterThanOrEqual(0); expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
  await expect(page.getByRole("button", { name: "Close Linux & the home lab" })).toBeInViewport();
});

test("animated persona transitions complete and return keyboard focus", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.getByRole("button", { name: "DeadIndian", exact: true }).press("Enter");
  await expect(page.locator(".world-root")).toHaveAttribute("data-world", "journey");
  const back = page.locator(".journey-root").getByRole("button", { name: "Return to Bharath’s desktop", exact: true });
  await expect(back).toBeFocused();
  await back.press("Enter");
  await expect(page.locator(".personal-desktop")).toBeVisible();
  await expect(page.getByRole("button", { name: "DeadIndian", exact: true })).toBeFocused();
});

test("both worlds and their content pass automated accessibility checks", async ({ page }) => {
  const check = async () => {
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }))).toEqual([]);
  };
  await check();
  await enterJourney(page);
  await expect(page.locator('.journey-root .chapter[data-active="true"] h1')).toBeVisible();
  await check();
  await page.locator('.journey-root [data-story="0"]').click();
  await expect(page.locator(".journey-root #story-dialog")).toBeVisible();
  await check();
  await page.keyboard.press("Escape");
  await page.locator(".journey-root #journey-return").click();
  await page.getByRole("button", { name: "Open No-AI work", exact: true }).click(); await check();
});
