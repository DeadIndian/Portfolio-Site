import { expect, test } from "@playwright/test";
import { PerspectiveCamera, Vector3 } from "three";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/signals/*", (route) => route.fulfill({
    json: { status: "unavailable", source: "Workshop test fixture", updatedAt: null, data: null },
  }));
});

test("the Linux chapter changes a real 3D desktop, supports direct links and browser history", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/#workshop-linux");
  const scene = page.locator(".world-scene");
  await expect(scene).toHaveAttribute("data-scene-ready", "true", { timeout: 45000 });
  await expect(scene).toHaveAttribute("data-webgl", "available");
  await expect(scene).toHaveAttribute("data-chapter", "linux");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("I wiped Windows.");
  const memory = page.locator(".workshop-desktop-memory");
  await expect(memory).toContainText("Fedora / KDE");
  const canvas = scene.locator("canvas");
  const before = await canvas.screenshot();
  await page.getByRole("button", { name: "Change the desktop", exact: true }).click();
  await expect(memory).toContainText("Kubuntu");
  const after = await canvas.screenshot();
  expect(after.equals(before)).toBe(false);
  await page.getByRole("button", { name: "Change the desktop", exact: true }).click();
  await expect(memory).toContainText("Arch / Hyprland");
  await page.getByRole("button", { name: "Change the desktop", exact: true }).click();
  await expect(memory).toContainText("Fedora / KDE");

  // Exercise the mesh hit target as well as its ordinary button alternative.
  const bounds = (await canvas.boundingBox())!;
  const camera = new PerspectiveCamera(34, bounds.width / bounds.height, .1, 100);
  camera.position.set(7.8, 6.1, 10.1);
  const target = new Vector3(0, 1.35, -.1);
  camera.position.sub(target).multiplyScalar(Math.max(1, 1.12 / (bounds.width / bounds.height))).add(target);
  camera.lookAt(target); camera.updateMatrixWorld();
  const point = new Vector3(-.6, 2.245, -1.165).project(camera);
  await canvas.click({ position: { x: (point.x + 1) * bounds.width / 2, y: (1 - point.y) * bounds.height / 2 } });
  await expect(memory).toContainText("Kubuntu");

  await page.getByRole("link", { name: /03 Giving back/ }).click();
  await expect(page).toHaveURL(/#workshop-tools$/);
  await expect(scene).toHaveAttribute("data-chapter", "tools");
  await page.goBack();
  await expect(scene).toHaveAttribute("data-chapter", "linux");
  await expect(page.getByRole("link", { name: /02 Making it mine/ })).toHaveAttribute("aria-current", "step");
  await page.screenshot({ path: testInfo.outputPath("linux-chapter.png"), fullPage: true });
  expect(errors).toEqual([]);
});

test("desktop windows and the renderer survive a trip through the workshop", async ({ page }) => {
  await page.goto("/");
  const world = page.locator(".world-root");
  await expect(world).toHaveAttribute("data-world", "desktop");
  await page.getByRole("button", { name: "Open Projects", exact: true }).click();
  const projects = page.getByRole("dialog", { name: "Project directory", exact: true });
  await expect(projects).toBeVisible();
  const canvas = page.locator(".world-scene canvas");
  await expect(page.locator(".world-scene")).toHaveAttribute("data-scene-ready", "true", { timeout: 45000 });
  await canvas.evaluate((node) => node.setAttribute("data-persistence-check", "retained"));
  await page.getByRole("button", { name: "Meet DeadIndian", exact: true }).click();
  await expect(world).toHaveAttribute("data-world", "workshop");
  await expect(projects).not.toBeVisible();
  await page.getByRole("button", { name: "Bharath's desktop", exact: true }).click();
  await expect(projects).toBeVisible();
  await expect(canvas).toHaveAttribute("data-persistence-check", "retained");
});

test("the personal story and project links remain usable without WebGL", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, kind: string, ...args: unknown[]) {
      if (kind.includes("webgl")) return null;
      return original.apply(this, [kind, ...args] as Parameters<typeof original>);
    } as typeof original;
  });
  await page.goto("/#workshop-linux");
  await expect(page.locator(".world-scene")).toHaveAttribute("data-webgl", "unavailable");
  await expect(page.locator(".scene-fallback img")).toHaveJSProperty("complete", true);
  expect(await page.locator(".scene-fallback img").evaluate((node) => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Inside my Linux setup" }).click();
  await expect(page.getByRole("dialog", { name: "Linux & the home lab", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("link", { name: /01 Getting better/ }).click();
  await page.getByRole("button", { name: "Open the handmade shelf" }).click();
  await expect(page.getByRole("dialog", { name: "The no-AI collection" })).toContainText("These six Odin Project builds");
});

test("all five chapters have matching scenes and their objects perform meaningful actions", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/#workshop-learning");
  const scene = page.locator(".world-scene");
  await expect(scene).toHaveAttribute("data-scene-ready", "true", { timeout: 45000 });
  await page.getByRole("button", { name: "Open the handmade shelf", exact: true }).click();
  const handmade = page.getByRole("dialog", { name: "The no-AI collection", exact: true });
  await expect(handmade.locator(".floppy")).toHaveCount(6);
  await page.keyboard.press("Escape");
  await page.getByRole("link", { name: /03 Giving back/ }).click();
  await expect(scene).toHaveAttribute("data-chapter", "tools");
  await page.getByRole("button", { name: "Sticky Notes", exact: true }).click();
  const project = page.getByRole("dialog", { name: "Project dossier", exact: true });
  await expect(project.getByRole("link", { name: "Read the source", exact: true })).toHaveAttribute("href", "https://github.com/DeadIndian/deads-sticky-notes");
  await page.keyboard.press("Escape");
  await page.getByRole("link", { name: /04 My people/ }).click();
  await expect(scene).toHaveAttribute("data-chapter", "people");
  const canvas = scene.locator("canvas");
  const chairBefore = await canvas.screenshot();
  await page.getByRole("button", { name: "Pull up a chair", exact: true }).click();
  await expect(page.getByRole("button", { name: "A seat saved. Push it back?", exact: true })).toHaveAttribute("aria-pressed", "true");
  expect((await canvas.screenshot()).equals(chairBefore)).toBe(false);
  await page.getByRole("link", { name: /05 The long game/ }).click();
  await expect(scene).toHaveAttribute("data-chapter", "future");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("A little further.");
  const assembled = await canvas.screenshot();
  await page.getByRole("button", { name: "Look inside the reactor", exact: true }).click();
  await expect(page.getByRole("button", { name: "Reassemble the reactor", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".reactor-layer-anchor")).toHaveCount(5);
  expect((await canvas.screenshot()).equals(assembled)).toBe(false);
  await page.getByRole("button", { name: "Reassemble the reactor", exact: true }).click();
  await expect(page.locator(".reactor-layer-anchor")).toHaveCount(0);
  await page.getByRole("button", { name: "The actual JARVIS project", exact: true }).click();
  await expect(project).toContainText("Android prototype");
  await expect(project.getByRole("link", { name: "Read the source", exact: true })).toHaveAttribute("href", "https://github.com/DeadIndian/Jarvis");
  expect(errors).toEqual([]);
});

test("motion pauses for the reader, the pause control, and hidden documents", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#workshop-future");
  const scene = page.locator(".world-scene");
  await expect(scene).toHaveAttribute("data-scene-ready", "true", { timeout: 45000 });
  await scene.scrollIntoViewIfNeeded();
  await expect(scene).toHaveAttribute("data-rendering", "continuous");
  await page.getByRole("button", { name: "Full story", exact: true }).click();
  await expect(scene).toHaveAttribute("data-rendering", "on-demand");
  await page.keyboard.press("Escape");
  await scene.scrollIntoViewIfNeeded();
  await expect(scene).toHaveAttribute("data-rendering", "continuous");
  await page.getByRole("button", { name: "Pause motion", exact: true }).click();
  await expect(page.locator(".world-root")).toHaveAttribute("data-motion", "off");
  await scene.scrollIntoViewIfNeeded();
  const paused = await scene.locator("canvas").screenshot();
  await page.waitForTimeout(400);
  expect((await scene.locator("canvas").screenshot()).equals(paused)).toBe(true);
  await page.getByRole("button", { name: "Enable motion", exact: true }).click();
  await scene.scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(scene).toHaveAttribute("data-rendering", "on-demand");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(scene).toHaveAttribute("data-rendering", "continuous");
});

test("a lost WebGL context keeps the current chapter readable and controls useful", async ({ page }) => {
  await page.goto("/#workshop-people");
  const scene = page.locator(".world-scene");
  await expect(scene).toHaveAttribute("data-scene-ready", "true", { timeout: 45000 });
  await scene.locator("canvas").evaluate((canvas) => {
    (canvas as HTMLCanvasElement).getContext("webgl2")?.getExtension("WEBGL_lose_context")?.loseContext();
  });
  await expect(scene).toHaveAttribute("data-webgl", "unavailable");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Leave no one behind.");
  await page.getByRole("button", { name: "Meet Recurse", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Open source & Recurse", exact: true })).toContainText("Club Head / Recurse, KMIT");
});
