import { expect, test as base, type Page } from "@playwright/test";

const worlds = ["blocks", "voyage", "reactor", "linux", "connections", "beyond"] as const;
type World = typeof worlds[number];

const test = base.extend({
  page: async ({ page }, run) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.route("**/api/signals/*", (route) => route.fulfill({
      json: { status: "unavailable", source: "Journey integration fixture", updatedAt: null, data: null },
    }));
    await page.route("**/api/writing", (route) => route.fulfill({
      json: { status: "unconfigured", profileUrl: null, updatedAt: null, articles: [] },
    }));
    await run(page);
    expect(errors, "Uncaught browser errors").toEqual([]);
  },
});

async function expectWorld(page: Page, world: World, rendered = false) {
  const journey = page.locator(".journey-root");
  await expect(page.locator(".world-root")).toHaveAttribute("data-world", "journey");
  await expect(journey).toBeVisible();
  await expect(journey).toHaveJSProperty("inert", false);
  await expect(journey).toHaveAttribute("data-world", world);
  await expect(journey.locator(`.world-node[data-index="${worlds.indexOf(world)}"]`)).toHaveAttribute("aria-current", "step");
  await expect(journey.locator(`.chapter[data-chapter="${world}"] h1`)).toBeVisible();
  if (rendered) {
    const host = journey.locator("#universe");
    await expect(host).toHaveAttribute("data-ready", "true", { timeout: 45000 });
    await expect(host).toHaveAttribute("data-rendered-world", world);
    await expect(host).toHaveAttribute("data-progress", worlds.indexOf(world).toFixed(4));
    await expect(host.locator("canvas")).toHaveCount(1);
  }
}

async function nextFrames(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
}

