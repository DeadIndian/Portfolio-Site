import { expect, test as base } from "@playwright/test";

const canonicalOrigin = "https://gollabharath.me";
const test = base.extend({
  page: async ({ page }, run) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("**/api/signals/*", (route) =>
      route.fulfill({
        json: {
          status: "unavailable",
          source: "Deterministic release QA fixture (not live data)",
          updatedAt: null,
          data: null,
        },
      }),
    );
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
    await run(page);
    expect(errors, "Uncaught browser errors").toEqual([]);
  },
});

test.use({ reducedMotion: "reduce" });

test("production routes enforce security headers and real 404s", async ({
  request,
}) => {
  for (const [path, status] of [
    ["/", 200],
    ["/resume", 200],
    ["/credits", 200],
    ["/release-qa-not-found", 404],
    ["/api/release-qa-not-found", 404],
    ["/api/signals/release-qa-not-a-provider", 404],
  ] as const) {
    const response = await request.get(path);
    expect.soft(response.status(), path).toBe(status);
    expect.soft(response.headers(), path).toMatchObject({
      "x-content-type-options": "nosniff",
      "x-frame-options": "DENY",
      "referrer-policy": "strict-origin-when-cross-origin",
      "permissions-policy": "camera=(), microphone=(), geolocation=()",
    });
    expect.soft(response.headers()["x-powered-by"], path).toBeUndefined();
  }
});

test("public pages publish canonical metadata and valid local images", async ({
  page,
  request,
}) => {
  const assets = new Set<string>();
  for (const [path, title] of [
    ["/", /Golla Bharath/],
    ["/resume", /Golla Bharath.*Resume/],
    ["/credits", /Asset Credits/],
  ] as const) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    await expect(page).toHaveTitle(title);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      /\S/,
    );
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute("href", /^https:\/\//);
    const url = new URL((await canonical.getAttribute("href"))!);
    expect(url.origin, path).toBe(canonicalOrigin);
    expect(url.pathname, path).toBe(path);
    for (const property of ["og:title", "og:description", "og:image:alt"]) {
      await expect(
        page.locator(`meta[property="${property}"]`).first(),
      ).toHaveAttribute("content", /\S/);
    }
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary_large_image",
    );
    for (const [selector, attribute] of [
      ['meta[property="og:image"]', "content"],
      ['link[rel="icon"]', "href"],
      ['link[rel="apple-touch-icon"]', "href"],
    ]) {
      const tags = page.locator(selector);
      await expect(tags.first()).toHaveAttribute(attribute, /\S/);
      const values = await tags.evaluateAll(
        (elements, attribute) =>
          elements.map((element) => element.getAttribute(attribute)!),
        attribute,
      );
      for (const value of values) {
        const asset = new URL(
          value,
          attribute === "href" ? canonicalOrigin : undefined,
        );
        expect(asset.origin, `${path}: ${selector}`).toBe(canonicalOrigin);
        assets.add(`${asset.pathname}${asset.search}`);
      }
    }
  }
  for (const path of assets) {
    // Resolve canonical asset paths on the server under test, not the live site.
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect(response.headers()["content-type"], path).toMatch(/^image\//);
    const size = await page.evaluate(async (src) => {
      const image = new Image();
      image.src = src;
      await image.decode();
      return [image.naturalWidth, image.naturalHeight];
    }, path);
    expect(size[0], path).toBeGreaterThan(0);
    expect(size[1], path).toBeGreaterThan(0);
  }
});

