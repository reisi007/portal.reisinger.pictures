local LrApplication = import 'LrApplication'
local LrView = import 'LrView'
local LrDialogs = import 'LrDialogs'
local LrTasks = import 'LrTasks'
local LrHttp = import 'LrHttp'
local LrPrefs = import 'LrPrefs'
local LrBinding = import 'LrBinding'
local LrExportSession = import 'LrExportSession'
local LrProgressScope = import 'LrProgressScope'
local LrFileUtils = import 'LrFileUtils'
local LrPathUtils = import 'LrPathUtils'
local LrFunctionContext = import 'LrFunctionContext'

local prefs = LrPrefs.prefsForPlugin()
local API_URL = "https://portal.reisinger.pictures"
local json = require "json"

local function callApi(endpoint, method, payload, jwt)
    local headers = {}
    if jwt then
        table.insert(headers, { field = "Authorization", value = "Bearer " .. jwt })
    end
    
    local payloadStr = ""
    if payload then
        table.insert(headers, { field = "Content-Type", value = "application/json" })
        payloadStr = json.encode(payload)
    end

    local resBody, resHeaders
    if method == "GET" then
        resBody, resHeaders = LrHttp.get(API_URL .. endpoint, headers)
    elseif method == "PUT" or method == "DELETE" then
        table.insert(headers, { field = "X-HTTP-Method-Override", value = method })
        resBody, resHeaders = LrHttp.post(API_URL .. endpoint, payloadStr, headers)
    else
        resBody, resHeaders = LrHttp.post(API_URL .. endpoint, payloadStr, headers)
    end

    local status = resHeaders and resHeaders.status or 500
    local data = nil
    if resBody and resBody ~= "" then
        local success, parsed = pcall(json.decode, resBody)
        if success then data = parsed end
    end
    return data, status
end

local function login()
    if not prefs.apiUser or not prefs.apiPass then return nil end
    local payload = { email = prefs.apiUser, password = prefs.apiPass }
    local resBody, resHeaders = LrHttp.post(API_URL .. "/api/auth/login", json.encode(payload), { { field = "Content-Type", value = "application/json" } })
    if resHeaders and resHeaders.status == 200 and resBody then
        local success, parsed = pcall(json.decode, resBody)
        if success and parsed and parsed.access_token then
            return parsed.access_token
        end
    end
    return nil
end

local function flattenTree(tree)
    local flat = {}
    
    local function processGroup(group, depth)
        local prefix = string.rep("--", depth) .. "> "
        if group.galleries then
            for _, gal in ipairs(group.galleries) do
                local icon = gal.type == 'selection' and "✨ " or "📦 "
                local live = gal.is_live and " (LIVE)" or ""
                table.insert(flat, { title = prefix .. icon .. gal.name .. live, value = gal.id, raw = gal })
            end
        end
        if group.children then
            for _, child in ipairs(group.children) do
                processGroup(child, depth + 1)
            end
        end
    end

    if tree.groups then
        for _, g in ipairs(tree.groups) do
            processGroup(g, 0)
        end
    end
    
    if tree.root_galleries then
        for _, gal in ipairs(tree.root_galleries) do
            local icon = gal.type == 'selection' and "✨ " or "📦 "
            local live = gal.is_live and " (LIVE)" or ""
            table.insert(flat, { title = icon .. gal.name .. live, value = gal.id, raw = gal })
        end
    end
    
    if #flat == 0 then
        table.insert(flat, { title = "Keine Galerien vorhanden", value = -1 })
    end
    
    return flat
end

