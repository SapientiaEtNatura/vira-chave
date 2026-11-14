import { expect, test } from "@playwright/test";

const EDUCATOR_INSTITUTION_CODE =
  process.env.E2E_EDUCATOR_INSTITUTION_CODE ?? "ESCOLA-01";

test.describe("Isolamento de privacidade do educador e exclusão de conta LGPD", () => {
  test("educador cria turma, vê visão agregada sem dados privados e estudante exclui conta perdendo acesso", async ({
    page,
    browser,
  }) => {
    const uniqueSuffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const educatorName = `Educador E2E ${uniqueSuffix}`;
    const educatorEmail = `educador.e2e.${uniqueSuffix}@escola.br`;
    const educatorPassword = "SenhaEducador@2026";
    const classroomName = `Turma E2E ${uniqueSuffix}`;

    const studentName = `Estudante LGPD ${uniqueSuffix}`;
    const studentEmail = `estudante.lgpd.${uniqueSuffix}@escola.br`;
    const studentPassword = "SenhaEstudante@2026";
    const privateProjectTitle = `Projeto Privado E2E ${uniqueSuffix}`;
    const privateReflection = `Reflexão privada confidencial ${uniqueSuffix}`;

    // 1. Educador se cadastra e cria turma
    await page.goto("/cadastro");
    await page.getByRole("button", { name: "Sou Educador(a)" }).click();
    await page.locator("#name").fill(educatorName);
    await page.locator("#email").fill(educatorEmail);
    await page.locator("#password").fill(educatorPassword);
    await page.locator("#institutionCode").fill(EDUCATOR_INSTITUTION_CODE);

    await page.getByLabel(/Termos de Uso/i).check();
    await page.getByLabel(/Política de Privacidade/i).check();
    await page.getByLabel(/Termo de Compromisso e Sigilo do Educador/i).check();

    await page.getByRole("button", { name: "Criar conta" }).click();
    await expect(page).toHaveURL(/\/educador$/);

    await page.getByLabel("Nome da nova turma").fill(classroomName);
    await page.getByRole("button", { name: "Criar turma" }).click();

    const classroomCard = page
      .locator("article")
      .filter({ hasText: classroomName });
    await expect(classroomCard).toBeVisible();

    const inviteCode = (
      await classroomCard.locator("span.font-mono").innerText()
    ).trim();
    expect(inviteCode.length).toBeGreaterThan(3);

    // 2. Estudante se cadastra na turma em contexto separado, conclui Descobrir e cria projeto privado
    const studentContext = await browser.newContext();
    const studentPage = await studentContext.newPage();

    try {
      await studentPage.goto("/cadastro");
      await studentPage.getByRole("button", { name: "Sou Estudante" }).click();
      await studentPage.locator("#name").fill(studentName);
      await studentPage.locator("#email").fill(studentEmail);
      await studentPage.locator("#password").fill(studentPassword);
      await studentPage.locator("#inviteCode").fill(inviteCode);

      await studentPage.getByLabel(/Termos de Uso/i).check();
      await studentPage.getByLabel(/Política de Privacidade/i).check();

      await studentPage.getByRole("button", { name: "Criar conta" }).click();
      await expect(studentPage).toHaveURL(/\/app$/);

      // Responde Descobrir para gerar dados agregados de macroárea
      await studentPage.goto("/app/descobrir");
      const questionFieldsets = studentPage.locator("fieldset");
      const questionCount = await questionFieldsets.count();
      expect(questionCount).toBeGreaterThan(0);

      for (let i = 0; i < questionCount; i += 1) {
        await questionFieldsets
          .nth(i)
          .locator("label", { hasText: "Tudo a ver comigo" })
          .click();
      }
      await studentPage
        .getByRole("button", { name: "Ver meu mapa de afinidades" })
        .click();
      await expect(
        studentPage.getByRole("heading", { name: /Seu Mapa de Afinidades/i }),
      ).toBeVisible();

      // Cria um projeto privado no portfólio que NÃO deve vazar para o educador
      await studentPage.goto("/app/portfolio");
      await studentPage.getByRole("button", { name: "Novo projeto" }).click();
      await studentPage
        .locator("#new-project-title")
        .fill(privateProjectTitle);
      await studentPage
        .locator("#new-project-summary")
        .fill("Resumo privado do estudante.");
      await studentPage
        .locator("#new-project-reflection")
        .fill(privateReflection);
      await studentPage
        .getByLabel(/Incluir este projeto quando eu gerar um link compartilhável/i)
        .uncheck();
      await studentPage
        .getByRole("button", { name: "Salvar projeto" })
        .click();

      await expect(studentPage.getByText(privateProjectTitle)).toBeVisible();

      // 3. Educador acessa a visão educacional e valida isolamento de privacidade
      await classroomCard
        .getByRole("link", { name: /Ver visão educacional/i })
        .click();
      await expect(page).toHaveURL(/\/educador\/turmas\/.+/);
      await expect(
        page.getByText(/Visão Educacional com Privacidade por Padrão/i),
      ).toBeVisible();

      await expect(page.getByText(studentName)).toBeVisible();

      const educatorBodyText = await page.locator("body").innerText();
      expect(educatorBodyText).not.toContain(studentEmail);
      expect(educatorBodyText).not.toContain(privateProjectTitle);
      expect(educatorBodyText).not.toContain(privateReflection);

      // 4. Estudante exclui a própria conta em /app/conta (LGPD)
      await studentPage.goto("/app/conta");
      await studentPage
        .getByLabel(/Entendo que esta ação é permanente/i)
        .check();
      await studentPage.locator("#deleteConfirmation").fill("EXCLUIR");
      await studentPage
        .getByRole("button", { name: "Excluir minha conta permanentemente" })
        .click();

      await expect(studentPage).toHaveURL(/\/$/);

      // 5. Login falha após exclusão
      await studentPage.goto("/login");
      await studentPage.locator("#email").fill(studentEmail);
      await studentPage.locator("#password").fill(studentPassword);
      await studentPage.getByRole("button", { name: "Entrar" }).click();

      await expect(studentPage.getByRole("alert")).toContainText(
        "E-mail ou senha inválidos, ou conta inativa.",
      );
      await expect(studentPage).toHaveURL(/\/login$/);
    } finally {
      await studentContext.close();
    }
  });
});