test("desktop windows, content settings and renderers survive two persona round trips", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Window geometry is covered once at the desktop viewport.");
  test.setTimeout(90000);
  await page.route("**/api/signals/github", (route) => route.fulfill({
    json: {
      status: "ok", source: "Deterministic repository sorting fixture", updatedAt: "2026-10-01T12:00:00Z",
      data: {
        username: "DeadIndian", followers: 8, publicRepos: 2, stars: 10, contributions: [],
        languages: [{ name: "TypeScript", value: 2 }],
        repos: [
          { name: "Stars-first", url: "https://github.com/DeadIndian/Gamify", description: "Older fixture", language: "TypeScript", stars: 9, forks: 2, archived: false, updatedAt: "2026-09-01T12:00:00Z" },
          { name: "Recent-first", url: "https://github.com/DeadIndian/Jarvis", description: "Newer fixture", language: "TypeScript", stars: 1, forks: 0, archived: false, updatedAt: "2026-10-01T12:00:00Z" },
        ],
      },
    },
  }));
  await page.goto("/");
  await expect(page.locator(".world-scene")).toHaveAttribute("data-scene-ready", "true", { timeout: 45000 });
  const desktopCanvas = page.locator(".world-scene canvas");
  await desktopCanvas.evaluate((node) => node.setAttribute("data-integration-retained", "desktop"));
  await page.getByRole("button", { name: "Close readme.md", exact: true }).click();
  await page.getByRole("button", { name: "Open Projects", exact: true }).click();
  const projects = page.locator('[data-window-id="projects"]');
  const title = (await projects.locator(".desktop-window-title").boundingBox())!;
  await page.mouse.move(title.x + 180, title.y + 18);
  await page.mouse.down();
  await page.mouse.move(title.x + 105, title.y + 18, { steps: 6 });
  await page.mouse.up();
  const moved = (await projects.boundingBox())!;
  expect(moved.x).toBeLessThan(title.x - 35);
  const handle = (await projects.locator('[data-edge="w"]').boundingBox())!;
  await page.mouse.move(handle.x + 3, handle.y + 30);
  await page.mouse.down();
  await page.mouse.move(handle.x + 63, handle.y + 30, { steps: 6 });
  await page.mouse.up();
  expect((await projects.boundingBox())!.width).toBeLessThan(moved.width - 30);
  await projects.locator(".desktop-window-body").evaluate((node) => { node.scrollTop = 180; });
  await expect.poll(() => projects.locator(".desktop-window-body").evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Open My Linux", exact: true }).click();
  const linux = page.locator('[data-window-id="linux"]');
  await linux.getByRole("button", { name: "Minimize Linux & the home lab", exact: true }).click();
  const dock = page.getByRole("navigation", { name: "Workspace dock" });
  await dock.getByRole("button", { name: "Now", exact: true }).click();
  const signals = page.locator('[data-window-id="signals"]');
  await signals.getByText("Repositories & languages", { exact: true }).click();
  await signals.getByLabel("Sort repositories").selectOption("updated");
  await expect(signals.locator(".github-repos a").first()).toContainText("Recent-first");
  await signals.getByRole("button", { name: "Maximize Live signals", exact: true }).click();

  const snapshot = () => page.locator(".personal-desktop").evaluate((desktop) => {
    const styles = getComputedStyle(desktop);
    return {
      windows: [...desktop.querySelectorAll<HTMLElement>(".desktop-window")].map((node) => {
        const box = node.getBoundingClientRect();
        return {
          id: node.dataset.windowId, minimized: node.hidden, maximized: node.classList.contains("is-maximized"),
          zIndex: getComputedStyle(node).zIndex,
          rectangle: [box.x, box.y, box.width, box.height].map((value) => Math.round(value * 100) / 100),
        };
      }),
      projectScroll: desktop.querySelector('[data-window-id="projects"] .desktop-window-body')?.scrollTop,
      repositorySort: desktop.querySelector<HTMLSelectElement>(".repo-sort select")?.value,
      repositoryDetailsOpen: desktop.querySelector(".github-signal .signal-details")?.hasAttribute("open"),
      font: styles.fontFamily,
      text: styles.getPropertyValue("--d-text"),
      surface: styles.getPropertyValue("--d-surface"),
      wallpaper: getComputedStyle(desktop.querySelector(".desktop-wallpaper")!).backgroundImage,
      background: getComputedStyle(desktop.closest(".world-root")!).backgroundColor,
    };
  });
  const before = await snapshot();
  expect(before.repositorySort).toBe("updated");
  expect(before.repositoryDetailsOpen).toBe(true);
  const shell = page.locator('.world-shell[data-shell="desktop"]');
  const journey = page.locator(".journey-root");
  for (let trip = 0; trip < 2; trip++) {
    await page.getByRole("button", { name: "DeadIndian", exact: true }).click();
    await expect(shell).toHaveJSProperty("hidden", true);
    await expect(shell).toHaveJSProperty("inert", true);
    await expect(page.locator("iframe")).toHaveCount(0);
    if (trip === 0) {
      await expectWorld(page, "blocks", true);
      await journey.locator('.world-node[data-index="3"]').click();
      await expectWorld(page, "linux", true);
      await journey.locator('[data-action="3"]').click();
      await journey.locator("#universe canvas").evaluate((node) => node.setAttribute("data-integration-retained", "journey"));
    } else {
      await expectWorld(page, "linux", true);
    }
    await expect(journey.locator('[data-chapter="linux"] .action-status')).toContainText("Kubuntu");
    await expect(journey.locator("#universe canvas")).toHaveAttribute("data-integration-retained", "journey");
    await journey.locator("#journey-return").click();
    await expect(page.locator(".world-root")).toHaveAttribute("data-world", "desktop");
    await expect(shell).toHaveJSProperty("hidden", false);
    await expect(shell).toHaveJSProperty("inert", false);
    await expect(journey).toHaveJSProperty("hidden", true);
    await expect(journey).toHaveJSProperty("inert", true);
    await expect.poll(snapshot).toEqual(before);
    await expect(desktopCanvas).toHaveAttribute("data-integration-retained", "desktop");
    await expect(linux).not.toBeVisible();
    await expect(signals).toHaveClass(/is-maximized/);
  }
  await signals.getByRole("button", { name: "Restore Live signals", exact: true }).click();
  await expect(signals.getByLabel("Sort repositories")).toHaveValue("updated");
  await dock.getByRole("button", { name: "My Linux", exact: true }).click();
  await expect(linux).toBeVisible();
});