return function(mode)
    LrTasks.startAsyncTask(function()
        local catalog = LrApplication.activeCatalog()
        local targetPhotos = catalog:getTargetPhotos()
        local photoCount = #targetPhotos

        local function requireAuth()
            if prefs.apiUser and prefs.apiUser ~= "" and prefs.apiPass and prefs.apiPass ~= "" then
                return true
            end
            local success = false
            LrFunctionContext.callWithContext("AuthContext", function(context)
                local pProps = LrBinding.makePropertyTable(context)
                pProps.user = prefs.apiUser or ""
                pProps.pass = ""

                local f = LrView.osFactory()
                local res = LrDialogs.presentModalDialog {
                    title = "API Zugangsdaten benötigt",
                    contents = f:column {
                        f:row {
                            f:static_text { title = "E-Mail:", width = 100 },
                            f:edit_field {
                                value = LrView.bind { key = "user", bind_to_object = pProps },
                                width_in_chars = 30,
                                fill_horizontal = 1
                            }
                        },
                        f:row {
                            f:static_text { title = "Passwort:", width = 100 },
                            f:password_field {
                                value = LrView.bind { key = "pass", bind_to_object = pProps },
                                width_in_chars = 30,
                                fill_horizontal = 1
                            }
                        }
                    }
                }
                if res == "ok" then
                    prefs.apiUser = pProps.user
                    prefs.apiPass = pProps.pass
                    success = true
                end
            end)
            return success
        end

        local jwt = nil
        while true do
            if not requireAuth() then return end
            jwt = login()
            if jwt then
                break
            else
                LrDialogs.message("Anmeldung fehlgeschlagen", "E-Mail oder Passwort ist falsch.", "critical")
                prefs.apiPass = nil
            end
        end

        -- Filter parameter applied here!
        local treeData, status = callApi("/api/admin/galleries?filter_type=" .. mode, "GET", nil, jwt)
        if not treeData then
            LrDialogs.message("Netzwerkfehler", "Galerien konnten nicht geladen werden.", "critical")
            return
        end

        LrFunctionContext.callWithContext("GalleryManagerContext", function(context)
            local props = LrBinding.makePropertyTable(context)
            
            local function updateDropdown(tData)
                local flat = flattenTree(tData)
                props.galleries = flat
                
                local found = false
                for _, item in ipairs(flat) do
                    if item.value == props.selectedGalleryId then found = true break end
                end
                if not found then props.selectedGalleryId = flat[1].value end
                props.hasGallery = (#flat > 0 and flat[1].value ~= -1)
            end

            props.galleries = {}
            props.selectedGalleryId = -1
            updateDropdown(treeData)

            props.canConvertToDelivery = false
            props.convertToDelivery = false

            props:addObserver("selectedGalleryId", function()
                local selectedGal = nil
                for _, item in ipairs(props.galleries) do
                    if item.value == props.selectedGalleryId and item.raw then
                        selectedGal = item.raw
                        break
                    end
                end
                if selectedGal then
                    -- Da mode gefiltert ist, ist type hier immer "delivery". 
                    -- Checkout nur möglich wenn Galerie noch LIVE ist.
                    props.canConvertToDelivery = selectedGal.is_live
                    props.convertToDelivery = false
                else
                    props.canConvertToDelivery = false
                end
            end)

            local f = LrView.osFactory()
            local uiElements = {}
            
            table.insert(uiElements, f:static_text { title = string.format("Bereit für den Upload: %d Bilder", photoCount), font = "<system/bold>" })
            table.insert(uiElements, f:separator { fill_horizontal = 1 })
            
            table.insert(uiElements, f:row {
                fill_horizontal = 1,
                f:static_text { title = "Galerie:", width = 60 },
                f:popup_menu {
                    items = LrView.bind { key = "galleries", bind_to_object = props },
                    value = LrView.bind { key = "selectedGalleryId", bind_to_object = props },
                    enabled = LrView.bind { key = "hasGallery", bind_to_object = props },
                    fill_horizontal = 1
                },
                f:push_button {
                    title = "Neue...",
                    action = function()
                        LrFunctionContext.callWithContext("NewGalleryContext", function(subContext)
                            local tProps = LrBinding.makePropertyTable(subContext)
                            tProps.gName = ""
                            local res = LrDialogs.presentModalDialog {
                                title = "Neue Galerie anlegen",
                                contents = f:column {
                                    f:row {
                                        f:static_text { title = "Name:", width = 70 },
                                        f:edit_field {
                                            value = LrView.bind { key = "gName", bind_to_object = tProps },
                                            width_in_chars = 30,
                                            fill_horizontal = 1
                                        }
                                    }
                                }
                            }
                            if res == "ok" and tProps.gName and tProps.gName ~= "" then
                                LrTasks.startAsyncTask(function()
                                    local payload = { name = tProps.gName, type = mode }
                                    local resData, stat = callApi("/api/admin/galleries", "POST", payload, jwt)
                                    if stat == 200 and resData and resData.success then
                                        LrDialogs.message("Erfolg", "Galerie wurde erfolgreich angelegt.", "info")
                                        local nTree = callApi("/api/admin/galleries?filter_type=" .. mode, "GET", nil, jwt)
                                        if nTree then
                                            props.selectedGalleryId = resData.gallery.id
                                            updateDropdown(nTree)
                                        end
                                    else
                                        LrDialogs.message("Fehler", "Galerie konnte nicht angelegt werden.", "critical")
                                    end
                                end)
                            end
                        end)
                    end
                }
            })

            if mode == "delivery" then
                table.insert(uiElements, f:row {
                    f:checkbox {
                        title = "Live-Modus beenden (Finale Bilder ausliefern)",
                        value = LrView.bind { key = "convertToDelivery", bind_to_object = props },
                        enabled = LrView.bind { key = "canConvertToDelivery", bind_to_object = props }
                    }
                })
            end

            table.insert(uiElements, f:row {
                f:push_button {
                    title = "Einladungs-Link kopieren...",
                    enabled = LrView.bind { key = "hasGallery", bind_to_object = props },
                    action = function()
                        LrTasks.startAsyncTask(function()
                            local resData, stat = callApi("/api/admin/galleries/" .. props.selectedGalleryId .. "/invites", "POST", {}, jwt)
                            if stat == 200 and resData and resData.link then
                                LrDialogs.message("Link generiert", "Der Link lautet:\n\n" .. resData.link .. "\n\n(Leider unterstützt Lua kein direktes Kopieren in die Zwischenablage. Bitte markiere den Link und drücke Strg/Cmd+C).", "info")
                            else
                                LrDialogs.message("Fehler", "Link konnte nicht generiert werden.", "critical")
                            end
                        end)
                    end
                },
                f:push_button {
                    title = "- Löschen...",
                    enabled = LrView.bind { key = "hasGallery", bind_to_object = props },
                    action = function()
                        local confirm = LrDialogs.confirm("Galerie wirklich löschen?", "Alle Bilder, Personen und Bewertungen dieser Galerie werden unwiderruflich gelöscht.", "Galerie Löschen", "Abbrechen")
                        if confirm == "ok" then
                            LrTasks.startAsyncTask(function()
                                local resData, stat = callApi("/api/admin/galleries/" .. props.selectedGalleryId, "DELETE", nil, jwt)
                                if stat == 200 and resData and resData.success then
                                    LrDialogs.message("Erfolg", "Galerie wurde gelöscht.", "info")
                                    updateDropdown(callApi("/api/admin/galleries?filter_type=" .. mode, "GET", nil, jwt))
                                else
                                    LrDialogs.message("Fehler", "Galerie konnte nicht gelöscht werden.", "critical")
                                end
                            end)
                        end
                    end
                }
            })

            if mode == "selection" then
                table.insert(uiElements, f:separator { fill_horizontal = 1 })
                table.insert(uiElements, f:row {
                    f:push_button {
                        title = "Bewertungen in Katalog synchronisieren...",
                        enabled = LrView.bind { key = "hasGallery", bind_to_object = props },
                        action = function()
                            LrTasks.startAsyncTask(function()
                                local resData, stat = callApi("/api/admin/galleries/" .. props.selectedGalleryId .. "/export", "GET", nil, jwt)
                                if stat == 200 and resData then
                                    catalog:withWriteAccessDo("Bewertungen synchronisieren", function(writeContext)
                                        local matchCount = 0
                                        for _, item in ipairs(resData) do
                                            if item.lr_uuid then
                                                local photo = catalog:findPhotoByUuid(item.lr_uuid)
                                                if photo then
                                                    matchCount = matchCount + 1
                                                    if item.avg_rating then
                                                        photo:setRawMetadata("rating", tonumber(item.avg_rating))
                                                    end
                                                    if item.all_comments and item.all_comments ~= "" then
                                                        photo:setRawMetadata("instructions", item.all_comments)
                                                    end
                                                end
                                            end
                                        end
                                        LrDialogs.message("Synchronisation abgeschlossen", matchCount .. " Bilder wurden im Katalog aktualisiert. Bitte prüfe das Feld 'Anweisungen' (Instructions).", "info")
                                    end)
                                else
                                    LrDialogs.message("Fehler", "Bewertungen konnten nicht abgerufen werden.", "critical")
                                end
                            end)
                        end
                    }
                })
            end

            local result = LrDialogs.presentModalDialog {
                title = mode == "selection" and "Bewertungs-Galerie Manager" or "Delivery-Galerie Manager",
                resizable = true,
                contents = f:column(uiElements),
                actionVerb = "Upload starten",
                cancelVerb = "Schließen"
            }

            if result == "ok" then
                if not props.hasGallery or props.selectedGalleryId == -1 then
                    LrDialogs.message("Abbruch", "Du musst eine Galerie auswählen.", "warning")
                    return
                end
                if photoCount == 0 then
                    LrDialogs.message("Keine Bilder ausgewählt!", "Bitte markiere Bilder im Lightroom Raster.", "warning")
                    return
                end

                LrTasks.startAsyncTask(function()
                    if mode == "delivery" and props.convertToDelivery then
                        callApi("/api/admin/galleries/" .. props.selectedGalleryId, "PUT", { is_live = false }, jwt)
                    end

                    local progress = LrProgressScope({ title = "Exportiere und Lade hoch (" .. photoCount .. " Bilder)..." })
                    progress:setCancelable(true)

                    local tempPath = LrPathUtils.getStandardFilePath('temp')
                    local galleryUploadDir = LrPathUtils.child(tempPath, "Reisinger_Uploads_" .. props.selectedGalleryId)
                    LrFileUtils.createAllDirectories(galleryUploadDir)

                    local exportSettings = {
                        LR_format = "JPEG",
                        LR_export_quality = 80,
                        LR_export_colorSpace = "sRGB",
                        LR_export_destinationType = "specificFolder",
                        LR_export_destinationPathPrefix = galleryUploadDir,
                        LR_export_useSubfolder = false
                    }

                    if mode == "selection" then
                        exportSettings.LR_size_doConstrain = true
                        exportSettings.LR_size_doNotEnlarge = true
                        exportSettings.LR_size_resizeType = "longEdge"
                        exportSettings.LR_size_maxWidth = 3000
                        exportSettings.LR_size_maxHeight = 3000
                        exportSettings.LR_minimizeEmbeddedMetadata = false
                        exportSettings.LR_removeLocationMetadata = false
                    else
                        exportSettings.LR_size_doConstrain = false
                        exportSettings.LR_minimizeEmbeddedMetadata = false
                        exportSettings.LR_removeLocationMetadata = false
                    end

                    local session = LrExportSession({ photosToExport = targetPhotos, exportSettings = exportSettings })

                    local i = 0
                    for _, rendition in session:renditions() do
                        if progress:isCanceled() then break end
                        i = i + 1
                        progress:setPortionComplete(i - 1, photoCount)

                        local success, pathOrMessage = rendition:waitForRender()
                        if success then
                            local path = pathOrMessage
                            local filename = LrPathUtils.leafName(path)
                            local lrUuid = rendition.photo:getRawMetadata("uuid")

                            progress:setCaption("Upload: " .. filename)

                            local resBody, resHeaders = LrHttp.postMultipart(API_URL .. "/api/admin/upload", {
                                { name = "gallery_id", value = tostring(props.selectedGalleryId) },
                                { name = "lr_uuid",    value = lrUuid },
                                { name = "file",       fileName = filename, filePath = path, contentType = "image/jpeg" }
                            }, { { field = "Authorization", value = "Bearer " .. jwt } })

                            if resHeaders and resHeaders.status == 200 then
                                LrFileUtils.delete(path)
                            else
                                LrDialogs.message("Upload Fehler", "Bild " .. filename .. " konnte nicht hochgeladen werden.\nStatus: " .. tostring(resHeaders and resHeaders.status), "warning")
                            end
                        else
                            LrDialogs.message("Render Fehler", "Bild " .. i .. " konnte nicht exportiert werden.\n\nGrund: " .. tostring(pathOrMessage), "error")
                        end
                    end

                    progress:done()
                    LrDialogs.message("Erfolg", "Upload abgeschlossen!", "info")
                end)
            end
        end)
    end)
end