test("critical portfolio journey works without live providers", async ({
  page,
}, testInfo) => {
  const consoleErrors: string[] = [];
  let usedFallback = false;
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  async function checkDesktopScene(label: string) {
    const scene = page.locator(".world-scene");
    await expect(
      page.locator(
        '.world-scene[data-webgl="available"][data-scene-ready="true"], .world-scene[data-webgl="unavailable"] .scene-fallback',
      ),
    ).toBeVisible();
    const fallback = (await scene.getAttribute("data-webgl")) === "unavailable";
    usedFallback ||= fallback;
    testInfo.annotations.push({
      type: "scene",
      description: `${label}: ${fallback ? "explicit static fallback (no WebGL coverage)" : "ready WebGL"}`,
    });
    if (fallback) {
      await expect(scene.locator(".scene-fallback")).toContainText(
        "Static preview. Interactive 3D is unavailable.",
      );
      const poster = scene.locator(".scene-fallback img");
      await expect(poster).toHaveJSProperty("complete", true);
      expect(
        await poster.evaluate((image) => (image as HTMLImageElement).naturalWidth),
      ).toBeGreaterThan(0);
    } else {
      const canvas = scene.locator("canvas");
      await expect(canvas).toBeVisible();
      expect(
        await canvas.evaluate((element) => {
          const gl = (element as HTMLCanvasElement).getContext("webgl2");
          return !!gl && !gl.isContextLost() &&
            gl.drawingBufferWidth > 0 && gl.drawingBufferHeight > 0;
        }),
      ).toBe(true);
    }
  }

  async function checkJourneyScene(chapter: string) {
    const journey = page.locator(".journey-root");
    const host = journey.locator("#universe");
    await expect(journey).toHaveAttribute("data-world", chapter);
    await expect(
      journey.locator('#universe[data-ready="true"], #universe[data-fallback="true"]'),
    ).toBeVisible({ timeout: 45000 });
    const fallback = (await host.getAttribute("data-fallback")) === "true";
    usedFallback ||= fallback;
    testInfo.annotations.push({
      type: "scene",
      description: `journey/${chapter}: ${fallback ? "explicit static fallback (no WebGL coverage)" : "ready WebGL"}`,
    });
    if (fallback) {
      const poster = journey.locator("#scene-poster img");
      await expect(poster).toHaveAttribute("src", new RegExp(`/${chapter}\\.webp$`));
      await expect.poll(() => poster.evaluate((image) =>
        (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0,
      )).toBe(true);
      await expect(journey.locator("#render-status")).toContainText("Static view");
    } else {
      await expect(host).toHaveAttribute("data-rendered-world", chapter);
      const canvas = host.locator("canvas");
      await expect(canvas).toBeVisible();
      expect(await canvas.evaluate((element) => {
        const gl = (element as HTMLCanvasElement).getContext("webgl2");
        return !!gl && !gl.isContextLost() && gl.drawingBufferWidth > 0 && gl.drawingBufferHeight > 0;
      })).toBe(true);
    }
  }

  await page.goto("/");
  const world = page.locator(".world-root");
  await expect(world).toHaveAttribute("data-world", "desktop");
  await checkDesktopScene("initial desktop");
  await page.getByRole("button", { name: "Open Projects", exact: true }).press("Enter");
  const directory = page.locator('[data-window-id="projects"]');
  await expect(directory).toBeVisible();
  await expect(directory.locator(".project-file")).toHaveCount(20);
  const projectTrigger = directory.locator(".project-file").filter({ hasText: "Tailscale Plasma Widget" });
  await projectTrigger.press("Enter");
  const dossier = page.locator('[data-window-id="project:tailscale-widget"]');
  await expect(dossier).toBeVisible();
  await expect(
    dossier.getByRole("link", { name: "Read the source", exact: true }),
  ).toHaveAttribute("href", "https://github.com/DeadIndian/tailscale-widget");
  await page.keyboard.press("Escape");
  await expect(dossier).toHaveCount(0);
  await expect(directory).toBeVisible();

  await page.getByRole("button", { name: "DeadIndian", exact: true }).press("Enter");
  await expect(world).toHaveAttribute("data-world", "journey");
  const journey = page.locator(".journey-root");
  await expect(journey).toHaveAttribute("data-motion", "off");
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(journey.locator(".world-node")).toHaveCount(6);
  await checkJourneyScene("blocks");
  await journey.locator('.world-node[data-index="2"]').click();
  await checkJourneyScene("reactor");

  // Keyboard activation makes focus return independent of Safari's click policy.
  const storyTrigger = journey.locator('[data-story="2"]');
  await storyTrigger.press("Enter");
  const story = journey.locator("#story-dialog");
  await expect(story).toBeVisible();
  await expect(story.locator(".story-source")).toHaveAttribute("href", "https://github.com/DeadIndian/Jarvis");
  await page.keyboard.press("Escape");
  await expect(story).not.toBeVisible();
  await expect(storyTrigger).toBeFocused();
  await journey.locator("#map-button").press("Enter");
  await journey.locator('#map-dialog [data-destination="3"]').press("Enter");
  await expect(journey.locator("#map-dialog")).not.toBeVisible();
  await expect(journey).toHaveAttribute("data-world", "linux");
  await expect(page).toHaveURL(/#linux$/);

  await journey.getByRole("button", { name: "Return to Bharath’s desktop", exact: true }).press("Enter");
  await expect(world).toHaveAttribute("data-world", "desktop");
  await expect(journey).not.toBeVisible();
  await expect(directory).toBeVisible();
  await expect(page.getByRole("button", { name: "DeadIndian", exact: true })).toBeFocused();
  await checkDesktopScene("returned desktop");
  await page.getByRole("navigation", { name: "Workspace dock" }).getByRole("button", { name: "Writing", exact: true }).click();
  const writing = page.getByRole("dialog", {
    name: "Technical writing",
    exact: true,
  });
  await expect(writing).toBeVisible();
  await expect(writing.locator(".medium-panel")).toContainText(
    "MEDIUM FEED NOT CONNECTED YET",
  );
  const terminalTrigger = page
    .getByRole("navigation", { name: "Workspace dock" })
    .getByRole("button", { name: "Open terminal", exact: true });
  await terminalTrigger.press("Enter");
  const terminal = page.getByRole("dialog", {
    name: "PORTFOLIO / INTERACTIVE SHELL",
    exact: true,
  });
  const input = terminal.getByRole("textbox");
  await expect(input).toBeFocused();
  await input.fill("whoami");
  await input.press("Enter");
  await expect(terminal.getByRole("log")).toContainText(
    "Club Head, Recurse",
  );
  await page.keyboard.press("Escape");
  await expect(terminal).not.toBeVisible();
  await expect(terminalTrigger).toBeFocused();
  await writing
    .getByRole("button", { name: "Close Technical writing", exact: true })
    .click();
  await page.getByRole("navigation", { name: "Workspace dock" }).getByRole("button", { name: "Contact", exact: true }).click();
  await page.getByRole("link", { name: "Read / download my resume", exact: true }).click();
  await expect(page).toHaveURL(/\/resume$/);
  await expect(
    page.getByRole("heading", { name: /Golla Bharath/, level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Print / Save PDF" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Back to portfolio" }),
  ).toHaveAttribute("href", "/");

  const unexpected = consoleErrors.filter((message) => {
    if (
      usedFallback &&
      /Error creating WebGL context|Failed to create WebGL context|WebGL context could not be created/i.test(message)
    ) {
      testInfo.annotations.push({
        type: "webgl-capability",
        description: message,
      });
      return false;
    }
    return true;
  });
  expect(
    unexpected,
    "Unexpected console errors, including 3D/shader failures",
  ).toEqual([]);
});