test("chapter deep links, map navigation and browser history keep the two personas in sync", async ({ page }, testInfo) => {
  test.setTimeout(90000);
  await page.goto("/#reactor");
  await expectWorld(page, "reactor", true);
  const journey = page.locator(".journey-root");
  await journey.locator('.world-node[data-index="3"]').click();
  await expectWorld(page, "linux");
  await expect(page).toHaveURL(/#linux$/);
  await journey.locator("#map-button").click();
  await journey.locator('#map-dialog [data-destination="4"]').click();
  await expect(journey.locator("#map-dialog")).not.toBeVisible();
  await expectWorld(page, "connections");
  await expect(page).toHaveURL(/#connections$/);
  await page.goBack();
  await expectWorld(page, "linux");
  await page.goBack();
  await expectWorld(page, "reactor");
  await page.goForward();
  await expectWorld(page, "linux");
  await journey.locator("#journey-return").click();
  await expect(page).toHaveURL(/#desktop$/);
  await expect(page.locator(".personal-desktop")).toBeVisible();
  await page.goBack();
  await expectWorld(page, "linux", true);
  if (testInfo.project.name === "desktop") {
    await page.reload();
    await expectWorld(page, "linux", true);
    await expect(page).toHaveURL(/#linux$/);
  }
});

test("the 28-part suit can finish loading offscreen and keeps its disassembly state", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The standalone suite covers suit geometry at mobile sizes.");
  test.setTimeout(90000);
  let releaseModel = () => {};
  let modelRequested = false;
  let servedModel: Buffer | undefined;
  const modelGate = new Promise<void>((resolve) => { releaseModel = resolve; });
  await page.route("**/journey/assets/iron-man/suit.glb", async (route) => {
    modelRequested = true;
    await modelGate;
    const response = await route.fetch();
    expect(response.ok(), "The deployed suit asset loads successfully").toBe(true);
    servedModel = await response.body();
    await route.fulfill({ response, body: servedModel });
  });
  try {
    await page.goto("/#reactor", { waitUntil: "domcontentloaded" });
    await expectWorld(page, "reactor");
    await expect.poll(() => modelRequested, { timeout: 45000 }).toBe(true);
    const journey = page.locator(".journey-root");
    const action = journey.locator('[data-action="2"]');
    await action.press("Enter");
    await expect(action).toHaveAttribute("aria-pressed", "true");
    await journey.locator("#journey-return").click();
    await expect(page.locator(".world-root")).toHaveAttribute("data-world", "desktop");
    releaseModel();
    await expect.poll(() => servedModel?.byteLength ?? 0, { timeout: 45000 }).toBeGreaterThan(20);

    // Inspect the bytes actually served to the browser, without a production-only review hook.
    const bytes = servedModel!;
    expect(bytes.readUInt32LE(0)).toBe(0x46546c67);
    expect(bytes.readUInt32LE(4)).toBe(2);
    expect(bytes.readUInt32LE(16)).toBe(0x4e4f534a);
    const model = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString("utf8")) as {
      scene?: number; scenes: { nodes: number[] }[]; nodes: { name?: string }[];
    };
    const names = model.scenes[model.scene ?? 0].nodes.map((index) => model.nodes[index].name);
    expect(names).toContain("Internal frame");
    const armor = names.filter((name) => name !== "Internal frame");
    expect(armor).toHaveLength(28);
    expect(new Set(armor).size).toBe(28);
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#1b1f26");
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await page.getByRole("button", { name: "DeadIndian", exact: true }).click();
    await expectWorld(page, "reactor", true);
    await expect(action).toHaveAttribute("aria-pressed", "true");
    await expect(action).toContainText("Reassemble the suit");
    const canvas = journey.locator("#universe canvas");
    const expanded = await canvas.screenshot();
    await action.click();
    await expect(action).toHaveAttribute("aria-pressed", "false");
    await expect(action).toContainText("Disassemble the suit");
    await nextFrames(page);
    const assembled = await canvas.screenshot();
    expect(assembled.equals(expanded), "Disassembly changes the rendered suit").toBe(false);
    await action.click();
    await nextFrames(page);
    await action.click();
    await nextFrames(page);
    expect((await canvas.screenshot()).equals(assembled), "Reassembly returns the armor to its original pose").toBe(true);
  } finally {
    releaseModel();
  }
});

test("motion pauses for hidden personas and dialogs and responds to the system preference", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Sample render timing once; mobile navigation is covered separately.");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#blocks");
  await expectWorld(page, "blocks", true);
  const journey = page.locator(".journey-root");
  const host = journey.locator("#universe");
  const time = async () => Number(await host.getAttribute("data-time"));
  const expectPaused = async () => {
    await nextFrames(page);
    const stoppedAt = await time();
    // Compare separated samples to detect a live animation loop behind hidden UI.
    await page.waitForTimeout(180);
    expect(await time()).toBe(stoppedAt);
    return stoppedAt;
  };
  await expect.poll(time).toBeGreaterThan(0);
  await journey.locator('[data-story="0"]').click();
  await expect(journey.locator("#story-dialog")).toBeVisible();
  const behindDialog = await expectPaused();
  await page.keyboard.press("Escape");
  await expect.poll(time).toBeGreaterThan(behindDialog);
  await journey.locator("#motion-button").click();
  await expect(journey).toHaveAttribute("data-motion", "off");
  const pausedAt = await expectPaused();
  await journey.locator('.world-node[data-index="1"]').click();
  await expectWorld(page, "voyage", true);
  expect(await time()).toBe(pausedAt);
  await journey.locator("#motion-button").click();
  await expect(journey).toHaveAttribute("data-motion", "on");
  await expect.poll(time).toBeGreaterThan(pausedAt);
  await journey.locator("#journey-return").click();
  await expect(journey).toHaveJSProperty("hidden", true);
  const behindDesktop = await expectPaused();
  await page.getByRole("button", { name: "Open Projects", exact: true }).click();
  await expect(page).toHaveURL(/#desktop$/);
  await page.getByRole("button", { name: "DeadIndian", exact: true }).click();
  await expectWorld(page, "voyage", true);
  await expect.poll(time).toBeGreaterThan(behindDesktop);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(journey).toHaveAttribute("data-motion", "off");
  const reducedAt = await expectPaused();
  await journey.locator("#next-world").click();
  await expectWorld(page, "reactor", true);
  expect(await time()).toBe(reducedAt);
});

test("native journey navigation and dialogs keep keyboard focus within the active persona", async ({ page }) => {
  await page.goto("/#deadindian");
  await expectWorld(page, "blocks");
  const journey = page.locator(".journey-root");
  await journey.locator(".skip-link").press("Enter");
  await expect(journey.locator("#journey-controls")).toBeFocused();
  await journey.locator('.world-node[data-index="0"]').press("ArrowRight");
  await expectWorld(page, "voyage");
  await expect(journey.locator('.world-node[data-index="1"]')).toBeFocused();
  await journey.locator('.world-node[data-index="1"]').press("End");
  await expectWorld(page, "beyond");
  await expect(journey.locator('.world-node[data-index="5"]')).toBeFocused();
  await journey.locator('.world-node[data-index="5"]').press("Home");
  await expectWorld(page, "blocks");
  await page.keyboard.press("/");
  await page.keyboard.press("Control+k");
  await expect(page.locator(".terminal-dialog")).not.toBeVisible();
  const storyTrigger = journey.locator('[data-story="0"]');
  await storyTrigger.press("Enter");
  const story = journey.locator("#story-dialog");
  await expect(story).toBeVisible();
  await expect(story.locator(".dialog-close")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(story).not.toBeVisible();
  await expect(storyTrigger).toBeFocused();

  await journey.locator("#journey-return").press("Enter");
  const switcher = page.getByRole("button", { name: "DeadIndian", exact: true });
  await expect(switcher).toBeFocused();
  await switcher.press("Enter");
  await expectWorld(page, "blocks");
  await storyTrigger.press("Enter");
  await expect(story).toBeVisible();
  await page.goBack();
  await expect(page.locator(".world-root")).toHaveAttribute("data-world", "desktop");
  await expect(journey.locator("dialog[open]")).toHaveCount(0);
  await expect(page.locator("html")).not.toHaveClass(/dialog-open/);
  await expect(switcher).toBeFocused();
  await page.goForward();
  await expectWorld(page, "blocks");
  await expect(journey.locator("#journey-return")).toBeFocused();
});

test("mobile navigation, suit posters and desktop applications work without WebGL", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Exercise the integrated fallback on a coarse-pointer mobile viewport.");
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, kind: string, ...args: unknown[]) {
      if (kind.includes("webgl")) return null;
      return original.apply(this, [kind, ...args] as Parameters<typeof original>);
    } as typeof original;
  });
  await page.goto("/#reactor");
  await expectWorld(page, "reactor");
  const journey = page.locator(".journey-root");
  await expect(journey.locator("#universe")).toHaveAttribute("data-fallback", "true");
  const poster = journey.locator("#scene-poster img");
  const expectPoster = async (name: string) => {
    await expect(poster).toHaveAttribute("src", new RegExp(`/journey/assets/posters/${name}\\.webp$`));
    await expect.poll(() => poster.evaluate((image) =>
      (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0,
    )).toBe(true);
  };
  await expectPoster("reactor");
  await journey.locator('[data-action="2"]').click();
  await expectPoster("reactor-open");
  await journey.locator('[data-story="2"]').press("Enter");
  await expect(journey.locator("#story-dialog .story-source")).toHaveAttribute("href", "https://github.com/DeadIndian/Jarvis");
  await page.keyboard.press("Escape");
  await journey.locator('.world-node[data-index="3"]').click();
  await expectWorld(page, "linux");
  await expectPoster("linux");
  await journey.locator("#journey-return").click();
  await expect(page.locator(".world-scene")).toHaveAttribute("data-webgl", "unavailable");
  const desktopPoster = page.locator(".world-scene .scene-fallback img");
  await expect.poll(() => desktopPoster.evaluate((image) =>
    (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0,
  )).toBe(true);
  await page.getByRole("button", { name: "Open Projects", exact: true }).click();
  await page.locator('[data-window-id="projects"] .project-file').filter({ hasText: "Tailscale Plasma Widget" }).click();
  await expect(page.locator('[data-window-id="project:tailscale-widget"]').getByRole("link", { name: "Read the source", exact: true })).toHaveAttribute("href", "https://github.com/DeadIndian/tailscale-widget");
  await page.getByRole("button", { name: "DeadIndian", exact: true }).click();
  await expectWorld(page, "linux");
  await journey.locator("#map-button").click();
  await journey.locator('#map-dialog [data-destination="5"]').click();
  await expectWorld(page, "beyond");
  await expectPoster("beyond");
  await expect(journey.locator(".follow-link")).toHaveAttribute("href", "https://github.com/DeadIndian");
  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(journey.locator("#journey-return")).toBeInViewport({ ratio: 1 });
    await expect(journey.locator("#world-navigation")).toBeInViewport({ ratio: 1 });
    const title = journey.locator('.chapter[data-active="true"] h1');
    await expect(title).toBeVisible();
    expect(await title.evaluate((node) => node.scrollWidth <= node.clientWidth + 2)).toBe(true);
  }
});
