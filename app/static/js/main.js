// 全局变量
let isLoading = false;
let page = 1;
let articleCache = [];
const ARTICLES_PER_PAGE = 6;
const PRELOAD_THRESHOLD = ARTICLES_PER_PAGE * 2;

console.log('Main.js loaded'); // 调试信息

// 支持的语言列表
const languages = [
    { code: 'en', name: 'English' },
    { code: 'zh', name: '中文' },
    { code: 'es', name: 'Español' }
];

// 修改创建文章卡片函数，支持国际化
function createArticleCard(article) {
    return `
        <div class="article-card" data-id="${article.id}">
            <div class="article-media">
                ${article.thumbnail ? 
                    `<img src="${article.thumbnail}" alt="${article.title}" loading="lazy">` : 
                    '<div class="placeholder-image">📚</div>'}
            </div>
            <div class="article-content">
                <h3 class="article-title">${article.title || 'Untitled'}</h3>
                <p class="article-extract">${article.extract || 'No description available'}</p>
                <div class="article-actions">
                    <a href="${article.url}" target="_blank" rel="noopener" class="read-more">
                        ${languageManager.getText('readMore')}
                    </a>
                    <button onclick="toggleLike('${article.id}')" class="like-button ${article.isLiked ? 'liked' : ''}">
                        ${article.isLiked ? '❤️' : '🤍'}
                    </button>
                </div>
            </div>
        </div>
    `;
}

// 安全地获取DOM元素
function getContainer() {
    const container = document.getElementById('articles-container');
    if (!container) {
        console.error('Articles container not found');
        return null;
    }
    return container;
}

// 显示文章函数
function displayArticles(articles, append = false) {
    const container = getContainer();
    if (!container) return;
    
    if (!append) {
        container.innerHTML = '';
    }

    if (articles.length === 0) {
        container.innerHTML = `
            <div class="no-content">
                <p>No articles found</p>
                <button onclick="loadArticles()">Try Again</button>
            </div>
        `;
        return;
    }
    
    const articlesHTML = articles.map(createArticleCard).join('');
    if (append) {
        container.insertAdjacentHTML('beforeend', articlesHTML);
    } else {
        container.innerHTML = articlesHTML;
    }
}

// 修改加载文章函数，添加收藏状态检查
async function loadArticles(append = false) {
    if (isLoading) return;
    isLoading = true;

    try {
        // 首先获取文章列表
        const articlesResponse = await fetch(`/api/articles?page=${page}&lang=${languageManager.getCurrentLanguage()}`);
        if (!articlesResponse.ok) throw new Error('Failed to fetch articles');
        
        const articles = await articlesResponse.json();
        
        // 获取用户收藏列表
        try {
            const likesResponse = await fetch('/api/likes');
            if (likesResponse.ok) {
                const likes = await likesResponse.json();
                // 创建一个收藏文章ID的集合
                const likedIds = new Set(likes.map(like => like.id));
                // 给每篇文章添加收藏状态
                articles.forEach(article => {
                    article.isLiked = likedIds.has(article.id);
                });
            }
        } catch (error) {
            console.warn('Failed to fetch likes:', error);
        }

        if (articles.length > 0) {
            displayArticles(articles, append);
            page++;
        } else if (!append) {
            showError('No articles found');
        }
    } catch (error) {
        console.error('Error loading articles:', error);
        if (!append) {
            showError('Failed to load articles');
        }
    } finally {
        isLoading = false;
    }
}

