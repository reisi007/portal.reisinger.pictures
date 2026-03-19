# Backlog, Security & Future Architectures

## 🖼️ Architektur, Performance & Bildverarbeitung (Priorität 2)

* [ ] **ARCHITEKTUR - Harte Dateisystem-Operationen abstrahieren:**
  * **Wo:** `CleanupGalleries.php`, `PhotoController.php`, `ImageController.php`, `FtpController.php`.
  * **Problem:** Es werden native PHP-Befehle wie `mkdir()`, `rmdir()`, `unlink()`, und `glob()` in Kombination mit `base_path('../photos')` verwendet.
  * **Lösung:** In der `config/filesystems.php` eine eigene Disk `photos` anlegen. Überall im Code die native Laravel Storage Facade (`Storage::disk('photos')->delete()`, `Storage::disk('photos')->makeDirectory()`) verwenden. Das bereitet das System auf zukünftige Amazon S3 Migrationen vor.

* [ ] **ARCHITEKTUR - Synchrone Bildverarbeitung auflösen (Lightroom Performance):**
  * **Wo:** `backend/app/Http/Controllers/ImageController.php`.
  * **Problem:** Wenn das Lightroom-Plugin 100 Bilder asynchron hochlädt, starten im Backend 100 parallele PHP-Prozesse, die synchron `exiftool` und `Imagick` (Thumbnail Generierung) ausführen. Das führt bei großen Galerien garantiert zu Timeouts und Server-Crashs.
  * **Lösung:** 1. Einen Laravel Job erstellen: `php artisan make:job ProcessImageUpload`.
    2. Der Controller verschiebt die Datei per `move_uploaded_file` in einen temporären `/photos/temp` Ordner und speichert das Foto-Model sofort mit einem Status `is_processing = true`. 
    3. Der Controller antwortet **sofort** mit `202 Accepted` oder `200 OK`.
    4. Der Dispatcher schiebt den Job in die Datenbank-Queue. Der Job führt `exiftool` und `Imagick` aus, verschiebt die Dateien an den finalen Ort (`/photos/{gallery_id}/...`) und aktualisiert das Datenbank-Model.

* [ ] **ZIP-Download asynchron gestalten (Optional):**
  * **Wo:** `backend/app/Http/Controllers/DownloadController.php`.
  * **Problem:** Das Hinzufügen des Wasserzeichens und das Schreiben der IPTC-Daten (Exiftool) passiert *während* der ZIP-Stream bereits an den Browser ausgeliefert wird. Das ist extrem fehleranfällig für Netzwerk-Timeouts.
  * **Lösung:** Evaluieren, ob bei einem ZIP-Klick erst eine E-Mail getriggert wird ("Dein Download wird vorbereitet"). Im Hintergrund erstellt ein Queue-Worker das fertige ZIP. Sobald fertig, bekommt der User eine Mail mit dem finalen, statischen Download-Link.

## 📊 Analytics & Suche (Priorität 3)

* [ ] **Meilisearch URL-Limitierung für Admins präventiv abfangen:**
  * **Wo:** `backend/app/Http/Controllers/SearchController.php` in `search()`.
  * **Problem:** Aktuell lädt ein Admin alle existierenden `gallery_id`s in ein Array (`Gallery::pluck('id')->toArray()`) und übergibt diese an die Scout Suchanfrage (`->whereIn('gallery_id', $allowedGalleryIds)`). Das bläht den GET-Request an Meilisearch unnötig auf und führt ab einigen tausend Galerien zu HTTP 414 URI Too Long Fehlern.
  * **Lösung:** Scout Query bedingt aufbauen:
    ```php
    $query = Photo::search($q);
    if (!$user->is_admin) {
        $query->whereIn('gallery_id', $allowedGalleryIds);
    }
    $photos = $query->take(100)->get();
    ```
