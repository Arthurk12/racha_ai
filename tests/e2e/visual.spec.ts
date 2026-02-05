import { test, expect, Page } from '@playwright/test';
import path from 'path';

// Define user colors used in the app to override them for stable screenshots
const USER_COLORS = [
    'text-cyan-300', 'text-pink-300', 'text-emerald-300', 'text-violet-300',
    'text-amber-300', 'text-rose-300', 'text-sky-300', 'text-lime-300',
    'text-fuchsia-300', 'text-teal-300', 'text-red-300', 'text-orange-300',
    'text-yellow-300', 'text-green-300', 'text-blue-300', 'text-indigo-300',
    'text-purple-300', 'text-red-400', 'text-cyan-400', 'text-fuchsia-400'
];

// Helper to force consistent colors across reloads/navigations
async function forceConsistentColors(page: Page) {
    const css = USER_COLORS.map(c => `.${c}`).join(', ') + ' { color: #818cf8 !important; }'; // Fixed Indigo-400
    await page.addInitScript((styleContent) => {
        const style = document.createElement('style');
        style.innerHTML = styleContent;
        document.head.appendChild(style);
    }, css);
}

test.describe('Visual Regression - Basic Functionalities', () => {

    test('Full Journey: Create Group to Settle Up', async ({ page, browser }) => {
        test.setTimeout(90000); // 1.5 minutes for full journey

        // Apply consistent colors to main page
        await forceConsistentColors(page);

        // --- 1. Criar grupo ---
        await test.step('1. Criar grupo', async () => {
            await page.goto('/');
            await expect(page).toHaveTitle(/Racha AI/);

            // Fill form
            const groupName = 'Racha Visual Test Fixed';
            await page.fill('#groupName', groupName);
            await page.fill('#adminName', 'Admin');
            await page.fill('#adminPin', '1234');

            // Screenshot Home
            await expect(page).toHaveScreenshot('01-create-group.png');

            await page.click('button[type="submit"]');

            // Verify redirect
            await expect(page).toHaveURL(/created=true/);
            await expect(page.getByText('Grupo Criado com Sucesso!')).toBeVisible();
        });

        // 2. Test Copy Link Disappearance
        await test.step('2. Card Link Copiado some após 3s', async () => {
             await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
             
             // Look for the "Copiar Link" button specifically inside the success card
             // The card has "Grupo Criado com Sucesso!" text.
             const card = page.locator('.bg-slate-800', { hasText: 'Grupo Criado com Sucesso!' });
             // Use generic button locator to avoid stale element when text changes
             const copyBtn = card.locator('button'); 
             
             await expect(copyBtn).toHaveText('Copiar Link');
             await copyBtn.click();
             await expect(copyBtn).toHaveText('Copiado! ✓');
             
             // Wait > 3s for it to disappear
             await page.waitForTimeout(3500); 
             
             // Card should disappear
             await expect(page.getByText('Grupo Criado com Sucesso!')).not.toBeVisible();
             // Params should be clean
             await expect(page).not.toHaveURL(/created=true/);
        });

        // Get URL for invite
        const groupUrl = page.url().split('?')[0] || '';
        const groupId = groupUrl.split('/').pop() || '';

        // Navigate to clean URL to show Copy Link button (hidden when created=true)
        await page.goto(groupUrl);

        // --- 3. Copiar link do grupo ---
        await test.step('3. Copiar link do grupo', async () => {
             // Mock clipboard
             await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
             
             const copyBtn = page.locator('button[title="Copiar Link de Convite"]');
             await expect(copyBtn).toBeVisible();
             await copyBtn.click();
             
             // Verify toast
             await expect(page.getByText('Link copiado!')).toBeVisible();
             await expect(page).toHaveScreenshot('02-link-copied.png');
        });

        // --- 4. Entrar pelo link de convite (User B) ---
        // Context B
        const contextB = await browser.newContext();
        const pageB = await contextB.newPage();
        await forceConsistentColors(pageB);
        
        await test.step('4. Entrar pelo link de convite', async () => {
            await pageB.goto(groupUrl);
            
            // --- 2. Entrar no grupo (Flow for new user) ---
            await pageB.click('button:has-text("Sou novo aqui")');
            await pageB.fill('input[placeholder="Seu Nome"]', 'User B');
            await pageB.fill('input[placeholder="Crie um PIN (4 dígitos)"]', '5678');
            await expect(pageB).toHaveScreenshot('03-join-screen.png');

            await pageB.click('button:has-text("Entrar no Grupo")');
            
            // Check if joined - Check User List specifically to match strict mode
            // UserList component starts with "Participantes" - scope by class and text
            const userListB = pageB.locator('.bg-slate-800').filter({ hasText: 'Participantes' });
            await expect(userListB.getByText('User B')).toBeVisible();
            await expect(userListB.getByText('Admin').first()).toBeVisible();
        });

        // Ensure Admin sees User B
        const userListAdmin = page.locator('.bg-slate-800').filter({ hasText: 'Participantes' });
        await expect(userListAdmin.getByText('User B')).toBeVisible();

        // --- 5. Reset de Senha e Login Existente ---
        await test.step('5. Reset de Senha e Login Existente', async () => {
            // Admin resets User B
            const userRow = userListAdmin.locator('li', { hasText: 'User B' });
            // Button has text "Resetar PIN", not title
            await userRow.getByRole('button', { name: 'Resetar PIN' }).click();
            await page.getByRole('button', { name: 'Confirmar' }).click();
            
            // Verify toast
            await expect(page.getByText('PIN resetado para 0000')).toBeVisible();

            // User B logs out
            // Using title locator for logout button
            await pageB.click('button[title="Desconectar deste dispositivo (Logout)"]');
            
            // Should be redirected to Home
            await expect(pageB.locator('h1')).toHaveText('R$Racha AI');

            // Navigate back to group to login as existing
            await pageB.goto(groupUrl);

            // Should be on Auth Screen
            await expect(pageB.getByText('Quem é você?')).toBeVisible();
            await pageB.getByRole('button', { name: 'Já estou no grupo' }).click();
            
            // Select User B from CustomSelect
            // Click placeholder
            await pageB.getByText('Selecione seu nome...').click();
            // Click option
            await pageB.getByText('User B', { exact: true }).click();
            
            // Fill PIN 0000
            await pageB.fill('input[placeholder="Seu PIN (4 dígitos)"]', '0000');
            await pageB.press('input[placeholder="Seu PIN (4 dígitos)"]', 'Enter');
            
            // Check Warning Overlay
            await expect(pageB.getByText('Sua conta está usando o PIN padrão')).toBeVisible();
            await expect(pageB.getByText('0000')).toBeVisible();
            
            // Change PIN
            // "Alterar PIN" button in header (might be obscured by overlay visually but clickable in DOM if overlay allows pointer-events on children? No, overlay is fixed.)
            // The overlay text says: "Clique em 🔑 Alterar PIN".
            // The overlay is `pointer-events-none` on parent, `pointer-events-auto` on card.
            // The header is BEHIND the overlay.
            // Actually, if the overlay covers the screen with z-index 40, and header buttons are regular flow...
            // Wait, if header is z-index < 40, we CANNOT click it if the overlay is full screen.
            // The overlay code: `fixed inset-0 ... pointer-events-none`.
            // Pointer events none on the container means clicks pass through to underneath elements!
            // Only the inner card `pointer-events-auto` captures clicks.
            // So we CAN click the header button behind the overlay backdrop (which is transparent/empty except for the card).
            
            await pageB.click('button[title="Alterar PIN"]');
            
            // Fill New PIN
            await pageB.fill('input[placeholder="Novo PIN (4 dígitos)"]', '5555');
            await pageB.click('button:has-text("Salvar")');
            
            // Verify Overlay Gone
            await expect(pageB.getByText('Sua conta está usando o PIN padrão')).not.toBeVisible();
            await expect(pageB.locator('input[placeholder="Novo PIN (4 dígitos)"]')).not.toBeVisible();
            
            // Toast success
            await expect(pageB.getByText('PIN alterado com sucesso!')).toBeVisible();
        });

        // --- 6. Lançar despesa ---
        await test.step('6. Lançar despesa', async () => {
            // Admin launches expense
            await page.fill('input[placeholder="Ex: Mercado, Uber..."]', 'Pizza');
            await page.fill('input[placeholder="0,00"]', '100,00'); // 100,00
            
            // Add
            await page.press('input[placeholder="0,00"]', 'Enter');
            
            // Open Expense List to verify
            await page.getByRole('button', { name: 'Lista de Despesas' }).click();

            // Verify
            const expenseHistory = page.locator('.order-3');
            await expect(expenseHistory.getByText('Pizza')).toBeVisible();
            await expect(expenseHistory.getByText('R$ 100,00')).toBeVisible();
            
            // Check Balance update
            // a receber might be collapsed on desktop if not careful or if balance is 0?
            // Admin paid 100, shared by 2 (Admin + UserB). Admin pays 50, UserB pays 50.
            // Admin paid 100. Admin is owed 50. Balance +50. "a receber".
            const balanceSummary = page.locator('.order-1');
            await expect(balanceSummary.getByText('a receber').first()).toBeVisible({ timeout: 10000 });
            await expect(page).toHaveScreenshot('04-expense-list.png');
        });

        // Setup User C for removal tests
        const contextC = await browser.newContext();
        await contextC.grantPermissions(['clipboard-read', 'clipboard-write']);
        const pageC = await contextC.newPage();
        await forceConsistentColors(pageC);
        await pageC.goto(groupUrl);
        await pageC.click('button:has-text("Sou novo aqui")');
        await pageC.fill('input[placeholder="Seu Nome"]', 'User C');
        await pageC.fill('input[placeholder="Crie um PIN (4 dígitos)"]', '9876');
        await pageC.click('button:has-text("Entrar no Grupo")');

        // User C adds expense to be edited/removed
        await pageC.fill('input[placeholder="Ex: Mercado, Uber..."]', 'Uber C');
        await pageC.fill('input[placeholder="0,00"]', '40,50'); // 40,50
        await pageC.press('input[placeholder="0,00"]', 'Enter');
        // Check visibility on Admin page. Since we opened the list, it should be visible live (auto update?)
        // GroupClient has polling every 4s. We might need to wait.
        await expect(page.locator('.order-3').getByText('Uber C')).toBeVisible({ timeout: 15000 });

        // --- 7. Editar despesa ---
        await test.step('7. Editar despesa', async () => {
             // Admin edits User C's expense (Admin has power)
            const expenseHistory = page.locator('.order-3');
            const row = expenseHistory.locator('li', { hasText: 'Uber C' });
            
            // Click Edit button (Pencil icon)
            await row.getByTitle('Editar').click();
            await expect(page).toHaveScreenshot('05-edit-mode.png');

            // Re-locate the row using CSS selector for value since getByDisplayValue might be flaky in some envs
            const editRow = expenseHistory.locator('li').filter({ has: page.locator('input[value="Uber C"]') });

            // Find Amount input by its current value
            const amountInput = editRow.locator('input[value="40,50"]');
            await amountInput.fill('50,00');
            
            // Save
            await editRow.getByTitle('Salvar').click();
            
            // Verify
            await expect(expenseHistory.getByText('R$ 50,00')).toBeVisible();
        });

        // --- 8. Remover despesa ---
        await test.step('8. Remover despesa', async () => {
            const expenseHistory = page.locator('.order-3');
            const row = expenseHistory.locator('li', { hasText: 'Uber C' });
            await row.getByTitle('Remover Despesa').click();
            
            // Verify gone
            await expect(expenseHistory.getByText('Uber C')).not.toBeVisible();
            await expect(page).toHaveScreenshot('06-expense-removed.png');
            
            // Cleanup: also remove the expense "Pizza" to isolate User B removal later? 
            // No, User B still needs to participate in Pizza for settlement test.
        });

        // --- 9. Remover usuário (com e sem despesas) ---
        await test.step('9. Remover usuário', async () => {
            // Testing "Without expenses" (User C now has no expenses)
            const userRow = userListAdmin.locator('li', { hasText: 'User C' });
            
            // Click remove user button
            await userRow.getByTitle('Remover usuário').click();
            await page.getByRole('button', { name: 'Confirmar' }).click();
            
            // Verify User C is gone
            await expect(userListAdmin.getByText('User C')).not.toBeVisible();
            
            // Test "With expenses": Add User D, Add Expense, Remove User D => Should cascade
            const contextD = await browser.newContext();
            const pageD = await contextD.newPage();
            await forceConsistentColors(pageD);
            await pageD.goto(groupUrl);
            await pageD.click('button:has-text("Sou novo aqui")');
            await pageD.fill('input[placeholder="Seu Nome"]', 'User D');
            await pageD.fill('input[placeholder="Crie um PIN (4 dígitos)"]', '1111');
            await pageD.click('button:has-text("Entrar no Grupo")');
            
            // User D adds expense
            await pageD.fill('input[placeholder="Ex: Mercado, Uber..."]', 'Taxi D');
            await pageD.fill('input[placeholder="0,00"]', '20,00');
            await pageD.press('input[placeholder="0,00"]', 'Enter');
            await expect(page.locator('.order-3').getByText('Taxi D')).toBeVisible({ timeout: 15000 });
            
            // Admin tries to remove User D (blocked by expense)
            const userDRow = userListAdmin.locator('li', { hasText: 'User D' });
            await userDRow.getByTitle('Remover usuário').click();
            
            // Should see error toast
            await expect(page.getByText('Não é possível remover')).toBeVisible();

            // Remove Taxi D first
            const expenseList = page.locator('.order-3');
            await expenseList.locator('li', { hasText: 'Taxi D' }).getByTitle('Remover Despesa').click();
            await expect(expenseList.getByText('Taxi D')).not.toBeVisible();
            
            // Now remove User D
            await userDRow.getByTitle('Remover usuário').click();
            await page.getByRole('button', { name: 'Confirmar' }).click();
            
            // Verify User D is gone
            await expect(userListAdmin.getByText('User D')).not.toBeVisible();
        });

        // --- 10. Finalizar lançamentos ---
        await test.step('10. Finalizar lançamentos', async () => {
            // Admin marks as finished
            // Button "Finalizar?" near "Admin"
            const adminRow = userListAdmin.locator('li', { hasText: 'Admin' });
            await adminRow.getByRole('button', { name: 'Finalizar?' }).click();
            
            // Verify change to "Pronto" or "Reabrir"
            await expect(adminRow.getByText('Pronto')).toBeVisible();
            
            // User B marks as finished (via Page B)
            const userListB = pageB.locator('.bg-slate-800').filter({ hasText: 'Participantes' });
            const userBRowB = userListB.locator('li', { hasText: 'User B' });
            await userBRowB.getByRole('button', { name: 'Finalizar?' }).click();
            await expect(userBRowB.getByText('Pronto')).toBeVisible();
            
            await expect(page).toHaveScreenshot('07-finished-state.png');
        });

        // --- 11. Lançar pagamento ---
        await test.step('11. Lançar pagamento', async () => {
            // Open Payment Suggestions
            await page.click('h3:has-text("Sugestões de Pagamento")');
            
            // Wait for suggestions to calculate/animate
            await page.waitForTimeout(500);

            // Since Admin paid 100 for 2 people (Admin, User B), User B owes 50 to Admin.
            // Admin should see "User B paga R$ 50,00 a Admin".
            
            // Click on the suggestion to expand.
            // Use filter to find the suggestion line with "User B", "Admin" and "paga" to avoid clicking User List
            await page.locator('li').filter({ hasText: 'User B' }).filter({ hasText: 'Admin' }).filter({ hasText: 'paga' }).click(); 
            
            // Admin (Creditor) should see "Marcar como quitado"
            const settleBtn = page.getByRole('button', { name: 'Marcar como quitado' });
            await expect(settleBtn).toBeVisible();
            
            // Click to settle
            await settleBtn.click();
            
            // Confirm dialog
            // Search loosely for confirm button
            await page.getByRole('button', { name: 'Confirmar' }).click();
            
            // Verify expense added for settlement
            // The text 'Pagamento realizado' is rendered for settlements, not the db description
            await expect(page.getByText('Pagamento realizado')).toBeVisible();
            await expect(page).toHaveScreenshot('08-payment-settled.png');
        });

        // --- 12. Alterar PIN ---
        await test.step('12. Alterar PIN', async () => {
           // Admin click PIN button
           await page.click('button[title="Alterar PIN"]');
           
           // Modal appears
           await page.fill('input[placeholder="Novo PIN (4 dígitos)"]', '4321');
           await page.click('button:has-text("Salvar")');
           
           // Implicitly verifies success if modal closes.
           await expect(page.locator('input[placeholder="Novo PIN (4 dígitos)"]')).not.toBeVisible();
        });

        // --- 13. Deixar grupo ---
        await test.step('13. Deixar grupo', async () => {
           // Cleanup expenses to allow User B to leave (App prevents leaving if has debts/history)
           // Admin removes expenses
           const expenseList = page.locator('.order-3');
           
           // Remove Settlement
           // Note: Settlement expense might show as "Pagamento realizado"
           const settlementRow = expenseList.locator('li', { hasText: 'Pagamento realizado' }).first();
           if (await settlementRow.isVisible()) {
                await settlementRow.getByTitle('Remover Despesa').click();
                await expect(settlementRow).not.toBeVisible();
           }

           // Remove Pizza (User B is participant)
           const pizzaRow = expenseList.locator('li', { hasText: 'Pizza' }).first();
           if (await pizzaRow.isVisible()) {
                await pizzaRow.getByTitle('Remover Despesa').click();
                await expect(pizzaRow).not.toBeVisible();
           }

           // Wait for Page B to sync (Polling 4s or SWR)
           await pageB.waitForTimeout(5000);
           // Verify Page B sees empty list or at least no conflicting expenses
           await expect(pageB.getByText('Pagamento realizado')).not.toBeVisible();
           await expect(pageB.getByText('Pizza')).not.toBeVisible();

           // Verify User B leaving
           // User B context
           await pageB.locator('button[title="Sair do grupo e apagar dados permanentemente"]').click();
           
           // Confirm
           await pageB.getByRole('button', { name: 'Confirmar' }).click();
           
           // Expect redirect to home (check for Join Code input or title)
           // "Criar Novo Grupo" might not be visible as text, but "Nome do Grupo" input is.
           await expect(pageB.locator('h1')).toHaveText('R$Racha AI');
           await expect(pageB.locator('input#groupName')).toBeVisible();
           
           // Verify on Admin page that User B is gone
           await expect(userListAdmin.getByText('User B')).not.toBeVisible();
        });
    });
});