// 预加载函数
async function preloadArticles() {
    console.log('Preloading articles...');
    try {
        const response = await fetch(`/api/articles?page=${page + 1}&lang=${languageManager.getCurrentLanguage()}`);
        if (!response.ok) throw new Error('Failed to preload');
        
        const articles = await response.json();
        if (articles.length > 0) {
            articleCache = articleCache.concat(articles);
            console.log('Preloaded articles:', articles.length, 'New cache size:', articleCache.length);
        }
    } catch (error) {
        console.error('Preload failed:', error);
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing...'); // 调试信息
    
    try {
        // 确保所有需要的DOM元素都存在
        const container = getContainer();
        const select = document.getElementById('languageSelect');
        
        if (!container || !select) {
            console.error('Required DOM elements not found');
            return;
        }

        // 添加滚动事件监听器
        container.addEventListener('scroll', (event) => {
            const target = event.target;
            if (!isLoading && target) {
                const { scrollTop, scrollHeight, clientHeight } = target;
                if (scrollTop + clientHeight >= scrollHeight - 100) {
                    loadArticles(0, true);
                }
            }
        });

        // 添加语言选择事件监听器
        select.addEventListener('change', (event) => {
            languageManager.setLanguage(event.target.value);
            articleCache = [];
            loadArticles();
            updateUILanguage();
        });

        // 初始加载
        loadArticles();
        updateUILanguage();
        
    } catch (error) {
        console.error('Error during initialization:', error);
    }
});

