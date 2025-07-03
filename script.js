// Veritabanı Sınıfı (Versiyon hatası düzeltilmiş)
class Database {
    constructor() {
        this.dbName = 'isyeriHekimligiDB';
        this.db = null;
    }

    async initDB() {
        return new Promise((resolve, reject) => {
            // Önce mevcut versiyonu kontrol etmek için bağlantı aç
            const versionCheckRequest = indexedDB.open(this.dbName);
            
            versionCheckRequest.onsuccess = (event) => {
                const db = event.target.result;
                const currentVersion = db.version;
                db.close(); // Kontrol için açtığımız bağlantıyı kapat
                
                // Mevcut versiyonla yeniden aç
                const request = indexedDB.open(this.dbName, currentVersion);
                
                request.onerror = (event) => {
                    console.error("Veritabanı hatası:", event.target.error);
                    reject(event.target.error);
                };

                request.onsuccess = (event) => {
                    this.db = event.target.result;
                    console.log("Veritabanı başarıyla açıldı. Versiyon:", currentVersion);
                    resolve(this.db);
                };

                request.onupgradeneeded = (event) => {
                    // Bu sürümde upgrade gerekirse burada yapılacak
                    console.log("Veritabanı upgrade ediliyor");
                };
            };
            
            versionCheckRequest.onerror = (event) => {
                // Veritabanı yoksa, versiyon 11 ile oluştur
                const request = indexedDB.open(this.dbName, 11);
                
                request.onerror = (event) => {
                    console.error("Veritabanı oluşturma hatası:", event.target.error);
                    reject(event.target.error);
                };

                request.onsuccess = (event) => {
                    this.db = event.target.result;
                    console.log("Yeni veritabanı oluşturuldu. Versiyon: 11");
                    resolve(this.db);
                };

                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    console.log("Veritabanı yapısı oluşturuluyor");
                    
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
            };
        });
    }

    // Diğer veritabanı metodları aynen kalacak...
    async getWorkplaces() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['workplaces'], 'readonly');
            const store = transaction.objectStore('workplaces');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    // ... diğer metodlar
}

// Uygulama State'i
const appState = {
    db: new Database(),
    currentUser: null
};

// ... (diğer kodlar aynen kalacak, önceki basit örnekteki gibi)

// Uygulama Başlatma
async function initializeApp() {
    try {
        await appState.db.initDB();
        
        // ... diğer başlatma kodları
        
        console.log('Uygulama başarıyla başlatıldı');
    } catch (error) {
        console.error('Başlatma hatası:', error);
        showError('Uygulama başlatılırken hata oluştu: ' + error.message);
    }
}

document.addEventListener('DOMContentLoaded', initializeApp);
