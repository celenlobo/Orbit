const ORBIT_SUPABASE_URL = "https://qyiygxltqxdvwaesbhjw.supabase.co";
const ORBIT_SUPABASE_KEY = "sb_publishable_NlDBvlop1kgDbeHjr2KPqA_59WgQSPY";

const orbitSupabase = window.supabase.createClient(
    ORBIT_SUPABASE_URL,
    ORBIT_SUPABASE_KEY
);

const orbitOriginalFetch = window.fetch.bind(window);

let orbitAuthReadyResolve;
window.orbitAuthReady = new Promise((resolve) => {
    orbitAuthReadyResolve = resolve;
});

window.fetch = async (input, init = {}) => {
    const url =
        typeof input === "string"
            ? input
            : input?.url || "";

    if (!url.includes("/api/")) {
        return orbitOriginalFetch(input, init);
    }

    const { data } =
        await orbitSupabase.auth.getSession();

    const token =
        data?.session?.access_token;

    const headers =
        new Headers(
            init.headers ||
            (
                typeof input !== "string"
                    ? input.headers
                    : undefined
            )
        );

    if (token) {
        headers.set(
            "Authorization",
            `Bearer ${token}`
        );
    }

    return orbitOriginalFetch(input, {
        ...init,
        headers
    });
};

const authScreen = document.getElementById("orbit-auth-screen");
const loginForm = document.getElementById("orbit-login-form");
const registerForm = document.getElementById("orbit-register-form");
const authMessage = document.getElementById("orbit-auth-message");
const authTabs = document.querySelectorAll("[data-auth-tab]");
const forgotPasswordButton = document.getElementById("orbit-forgot-password");
const settingsEmail = document.getElementById("settings-account-email");
const settingsProfileName = document.getElementById("settings-profile-name");
const settingsProfileEmail = document.getElementById("settings-profile-email");
const settingsAvatar = document.getElementById("settings-avatar");
const settingsNameInput = document.getElementById("settings-name");
const settingsEmailInput = document.getElementById("settings-email");
const saveProfileButton = document.getElementById("settings-save-profile");
const profileStatus = document.getElementById("settings-profile-status");
const newPasswordInput = document.getElementById("settings-new-password");
const confirmPasswordInput = document.getElementById("settings-confirm-password");
const updatePasswordButton = document.getElementById("settings-update-password");
const passwordStatus = document.getElementById("settings-password-status");
const logoutButton = document.getElementById("settings-logout-button");

function showAuthMessage(message, type = "") {
    if (!authMessage) return;
    authMessage.textContent = message;
    authMessage.className = `orbit-auth-message ${type}`.trim();
}

function setAuthTab(tab) {
    authTabs.forEach((button) => {
        button.classList.toggle("active", button.dataset.authTab === tab);
    });

    loginForm?.classList.toggle("hidden", tab !== "login");
    registerForm?.classList.toggle("hidden", tab !== "register");
    showAuthMessage("");
}

function getUserDisplayName(user) {
    return user?.user_metadata?.name || user?.email?.split("@")[0] || "Usuário";
}

function updateUserUI(user) {
    const displayName = getUserDisplayName(user);
    const email = user?.email || "";

    document.querySelectorAll(".user-area > span").forEach((element) => {
        element.textContent = displayName;
    });

    const dashboardGreetingTitle = document.getElementById("dashboard-greeting-title");
    if (dashboardGreetingTitle) {
        const hour = new Date().getHours();
        const greeting = hour >= 5 && hour < 12
            ? "Bom dia"
            : hour >= 12 && hour < 18
                ? "Boa tarde"
                : "Boa noite";
        dashboardGreetingTitle.textContent = `${greeting}, ${displayName} 👋`;
    }

    if (settingsEmail) {
        settingsEmail.textContent = email;
    }

    if (settingsProfileName) {
        settingsProfileName.textContent = displayName;
    }

    if (settingsProfileEmail) {
        settingsProfileEmail.textContent = email;
    }

    if (settingsAvatar) {
        settingsAvatar.textContent = displayName.charAt(0).toUpperCase() || "U";
    }

    if (settingsNameInput) {
        settingsNameInput.value = user?.user_metadata?.name || "";
    }

    if (settingsEmailInput) {
        settingsEmailInput.value = email;
    }
}


function setAppVisible(isVisible) {
    if (!authScreen) return;
    authScreen.classList.toggle("hidden", isVisible);
    document.body.classList.toggle("orbit-auth-locked", !isVisible);
}

async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById("orbit-login-email")?.value.trim();
    const password = document.getElementById("orbit-login-password")?.value;
    const submit = loginForm?.querySelector("button[type='submit']");

    if (!email || !password) return;

    submit && (submit.disabled = true);
    showAuthMessage("Entrando...");

    const { error } = await orbitSupabase.auth.signInWithPassword({
        email,
        password
    });

    submit && (submit.disabled = false);

    if (error) {
        showAuthMessage(error.message, "error");
        return;
    }

    showAuthMessage("");
}

