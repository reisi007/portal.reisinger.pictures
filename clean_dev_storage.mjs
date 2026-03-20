import fs from 'fs';
import path from 'path';

// Diese Verzeichnisse werden komplett geleert und neu erstellt
const directoriesToWipe = [
    'photos',
    'ftp',
    'backend/storage/app/private/temp',
    'backend/storage/framework/cache/data'
];

console.log('🧹 Starte Bereinigung der lokalen Speicherpfade...');

// 1. Ordner leeren
for (const dir of directoriesToWipe) {
    const fullPath = path.resolve(dir);
    if (fs.existsSync(fullPath)) {
        // Lösche den Ordner rekursiv (OS-unabhängig, funktioniert super auf Windows)
        fs.rmSync(fullPath, { recursive: true, force: true });
        // Erstelle ihn sofort wieder leer
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`✅ Bereinigt: ${dir}`);
    } else {
        // Falls er noch gar nicht existierte, erstelle ihn
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`✅ Erstellt: ${dir}`);
    }
}

// 2. Wasserzeichen-Cache (einzelne Dateien) löschen
const privateStorage = path.resolve('backend/storage/app/private');
let watermarkCount = 0;
if (fs.existsSync(privateStorage)) {
    const files = fs.readdirSync(privateStorage);
    for (const file of files) {
        if (file.startsWith('watermark_master_') && file.endsWith('.png')) {
            fs.rmSync(path.join(privateStorage, file), { force: true });
            watermarkCount++;
        }
    }
}
if (watermarkCount > 0) {
    console.log(`✅ Bereinigt: ${watermarkCount} gecachte Wasserzeichen-Dateien gelöscht.`);
}

// 3. WICHTIG: Die .gitignore im Laravel-Cache wiederherstellen, 
// damit Git den leeren Ordner nicht anmeckert oder ignoriert.
const cacheDataGitignore = path.resolve('backend/storage/framework/cache/data/.gitignore');
fs.writeFileSync(cacheDataGitignore, "*\n!.gitignore\n");

console.log('');
console.log('🎉 Bereinigung abgeschlossen! Die lokalen Datei-Pfade sind jetzt wieder clean.');
console.log('💡 Tipp: Um auch Meilisearch zu resetten, nutze: docker compose down -v');
