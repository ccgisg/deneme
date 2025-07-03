// VERİTABANI SINIFI (Tüm metodlarla birlikte)
class Database {
    constructor() {
        this.dbName = 'isyeriHekimligiDB';
        this.version = 11;
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
                console.log("Veritabanı upgrade ediliyor");
                
                if (!db.objectStoreNames.contains('workplaces')) {
                    db.createObjectStore('workplaces', { keyPath: 'id' });
                }
                
                if (!db.objectStoreNames.contains('employees')) {
                    const employeeStore = db.createObjectStore('employees', { keyPath: 'id' });
                    employeeStore.createIndex('workplaceId', 'workplaceId', { unique: false });
                }

                if (!db.objectStoreNames.contains('files')) {
                    const filesStore = db.createObjectStore('files', { keyPath: 'id' });
                    filesStore.createIndex('employeeId', 'employeeId', { unique: false });
                }

                if (!db.objectStoreNames.contains('ek2Forms')) {
                    db.createObjectStore('ek2Forms', { keyPath: 'employeeId' });
                }
            };
        });
    }

    // Diğer veritabanı metodları...
    async getWorkplaces() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['workplaces'], 'readonly');
            const store = transaction.objectStore('workplaces');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }
}

// UYGULAMA STATE'İ
const appState = {
    db: null, // Hemen örnekleme yapmıyoruz
    currentUser: null,
    currentWorkplace: null,
    currentEmployees: [],
    currentEmployeeIndex: null,
    currentFileUploadIndex: null,
    isEditingWorkplace: false,
    isEditingEmployee: false
};

// YARDIMCI FONKSİYONLAR
function showError(message, elementId = 'loginError') {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    } else {
        alert(message);
    }
}

function hideError(elementId = 'loginError') {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR');
}

// MODAL FONKSİYONLARI
function showEk2Modal(employeeIndex) {
    console.log("EK-2 Modal gösteriliyor:", employeeIndex);
    // Modal içeriğini buraya ekleyin
}

function showFileUploadModal(employeeIndex) {
    console.log("Dosya Yükleme Modalı gösteriliyor:", employeeIndex);
    // Modal içeriğini buraya ekleyin
}

function showFileListModal(employeeIndex) {
    console.log("Dosya Listesi Modalı gösteriliyor:", employeeIndex);
    // Modal içeriğini buraya ekleyin
}

// GİRİŞ İŞLEMLERİ
async function login() {
    try {
        hideError();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

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
        console.error('Giriş hatası:', error);
    }
}

function showMainView() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    document.getElementById('welcomeText').textContent = 
        `Hoş geldiniz, ${appState.currentUser.username}`;
}

// İŞYERİ İŞLEMLERİ
async function loadWorkplaces() {
    try {
        const workplaces = await appState.db.getWorkplaces();
        console.log("İşyerleri yüklendi:", workplaces);
        // İşyerlerini görüntüleme kodunu buraya ekleyin
    } catch (error) {
        showError('İşyerleri yüklenirken hata oluştu', 'workplaceError');
        console.error('İşyerleri yükleme hatası:', error);
    }
}

// UYGULAMA BAŞLATMA
async function initializeApp() {
    try {
        // Veritabanı başlat
        appState.db = new Database();
        await appState.db.initDB();
        
        // Giriş dinleyicilerini ayarla
        document.getElementById('loginBtn').addEventListener('click', login);
        document.getElementById('password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') login();
        });

        // Oturum kontrolü
        if (localStorage.getItem('authToken')) {
            appState.currentUser = { username: 'hekim', role: 'doctor' };
            showMainView();
            await loadWorkplaces();
        }
        
        console.log("Uygulama başarıyla başlatıldı");
    } catch (error) {
        showError('Uygulama başlatılırken hata oluştu');
        console.error('Başlatma hatası:', error);
    }
}

//
