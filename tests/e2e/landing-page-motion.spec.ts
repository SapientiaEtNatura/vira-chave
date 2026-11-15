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

      const journeySection = page.locator("#como-funciona");
      await journeySection.scrollIntoViewIfNeeded();
      await expect(
        page.getByRole("heading", {
          level: 2,
          name: /Um passo de cada vez\. Um mundo de possibilidades\./i,
        }),
      ).toBeVisible();

      const practiceSection = page.locator("#na-pratica");
      await practiceSection.scrollIntoViewIfNeeded();
      await expect(
        page.getByRole("heading", {
          level: 2,
          name: /Do interesse ao portfólio real\./i,
        }),
      ).toBeVisible();
      await expect(page.getByText("Mapa de Afinidades")).toBeVisible();
      await expect(page.getByText("Portfólio Compartilhável")).toBeVisible();

      const audienceSection = page.locator("#para-quem");
      await audienceSection.scrollIntoViewIfNeeded();
      await expect(
        page.getByRole("heading", {
          level: 2,
          name: /Feito para estudantes\. Pensado para educadores\./i,
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: /Começar como estudante/i }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: /Criar conta de educador/i }),
      ).toBeVisible();

      await expect(page.getByText(/dados de adolescentes/i)).toBeVisible();

      const finalCta = page.getByRole("link", {
        name: /Criar minha conta grátis/i,
      });
      await finalCta.scrollIntoViewIfNeeded();
      await expect(
        page.getByRole("heading", {
          level: 2,
          name: /Pronto para virar a chave\?/i,
        }),
      ).toBeVisible();
      await expect(finalCta).toBeVisible();
    });
  });
}