async function handleRegister(event) {
    event.preventDefault();

    const name = document.getElementById("orbit-register-name")?.value.trim();
    const email = document.getElementById("orbit-register-email")?.value.trim();
    const password = document.getElementById("orbit-register-password")?.value;
    const submit = registerForm?.querySelector("button[type='submit']");

    if (!name || !email || !password) return;

    submit && (submit.disabled = true);
    showAuthMessage("Criando sua conta...");

    const { data, error } = await orbitSupabase.auth.signUp({
        email,
        password,
        options: {
            data: { name }
        }
    });

    submit && (submit.disabled = false);

    if (error) {
        showAuthMessage(error.message, "error");
        return;
    }

    if (!data.session) {
        showAuthMessage("Conta criada. Verifique seu e-mail para continuar.", "success");
        setAuthTab("login");
        return;
    }

    showAuthMessage("");
}

async function handleForgotPassword() {
    const email = document.getElementById("orbit-login-email")?.value.trim();

    if (!email) {
        showAuthMessage("Digite seu e-mail primeiro.", "error");
        return;
    }

    showAuthMessage("Enviando instruções...");

    const redirectTo = `${window.location.origin}${window.location.pathname}`;
    const { error } = await orbitSupabase.auth.resetPasswordForEmail(email, {
        redirectTo
    });

    if (error) {
        showAuthMessage(error.message, "error");
        return;
    }

    showAuthMessage("Confira seu e-mail para redefinir a senha.", "success");
}

async function handleSaveProfile() {
    const name = settingsNameInput?.value.trim();

    if (!name) {
        if (profileStatus) {
            profileStatus.textContent = "Digite seu nome.";
            profileStatus.className = "settings-status error";
        }
        return;
    }

    saveProfileButton && (saveProfileButton.disabled = true);
    if (profileStatus) {
        profileStatus.textContent = "Salvando...";
        profileStatus.className = "settings-status";
    }

    const { data, error } = await orbitSupabase.auth.updateUser({
        data: { name }
    });

    saveProfileButton && (saveProfileButton.disabled = false);

    if (error) {
        console.error("Erro ao atualizar perfil:", error);
        if (profileStatus) {
            profileStatus.textContent = "Não foi possível salvar.";
            profileStatus.className = "settings-status error";
        }
        return;
    }

    updateUserUI(data.user);
    if (profileStatus) {
        profileStatus.textContent = "Perfil atualizado.";
        profileStatus.className = "settings-status success";
    }
}

async function handleUpdatePassword() {
    const password = newPasswordInput?.value || "";
    const confirmation = confirmPasswordInput?.value || "";

    if (password.length < 6) {
        if (passwordStatus) {
            passwordStatus.textContent = "A senha precisa ter pelo menos 6 caracteres.";
            passwordStatus.className = "settings-status error";
        }
        return;
    }

    if (password !== confirmation) {
        if (passwordStatus) {
            passwordStatus.textContent = "As senhas não coincidem.";
            passwordStatus.className = "settings-status error";
        }
        return;
    }

    updatePasswordButton && (updatePasswordButton.disabled = true);
    if (passwordStatus) {
        passwordStatus.textContent = "Atualizando...";
        passwordStatus.className = "settings-status";
    }

    const { error } = await orbitSupabase.auth.updateUser({ password });

    updatePasswordButton && (updatePasswordButton.disabled = false);

    if (error) {
        console.error("Erro ao atualizar senha:", error);
        if (passwordStatus) {
            passwordStatus.textContent = "Não foi possível atualizar a senha.";
            passwordStatus.className = "settings-status error";
        }
        return;
    }

    if (newPasswordInput) newPasswordInput.value = "";
    if (confirmPasswordInput) confirmPasswordInput.value = "";
    if (passwordStatus) {
        passwordStatus.textContent = "Senha atualizada com sucesso.";
        passwordStatus.className = "settings-status success";
    }
}

async function handleLogout() {
    const { error } = await orbitSupabase.auth.signOut();

    if (error) {
        console.error("Erro ao sair:", error);
    }
}

authTabs.forEach((button) => {
    button.addEventListener("click", () => setAuthTab(button.dataset.authTab));
});

loginForm?.addEventListener("submit", handleLogin);
registerForm?.addEventListener("submit", handleRegister);
forgotPasswordButton?.addEventListener("click", handleForgotPassword);
saveProfileButton?.addEventListener("click", handleSaveProfile);
updatePasswordButton?.addEventListener("click", handleUpdatePassword);
logoutButton?.addEventListener("click", handleLogout);

orbitSupabase.auth.onAuthStateChange((_event, session) => {
    const user = session?.user || null;

    window.orbitUserId = user?.id || null;

    setAppVisible(Boolean(user));
    updateUserUI(user);

    window.dispatchEvent(
        new CustomEvent("orbit:auth-changed", {
            detail: { user, session }
        })
    );
});

(async () => {
    const { data, error } = await orbitSupabase.auth.getSession();

    if (error) {
        console.error("Erro ao recuperar sessão:", error);
        window.orbitUserId = null;
        orbitAuthReadyResolve(null);
        setAppVisible(false);
        return;
    }

    const session = data.session || null;
    const user = session?.user || null;

    window.orbitUserId = user?.id || null;
    orbitAuthReadyResolve(session);

    window.dispatchEvent(
        new CustomEvent("orbit:auth-changed", {
            detail: { user, session }
        })
    );

    setAppVisible(Boolean(user));
    updateUserUI(user);
})();
