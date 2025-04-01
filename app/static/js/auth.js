// 全局变量和工具函数
let currentModal = null;
let isAuthenticated = false;
let currentUser = null;

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// 简化的模态框控制
function showLoginModal() {
    console.log('Showing login modal');
    const modal = document.getElementById('loginContainer');
    if (!modal) {
        console.error('Login modal not found');
        return;
    }
    modal.style.cssText = 'display: flex !important; z-index: 9999;';
}

function showRegisterModal() {
    console.log('Showing register modal');
    const modal = document.getElementById('registerContainer');
    if (!modal) {
        console.error('Register modal not found');
        return;
    }
    modal.style.cssText = 'display: flex !important; z-index: 9999;';
}

function closeAllModals() {
    document.querySelectorAll('.modal-container').forEach(modal => {
        modal.style.display = 'none';
    });
}

// 身份验证处理函数
async function handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                identifier: formData.get('identifier'),
                password: formData.get('password')
            })
        });

        const result = await response.json();
        if (response.ok) {
            showToast(languageManager.getText('loginSuccess'));
            closeAllModals();
            // 登录成功后重新加载文章列表，这样可以获取收藏状态
            window.location.reload();
        } else {
            showToast(result.error || languageManager.getText('loginFailed'));
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast(languageManager.getText('error'));
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const form = e.target;
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: form.username.value,
                email: form.email.value,
                phone: form.phone.value,
                password: form.password.value
            })
        });

        const data = await response.json();
        if (response.ok) {
            showToast('注册成功');
            closeAllModals();
            setTimeout(showLoginModal, 300);
        } else {
            showToast(data.error || '注册失败');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showToast('注册失败');
    }
}

async function handleLogout() {
    try {
        const response = await fetch('/api/auth/logout');
        if (response.ok) {
            isAuthenticated = false;
            currentUser = null;
            updateAuthUI();
            showToast('已退出登录');
            window.location.reload();
        }
    } catch (error) {
        console.error('Logout error:', error);
        showToast('退出失败');
    }
}

// UI 更新函数
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/auth/check');
        const data = await response.json();
        isAuthenticated = data.isAuthenticated;
        currentUser = data.user || null;
        updateAuthUI();
        return isAuthenticated;
    } catch (error) {
        console.error('Auth check failed:', error);
        return false;
    }
}

function updateAuthUI() {
    const authButtons = document.querySelector('.auth-buttons');
    if (!authButtons) return;

    if (isAuthenticated && currentUser) {
        authButtons.innerHTML = `
            <span class="user-name">${currentUser.username}</span>
            <button class="btn-logout" onclick="handleLogout()">退出</button>
        `;
    } else {
        authButtons.innerHTML = `
            <button class="btn-login" onclick="showLoginModal()">登录</button>
            <button class="btn-register" onclick="showRegisterModal()">注册</button>
        `;
    }
}

// 初始化事件监听
document.addEventListener('DOMContentLoaded', () => {
    console.log('Auth system initializing...');

    // 直接绑定按钮事件
    document.querySelectorAll('.btn-login').forEach(btn => {
        btn.addEventListener('click', () => {
            console.log('Login button clicked');
            showLoginModal();
        });
    });

    document.querySelectorAll('.btn-register').forEach(btn => {
        btn.addEventListener('click', () => {
            console.log('Register button clicked');
            showRegisterModal();
        });
    });

    // 绑定关闭事件
    document.querySelectorAll('.close, .modal-backdrop').forEach(el => {
        el.addEventListener('click', closeAllModals);
    });

    // 处理鉴权检查失败
    async function checkAuthNoRedirect() {
        try {
            const response = await fetch('/api/auth/check');
            const data = await response.json();
            // 401 是正常的未登录状态，不需要特殊处理
            if (response.status === 401) {
                return false;
            }
            return data.isAuthenticated;
        } catch (error) {
            console.log('Auth check failed (expected for new sessions)');
            return false;
        }
    }

    // 初始化检查
    checkAuthNoRedirect();
});
