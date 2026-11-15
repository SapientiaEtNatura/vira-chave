import { expect, test } from "@playwright/test";

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test.describe(`Landing page motion (${reducedMotion})`, () => {
    test.use({ contextOptions: { reducedMotion } });

    test("renders all sections, headings, and CTAs visibly", async ({ page }) => {
      await page.goto("/");

      await expect(
        page.getByRole("heading", {
          level: 1,
          name: /Descubra possibilidades\. Desenvolva habilidades\./i,
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: /Quero começar/i }),
      ).toBeVisible();

      const firstJourneyLine = page.locator("[data-journey-line]").first();
      await expect(firstJourneyLine).toBeVisible();
      const lineBox = await firstJourneyLine.boundingBox();
      expect(lineBox?.height ?? 0).toBeGreaterThan(0);

      const journeyHeading = page.getByRole("heading", {
        level: 2,
        name: /Um passo de cada vez\. Um mundo de possibilidades\./i,
      });
      const journeySection = page.locator("#como-funciona");
      await journeySection.scrollIntoViewIfNeeded();
      await expect(journeyHeading).toBeVisible();
      await expect(journeyHeading).toHaveCSS("opacity", "1");

      const practiceHeading = page.getByRole("heading", {
        level: 2,
        name: /Do interesse ao portfólio real\./i,
      });
      const practiceSection = page.locator("#na-pratica");
      await practiceSection.scrollIntoViewIfNeeded();
      await expect(practiceHeading).toBeVisible();
      await expect(practiceHeading).toHaveCSS("opacity", "1");
      await expect(page.getByText("Mapa de Afinidades")).toBeVisible();
      await expect(page.getByText("Portfólio Compartilhável")).toBeVisible();
      await expect(
        practiceSection.locator("[data-motion-item]").first(),
      ).toHaveCSS("opacity", "1");

      const audienceHeading = page.getByRole("heading", {
        level: 2,
        name: /Feito para estudantes\. Pensado para educadores\./i,
      });
      const audienceSection = page.locator("#para-quem");
      await audienceSection.scrollIntoViewIfNeeded();
      await expect(audienceHeading).toBeVisible();
      await expect(audienceHeading).toHaveCSS("opacity", "1");
      await expect(
        page.getByRole("link", { name: /Começar como estudante/i }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: /Criar conta de educador/i }),
      ).toBeVisible();

      await expect(page.getByText(/dados de adolescentes/i)).toBeVisible();

      const finalHeading = page.getByRole("heading", {
        level: 2,
        name: /Pronto para virar a chave\?/i,
      });
      const finalCta = page.getByRole("link", {
        name: /Criar minha conta grátis/i,
      });
      await finalCta.scrollIntoViewIfNeeded();
      await expect(finalHeading).toBeVisible();
      await expect(finalHeading).toHaveCSS("opacity", "1");
      await expect(finalCta).toBeVisible();
    });
  });
}
