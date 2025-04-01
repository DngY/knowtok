const translations = {
    en: {
        discover: 'Discover',
        collections: 'Collections',
        topics: 'Topics',
        login: 'Login',
        register: 'Register',
        readMore: 'Read More →',
        loading: 'Loading amazing content...',
        refresh: 'Refresh',
        noContent: 'No articles found',
        tryAgain: 'Try Again',
        loginTitle: 'Login',
        registerTitle: 'Register Account',
        email: 'Email',
        phone: 'Phone Number',
        password: 'Password',
        username: 'Username',
        noAccount: 'No account yet?',
        hasAccount: 'Already have an account?',
        signUp: 'Sign up now',
        signIn: 'Sign in',
        logout: 'Logout',
        registerButton: 'Register',
        favorites: 'Favorites',
        addToFavorites: 'Add to favorites',
        removeFromFavorites: 'Remove from favorites',
        loginToLike: 'Please login to like articles',
        noFavorites: 'No favorite articles yet'
    },
    zh: {
        discover: '发现',
        collections: '收藏',
        topics: '主题',
        login: '登录',
        register: '注册',
        readMore: '阅读更多 →',
        loading: '正在加载精彩内容...',
        refresh: '刷新',
        noContent: '暂无内容',
        tryAgain: '重试',
        loginTitle: '登录',
        registerTitle: '注册账号',
        email: '邮箱',
        phone: '手机号',
        password: '密码',
        username: '用户名',
        noAccount: '还没有账号？',
        hasAccount: '已有账号？',
        signUp: '立即注册',
        signIn: '去登录',
        logout: '退出登录',
        registerButton: '注册',
        favorites: '我的收藏',
        addToFavorites: '添加收藏',
        removeFromFavorites: '取消收藏',
        loginToLike: '请登录后收藏文章',
        noFavorites: '暂无收藏文章'
    }
};

class LanguageManager {
    constructor() {
        this.currentLang = localStorage.getItem('language') || 'zh';
    }

    setLanguage(lang) {
        this.currentLang = lang;
        localStorage.setItem('language', lang);
        this.updatePageContent();
    }

    getCurrentLanguage() {
        return this.currentLang;
    }

    getText(key) {
        return translations[this.currentLang]?.[key] || translations['en'][key] || key;
    }

    updatePageContent() {
        // 更新所有带有 data-i18n 属性的元素
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            element.textContent = this.getText(key);
        });

        // 更新所有带有 data-i18n-placeholder 属性的输入框
        document.querySelectorAll('[data-i18n-placeholder]').forEach(input => {
            const key = input.getAttribute('data-i18n-placeholder');
            input.placeholder = this.getText(key);
        });

        // 特别处理登录注册按钮
        const loginBtn = document.querySelector('.btn-login');
        const registerBtn = document.querySelector('.btn-register');
        if (loginBtn) loginBtn.textContent = this.getText('login');
        if (registerBtn) registerBtn.textContent = this.getText('register');

        // 触发自定义事件通知其他组件
        window.dispatchEvent(new CustomEvent('languageChanged', { 
            detail: { language: this.currentLang } 
        }));
    }
}

// 创建全局实例
window.languageManager = new LanguageManager();

// 语言切换事件监听
document.addEventListener('DOMContentLoaded', () => {
    window.languageManager.updatePageContent();
});
