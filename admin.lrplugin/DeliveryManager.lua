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
local API_URL = "http://portal.test" -- In Production anpassen
local json = require "json"

local function callApi(endpoint, method, payload)
    local token = prefs.apiToken or ""
    local headers = { { field = "Authorization", value = "Bearer " .. token } }
    local payloadStr = ""

    if payload then
        table.insert(headers, { field = "Content-Type", value = "application/json" })
        payloadStr = json.encode(payload)
    end

    local resBody, resHeaders = LrHttp.post(API_URL .. endpoint, payloadStr, headers)
    if method == "GET" then resBody, resHeaders = LrHttp.get(API_URL .. endpoint, headers) end

    local status = resHeaders and resHeaders.status or 500
    if status == 200 and resBody and resBody ~= "" then 
        local success, data = pcall(json.decode, resBody)
        if success then return data, status end
    end
    return nil, status
end

LrTasks.startAsyncTask(function()
    local catalog = LrApplication.activeCatalog()
    local targetPhotos = catalog:getTargetPhotos()
    
    if not prefs.apiToken or prefs.apiToken == "" then
        LrDialogs.message("Token fehlt", "Bitte trage dein JWT im Zusatzmodul-Manager ein.", "critical")
        return
    end

    -- Baumstruktur filtern nach Delivery-Galerien
    local tree, status = callApi("/api/admin/galleries", "GET")
    if status ~= 200 or not tree then
        LrDialogs.message("API Fehler", "Konnte Galerien nicht laden (Status " .. tostring(status) .. ").", "critical")
        return
    end

    local flatGalleries = {}
    local function traverseGroups(groups, depth)
        for _, g in ipairs(groups) do
            if g.galleries then
                for _, gal in ipairs(g.galleries) do
                    if gal.type == 'delivery' then
                        table.insert(flatGalleries, { title = string.rep("- ", depth) .. gal.name, value = gal.id })
                    end
                end
            end
            if g.children then traverseGroups(g.children, depth + 1) end
        end
    end
    
    if tree.groups then traverseGroups(tree.groups, 0) end
    if tree.root_galleries then
        for _, gal in ipairs(tree.root_galleries) do
            if gal.type == 'delivery' then
                table.insert(flatGalleries, { title = gal.name, value = gal.id })
            end
        end
    end

    if #flatGalleries == 0 then
        table.insert(flatGalleries, { title = "Keine Delivery-Galerien gefunden", value = -1 })
    end

    LrFunctionContext.callWithContext("DeliveryContext", function(context)
        local props = LrBinding.makePropertyTable(context)
        props.galleries = flatGalleries
        props.selectedGalleryId = flatGalleries[1].value
        props.hasGallery = props.selectedGalleryId ~= -1

        local f = LrView.osFactory()
        local result = LrDialogs.presentModalDialog {
            title = "Reisinger Portal - Delivery Manager",
            resizable = true,
            contents = f:column {
                spacing = f:control_spacing(),
                f:static_text { title = "Bereit für den Upload: " .. #targetPhotos .. " finale Bilder", font = "<system/bold>" },
                f:static_text { title = "Hinweis: Bilder werden in 100% Qualität und voller Auflösung exportiert." },
                f:separator { fill_horizontal = 1 },
                
                f:row {
                    f:static_text { title = "Galerie:", width = 60 },
                    f:popup_menu { 
                        items = LrView.bind { key = "galleries", bind_to_object = props },
                        value = LrView.bind { key = "selectedGalleryId", bind_to_object = props },
                        enabled = LrView.bind { key = "hasGallery", bind_to_object = props },
                        fill_horizontal = 1
                    }
                }
            },
            actionVerb = "Finale Bilder Hochladen",
            cancelVerb = "Schließen"
        }

        if result == "ok" and props.hasGallery and #targetPhotos > 0 then
            LrTasks.startAsyncTask(function()
                local progress = LrProgressScope({ title = "Exportiere finale Bilder..." })
                progress:setCancelable(true)
                local tempDir = LrPathUtils.child(LrPathUtils.getStandardFilePath('temp'), "Portal_Delivery_Upload")
                LrFileUtils.createAllDirectories(tempDir)

                -- Export Settings für Delivery (Volle Qualität, keine Größenbeschränkung)
                local exportSettings = {
                    LR_format = "JPEG", LR_export_quality = 100, LR_export_colorSpace = "sRGB",
                    LR_size_doConstrain = false,
                    LR_minimizeEmbeddedMetadata = false, LR_removeLocationMetadata = false,
                    LR_export_destinationType = "specificFolder", LR_export_destinationPathPrefix = tempDir, 
                    LR_export_useSubfolder = false
                }

                local session = LrExportSession({ photosToExport = targetPhotos, exportSettings = exportSettings })
                local count = 0
                for _, rendition in session:renditions() do
                    if progress:isCanceled() then break end
                    local success, pathOrErr = rendition:waitForRender()
                    if success then
                        count = count + 1
                        progress:setPortionComplete(count, #targetPhotos)
                        local lrUuid = rendition.photo:getRawMetadata("uuid")
                        local filename = LrPathUtils.leafName(pathOrErr)
                        
                        progress:setCaption("Upload: " .. filename)

                        LrHttp.postMultipart(API_URL .. "/api/admin/upload", {
                            { name = "gallery_id", value = tostring(props.selectedGalleryId) },
                            { name = "lr_uuid", value = lrUuid },
                            { name = "file", fileName = filename, filePath = pathOrErr, contentType = "image/jpeg" }
                        }, { { field = "Authorization", value = "Bearer " .. prefs.apiToken } })
                        
                        LrFileUtils.delete(pathOrErr)
                    else
                        LrDialogs.message("Render Fehler", "Bild konnte nicht exportiert werden: " .. tostring(pathOrErr), "error")
                    end
                end
                progress:done()
                LrDialogs.message("Erfolg", "Delivery-Upload abgeschlossen!", "info")
            end)
        elseif result == "ok" and #targetPhotos == 0 then
            LrDialogs.message("Keine Bilder", "Bitte markiere zuerst Bilder im Raster.", "warning")
        end
    end)
end)
