// Veritabanı Sınıfı
class Database {
    constructor() {
        this.dbName = 'isyeriHekimligiDB';
        this.version = 1;
        this.db = null;
    }

    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = (event) => {
                console.error("Veritabanı hatası:", event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log("Veritabanı başarıyla açıldı");
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('workplaces')) {
                    db.createObjectStore('workplaces', { keyPath: 'id' });
                }
            };
        });
    }

    async getWorkplaces() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['workplaces'], 'readonly');
            const store = transaction.objectStore('workplaces');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    async addWorkplace(workplace) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['workplaces'], 'readwrite');
            const store = transaction.objectStore('workplaces');
            const request = store.add(workplace);

            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }
}

// Uygulama State'i
const appState = {
    db: new Database(),
    currentUser: null
};

// DOM Elementleri
const elements = {
    loginScreen: document.getElementById('loginScreen'),
    mainApp: document.getElementById('mainApp'),
    username: document.getElementById('username'),
    password: document.getElementById('password'),
    loginBtn: document.getElementById('loginBtn'),
    loginError: document.getElementById('loginError'),
    welcomeText: document.getElementById('welcomeText'),
    workplaceList: document.getElementById('workplaceList'),
    addWorkplaceBtn: document.getElementById('addWorkplaceBtn'),
    workplaceNameInput: document.getElementById('workplaceNameInput'),
    workplaceAddressInput: document.getElementById('workplaceAddressInput'),
    saveWorkplaceBtn: document.getElementById('saveWorkplaceBtn'),
    logoutBtn: document.getElementById('logoutBtn')
};

// Yardımcı Fonksiyonlar
function showError(message) {
    elements.loginError.textContent = message;
    elements.loginError.style.display = 'block';
}

function hideError() {
    elements.loginError.style.display = 'none';
}

function showMainView() {
    elements.loginScreen.style.display = 'none';
    elements.mainApp.style.display = 'block';
    elements.welcomeText.textContent = `Hoş geldiniz, ${appState.currentUser.username}`;
}

// İşyeri İşlemleri
async function loadWorkplaces() {
    try {
        const workplaces = await appState.db.getWorkplaces();
        elements.workplaceList.innerHTML = '';
        
        workplaces.forEach(workplace => {
            const li = document.createElement('li');
            li.className = 'workplace-item';
            li.innerHTML = `
                <div class="workplace-info">
                    <h4>${workplace.name}</h4>
                    <p>${workplace.address || 'Adres bilgisi yok'}</p>
                </div>
            `;
            elements.workplaceList.appendChild(li);
        });
    } catch (error) {
        console.error('İşyerleri yüklenirken hata:', error);
    }
}

// Giriş İşlemleri
async function login() {
    try {
        hideError();
        const username = elements.username.value.trim();
        const password = elements.password.value.trim();

        if (!username || !password) {
            throw new Error('Kullanıcı adı ve şifre gereklidir');
        }

        if (username === 'hekim' && password === 'Sifre123!') {
            localStorage.setItem('authToken', 'demo-token');
            appState.currentUser = { username, role: 'doctor' };
            showMainView();
            await loadWorkplaces();
        } else {
            throw new Error('Geçersiz kullanıcı adı veya şifre!');
        }
    } catch (error) {
        showError(error.message);
    }
}

function logout() {
    localStorage.removeItem('authToken');
    location.reload();
}

// Modal İşlemleri
function initModals() {
    elements.addWorkplaceBtn.addEventListener('click', () => {
        elements.workplaceNameInput.value = '';
        elements.workplaceAddressInput.value = '';
        new bootstrap.Modal(elements.workplaceModal).show();
    });

    elements.saveWorkplaceBtn.addEventListener('click', async () => {
        const name = elements.workplaceNameInput.value.trim();
        const address = elements.workplaceAddressInput.value.trim();

        if (!name) {
            alert('İşyeri adı gereklidir');
            return;
        }

        try {
            await appState.db.addWorkplace({
                id: Date.now().toString(),
                name,
                address,
                createdAt: new Date().toISOString()
            });
            await loadWorkplaces();
            bootstrap.Modal.getInstance(elements.workplaceModal).hide();
        } catch (error) {
            console.error('İşyeri ekleme hatası:', error);
        }
    });
}

// Uygulama Başlatma
async function initializeApp() {
    try {
        await appState.db.initDB();
        
        elements.loginBtn.addEventListener('click', login);
        elements.password.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') login();
        });
        
        if (elements.logoutBtn) {
            elements.logoutBtn.addEventListener('click', logout);
        }

        if (localStorage.getItem('authToken')) {
            appState.currentUser = { username: 'hekim', role: 'doctor' };
            showMainView();
            await loadWorkplaces();
        }

        initModals();
        console.log('Uygulama başarıyla başlatıldı');
    } catch (error) {
        console.error('Başlatma hatası:', error);
    }
}

// Sayfa Yüklendiğinde
document.addEventListener('DOMContentLoaded', initializeApp);
