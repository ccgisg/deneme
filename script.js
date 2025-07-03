// TAM VERİTABANI SINIFI
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

    // İŞYERİ METODLARI
    async getWorkplaces() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['workplaces'], 'readonly');
            const store = transaction.objectStore('workplaces');
            const request = store.getAll();

            request.onsuccess = () => {
                console.log("İşyerleri başarıyla alındı");
                resolve(request.result || []);
            };
            request.onerror = (event) => {
                console.error("İşyerleri alınırken hata:", event.target.error);
                reject(event.target.error);
            };
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

    // ÇALIŞAN METODLARI
    async getEmployees(workplaceId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['employees'], 'readonly');
            const store = transaction.objectStore('employees');
            const index = store.index('workplaceId');
            const request = index.getAll(workplaceId);

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    async addEmployee(employee) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['employees'], 'readwrite');
            const store = transaction.objectStore('employees');
            const request = store.add(employee);

            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    // DİĞER VERİTABANI METODLARI...
}

// UYGULAMA STATE'İ
const appState = {
    db: new Database(), // Hemen örnekleme yapıyoruz
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
    // Modal işlevselliğini buraya ekleyin
    const modal = new bootstrap.Modal(document.getElementById('ek2Modal'));
    modal.show();
}

function showFileUploadModal(employeeIndex) {
    console.log("Dosya Yükleme Modalı gösteriliyor:", employeeIndex);
    // Modal işlevselliğini buraya ekleyin
    const modal = new bootstrap.Modal(document.getElementById('fileUploadModal'));
    modal.show();
}

function showFileListModal(employeeIndex) {
    console.log("Dosya Listesi Modalı gösteriliyor:", employeeIndex);
    // Modal işlevselliğini buraya ekleyin
    const modal = new bootstrap.Modal(document.getElementById('fileListModal'));
    modal.show();
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
        
        // Örnek işyeri ekleme (veritabanı boşsa)
        if (workplaces.length === 0) {
            await appState.db.addWorkplace({
                id: '1',
                name: 'Örnek İşyeri',
                address: 'Örnek Adres',
                createdAt: new Date().toISOString()
            });
            return loadWorkplaces(); // Yeniden yükle
        }
        
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

// SAYFA YÜKLENDİĞİNDE
document.addEventListener('DOMContentLoaded', initializeApp);

// GLOBAL FONKSİYONLAR
window.showEk2Modal = showEk2Modal;
window.showFileUploadModal = showFileUploadModal;
window.showFileListModal = showFileListModal;
