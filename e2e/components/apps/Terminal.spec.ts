import { test } from "@playwright/test";
import { TERMINAL_BASE_CD } from "e2e/constants";
import {
  captureConsoleLogs,
  disableWallpaper,
  terminalDirectoryMatchesPublicFolder,
  terminalHasRows,
  terminalHasText,
  windowsAreVisible,
} from "e2e/functions";

test.beforeEach(captureConsoleLogs);
test.beforeEach(disableWallpaper);
test.beforeEach(async ({ page }) => page.goto("/?app=Terminal"));
test.beforeEach(windowsAreVisible);
test.beforeEach(terminalHasRows);

test("has current directory", async ({ page }) =>
  terminalHasText({ page }, `${TERMINAL_BASE_CD}>`));

test("has directory listing", async ({ page }) =>
  terminalDirectoryMatchesPublicFolder({ page }, TERMINAL_BASE_CD));