import { expect, test } from "@playwright/test";

const STUDENT_INVITE_CODE = process.env.E2E_STUDENT_INVITE_CODE ?? "TURMA01";

test.describe("Jornada completa do estudante (Descobrir -> Aprender -> Experimentar -> Construir)", () => {
  test("estudante se cadastra com código de turma, percorre as 4 etapas e gerencia link compartilhável", async ({
    page,
    browser,
  }) => {
    const uniqueSuffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const studentName = `Estudante E2E ${uniqueSuffix}`;
    const studentEmail = `estudante.e2e.${uniqueSuffix}@escola.br`;
    const studentPassword = "SenhaForte@2026";

    // 1. Cadastro com código de turma
    await page.goto("/cadastro");
    await page.locator("#role").selectOption("ESTUDANTE");
    await page.locator("#name").fill(studentName);
    await page.locator("#email").fill(studentEmail);
    await page.locator("#password").fill(studentPassword);
    await page.locator("#inviteCode").fill(STUDENT_INVITE_CODE);

    await page.getByLabel(/Termos de Uso/i).check();
    await page.getByLabel(/Política de Privacidade/i).check();

    await page.getByRole("button", { name: "Criar conta" }).click();
    await expect(page).toHaveURL(/\/app$/, { timeout: 15000 });

    // 2. Etapa 1: Descobrir
    await page.goto("/app/descobrir");
    await expect(
      page.getByRole("heading", { name: /Descubra suas afinidades/i }),
    ).toBeVisible();

    const questionFieldsets = page.locator("fieldset");
    const questionCount = await questionFieldsets.count();
    expect(questionCount).toBeGreaterThan(0);

    for (let i = 0; i < questionCount; i += 1) {
      await questionFieldsets
        .nth(i)
        .locator("label", { hasText: "Bastante a ver comigo" })
        .click();
    }

    await page
      .getByRole("button", { name: "Ver meu mapa de afinidades" })
      .click();

    await expect(
      page.getByRole("heading", { name: /Seu Mapa de Afinidades/i }),
    ).toBeVisible();

    // 3. Etapa 2: Aprender (acessar curso + concluir com resumo)
    await page.goto("/app/aprender");
    const firstTrackLink = page.locator('a[href^="/app/aprender/"]').first();
    await expect(firstTrackLink).toBeVisible();
    await firstTrackLink.click();
    await expect(page).toHaveURL(/\/app\/aprender\/.+/);

    const startButton = page
      .getByRole("button", { name: "Acessar curso" })
      .first();
    await expect(startButton).toBeVisible();

    // Evita bloquear no popup externo durante o clique
    const popupPromise = page.waitForEvent("popup").catch(() => null);
    await startButton.click();
    const popup = await popupPromise;
    if (popup) {
      await popup.close();
    }

    await expect(page.getByText("Em andamento").first()).toBeVisible();

    await page.getByRole("button", { name: "Concluir" }).first().click();
    await page
      .getByLabel(/Mini-resumo do que você aprendeu/i)
      .fill(
        "Aprendi os conceitos principais da trilha e como aplicá-los em projetos reais.",
      );
    await page.getByRole("button", { name: "Salvar conclusão" }).click();

    await expect(page.getByText("Concluído").first()).toBeVisible();

    // 4. Etapa 3: Experimentar (submeter desafio)
    await page.goto("/app/experimentar");
    const firstChallengeLink = page
      .locator('a[href^="/app/experimentar/"]')
      .first();
    await expect(firstChallengeLink).toBeVisible();
    await firstChallengeLink.click();
    await expect(page).toHaveURL(/\/app\/experimentar\/.+/);

    const projectTitle = `Projeto E2E ${uniqueSuffix}`;
    await page.locator("#challenge-title").fill(projectTitle);
    await page
      .locator("#challenge-reflection")
      .fill(
        "Construí um protótipo funcional testado em equipe e documentei os aprendizados.",
      );
    await page.getByRole("button", { name: "Enviar desafio" }).click();

    await expect(page.getByRole("status")).toContainText(
      "registrado no seu portfólio!",
    );

    // 5. Etapa 4: Construir (gerar link /p/[token], abrir em contexto anônimo, revogar e validar 404)
    await page.goto("/app/portfolio");
    await expect(page.getByText(projectTitle)).toBeVisible();

    await page
      .getByRole("button", { name: /Gerar link compartilhável/i })
      .click();

    const shareUrlCode = page.locator("code", { hasText: "/p/" });
    await expect(shareUrlCode).toBeVisible();
    const shareUrl = (await shareUrlCode.innerText()).trim();
    expect(shareUrl).toContain("/p/");

    const anonymousContext = await browser.newContext();
    const anonymousPage = await anonymousContext.newPage();

    try {
      const publicResponse = await anonymousPage.goto(shareUrl);
      expect(publicResponse?.status()).toBe(200);
      await expect(
        anonymousPage.getByText("Visualização somente leitura"),
      ).toBeVisible();
      await expect(anonymousPage.getByText(projectTitle)).toBeVisible();

      const publicBodyText = await anonymousPage.locator("body").innerText();
      expect(publicBodyText).not.toContain(studentEmail);

      // Revogar link no contexto autenticado do estudante
      await page.getByRole("button", { name: /^Revogar$/i }).click();
      await expect(
        page.getByRole("button", { name: /Gerar link compartilhável/i }),
      ).toBeVisible();

      // Validar 404 após revogação no contexto anônimo
      const revokedResponse = await anonymousPage.goto(shareUrl);
      expect(revokedResponse?.status()).toBe(404);
    } finally {
      await anonymousContext.close();
    }
  });
});