// 修改显示加载状态函数
function showLoading() {
    const container = getContainer();
    if (container) {
        container.innerHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
                <p>${languageManager.getText('loading')}</p>
            </div>
        `;
    }
}

// 显示错误信息
function showError(message) {
    const container = getContainer();
    if (container) {
        container.innerHTML = `
            <div class="error">
                <div>Error</div>
                <div>${message}</div>
                <button onclick="loadArticles()">Try Again</button>
            </div>
        `;
    }
}

// 修改切换语言函数
function changeLanguage() {
    const select = document.getElementById('languageSelect');
    console.log('Language selected:', select.value); // 调试日志
    
    // 使用语言管理器更新语言
    languageManager.setLanguage(select.value);
    
    // 更新界面
    updateUILanguage();
    
    // 重新加载文章
    articleCache = [];
    loadArticles();
    
    // 保存语言选择到本地存储
    localStorage.setItem('preferredLanguage', languageManager.getCurrentLanguage());
}

// 确保DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, initializing...'); // 调试信息
    try {
        // 设置语言选择器的变更事件
        const select = document.getElementById('languageSelect');
        if (select) {
            select.addEventListener('change', (event) => {
                console.log('Language changed:', event.target.value);
                languageManager.setLanguage(event.target.value);
                articleCache = [];
                loadArticles();
                updateUILanguage();
            });
        }

        // 初始化UI并加载文章
        updateUILanguage();
        loadArticles();
        
        // 修改滚动监听器的添加位置
        const container = getContainer();
        container.addEventListener('scroll', handleScroll);
        
    } catch (error) {
        console.error('Error during initialization:', error);
    }
});

// 优化滚动处理
function handleScroll(event) {
    try {
        const container = event.target;
        if (!container || isLoading) return;
        
        const scrollPosition = container.scrollTop + container.clientHeight;
        const scrollHeight = container.scrollHeight;
        
        if (scrollPosition >= scrollHeight - 100) {
            console.log('Loading more articles...');
            loadArticles(0, true);
        }
    } catch (error) {
        console.error('Error handling scroll:', error);
    }
}

// 修改切换喜欢状态函数
async function toggleLike(articleId) {
    try {
        const card = document.querySelector(`[data-id="${articleId}"]`);
        if (!card) {
            console.error('Card not found:', articleId);
            return;
        }
        
        const button = card.querySelector('.like-button');
        const isCurrentlyLiked = button.classList.contains('liked');
        
        const response = await fetch('/api/likes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: articleId,
                title: card.querySelector('.article-title').textContent,
                extract: card.querySelector('.article-extract').textContent,
                url: card.querySelector('.read-more').href,
                thumbnail: card.querySelector('img')?.src || ''
            })
        });

        const result = await response.json();
        
        if (response.status === 401) {
            showLoginModal();
            showToast(languageManager.getText('loginToLike'));
            return;
        }

        if (result.status === 'success') {
            button.textContent = result.isLiked ? '❤️' : '🤍';
            button.classList.toggle('liked', result.isLiked);
            showToast(languageManager.getText(
                result.isLiked ? 'addToFavorites' : 'removeFromFavorites'
            ));
            
            // 如果在收藏页面取消收藏，则移除该卡片
            if (!result.isLiked && window.location.hash === '#favorites') {
                card.remove();
                // 如果没有更多收藏，显示空状态
                if (!document.querySelector('.article-card')) {
                    const container = getContainer();
                    if (container) {
                        container.innerHTML = `
                            <div class="no-content">
                                <p>${languageManager.getText('noFavorites')}</p>
                            </div>
                        `;
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error toggling like:', error);
        showToast(languageManager.getText('error'));
    }
}

// 添加提示消息功能
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // 动画结束后删除元素
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// 显示关于页面
function showAbout() {
    alert('KnowTok - Random Wikipedia Articles\nVersion 1.0');
}

// 修改显示收藏列表函数
async function showLikes() {
    try {
        // 首先检查登录状态
        const authResponse = await fetch('/api/auth/status');
        const authStatus = await authResponse.json();
        
        if (!authStatus.isAuthenticated) {
            showLoginModal();
            showToast(languageManager.getText('loginToLike'));
            return;
        }

        const response = await fetch('/api/likes');
        if (!response.ok) {
            throw new Error('Failed to fetch favorites');
        }

        const likes = await response.json();
        const container = getContainer();
        console.log('Received likes:', likes); // 调试日志
        
        if (!Array.isArray(likes) || likes.length === 0) {
            container.innerHTML = `
                <div class="no-content">
                    <p>${languageManager.getText('noFavorites')}</p>
                </div>
            `;
            return;
        }
        
        // 确保所有收藏的文章都标记为已喜欢
        const articlesWithLikes = likes.map(article => ({
            ...article,
            isLiked: true
        }));
        
        displayArticles(articlesWithLikes, false);
    } catch (error) {
        console.error('Error loading likes:', error);
        showToast(languageManager.getText('error'));
    }
}

// 更新UI语言
function updateUILanguage() {
    try {
        const elements = {
            'loading-message': 'loading',
            'for-you-text': 'forYou',
            'favorites-text': 'favorites',
            'login-btn': 'signIn',
            'register-btn': 'joinNow',
            'logout-btn': 'signOut'
        };

        Object.entries(elements).forEach(([id, key]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = t(key);
            }
        });
    } catch (error) {
        console.error('Error updating UI language:', error);
    }
}

// 修改滚动监听函数
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing scroll detection...');
    
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.addEventListener('scroll', () => {
            const scrollPosition = mainContent.scrollTop + mainContent.clientHeight;
            const totalHeight = mainContent.scrollHeight;
            console.log(`Scroll position: ${scrollPosition}, Total height: ${totalHeight}`);

            // 当距离底部50px时加载更多
            if (totalHeight - scrollPosition < 50 && !isLoading) {
                console.log('Triggering load more...');
                loadArticles(0, true);
            }
        });
    }

    // 初始加载
    loadArticles();
});

// 简化滚动检测逻辑
document.addEventListener('DOMContentLoaded', () => {
    const mainContent = document.querySelector('.main-content');
    console.log('Main content element:', mainContent); // 调试日志

    if (mainContent) {
        // 使用节流函数避免过多调用
        let scrollTimeout;
        mainContent.addEventListener('scroll', () => {
            if (scrollTimeout) return;
            
            scrollTimeout = setTimeout(() => {
                const { scrollTop, scrollHeight, clientHeight } = mainContent;
                console.log('Scroll metrics:', { scrollTop, scrollHeight, clientHeight }); // 调试日志
                
                // 如果距离底部不到100px就加载更多
                if (scrollHeight - (scrollTop + clientHeight) < 100 && !isLoading) {
                    console.log('Triggering load more...'); // 调试日志
                    loadArticles(true);
                }
                
                scrollTimeout = null;
            }, 100);
        });
    }

    // 初始加载
    loadArticles(false);
});

// 添加语言变更监听
window.addEventListener('languageChanged', () => {
    // 重新加载文章列表
    loadArticles(false);
});
