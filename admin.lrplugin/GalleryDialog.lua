local LrView = import 'LrView'
local LrDialogs = import 'LrDialogs'
local LrBinding = import 'LrBinding'
local LrFunctionContext = import 'LrFunctionContext'
local LrTasks = import 'LrTasks'
local Api = require "Api"
local Utils = require "Utils"

return function(mode, editingGallery, treeData, jwt, onSuccess)
    LrFunctionContext.callWithContext("GalleryDialogContext", function(context)
        local f = LrView.osFactory()
        local props = LrBinding.makePropertyTable(context)

        props.gName = editingGallery and editingGallery.name or ""
        props.gSlug = editingGallery and editingGallery.slug or ""
        props.slugEdited = editingGallery and true or false
        props.gPublic = editingGallery and (editingGallery.is_public and "true" or "false") or "false"
        props.gGroup = editingGallery and (editingGallery.gallery_group_id or -1) or -1
        props.gLive = (editingGallery and editingGallery.is_live) == true
        props.gPassword = ""
        props.gExpiresAt = ""
        
        if editingGallery and editingGallery.expires_at and editingGallery.expires_at ~= "" then
            -- Laravel schickt meist ISO Format "YYYY-MM-DDTHH:mm:ss...", wir brauchen nur die ersten 10 Zeichen
            props.gExpiresAt = string.sub(editingGallery.expires_at, 1, 10)
        end

        local isAutoUpdating = false
        props:addObserver("gName", function()
            if not props.slugEdited then 
                isAutoUpdating = true
                props.gSlug = Utils.slugify(props.gName) 
                isAutoUpdating = false
            end
        end)
        props:addObserver("gSlug", function() 
            if not isAutoUpdating then props.slugEdited = true end
        end)

        local groupItems = { { title = "-- Keine (Root Ebene) --", value = -1 } }
        for _, g in ipairs(Utils.flattenGroups(treeData.groups)) do table.insert(groupItems, g) end

        local rows = { spacing = f:control_spacing() }

        table.insert(rows, f:row {
            f:static_text { title = "Name:", width = 120 },
            f:edit_field { value = LrView.bind{key="gName", bind_to_object=props}, fill_horizontal = 1, width_in_chars = 40 }
        })
        table.insert(rows, f:row {
            f:static_text { title = "Slug (URL):", width = 120 },
            f:edit_field { value = LrView.bind{key="gSlug", bind_to_object=props}, fill_horizontal = 1, width_in_chars = 40 }
        })
        table.insert(rows, f:row {
            f:static_text { title = "In Meta-Galerie:", width = 120 },
            f:popup_menu { items = groupItems, value = LrView.bind{key="gGroup", bind_to_object=props}, fill_horizontal = 1 }
        })

        if mode == "selection" then
            table.insert(rows, f:row {
                f:static_text { title = "Sichtbarkeit:", width = 120 },
                f:static_text { title = "Privat (Auswahl-Galerien sind immer privat)", text_color = LrView.color(0.5,0.5,0.5) }
            })
        else
            table.insert(rows, f:row {
                f:static_text { title = "Sichtbarkeit:", width = 120 },
                f:popup_menu {
                    items = { {title="Privat (Passwort/Link)", value="false"}, {title="Öffentlich", value="true"} },
                    value = LrView.bind{key="gPublic", bind_to_object=props}, fill_horizontal = 1
                }
            })
            table.insert(rows, f:row {
                f:spacer { width = 120 },
                f:checkbox { title = "LIVE Galerie (Auto-Refresh für Gäste im Web)", value = LrView.bind{key="gLive", bind_to_object=props} }
            })
        end

        table.insert(rows, f:row {
            f:static_text { title = "Ablaufdatum:", width = 120 },
            f:edit_field { value = LrView.bind{key="gExpiresAt", bind_to_object=props}, fill_horizontal = 1, placeholder_string = "YYYY-MM-DD (Optional)", width_in_chars = 40 }
        })

        table.insert(rows, f:row {
            f:static_text { title = "Passwort (Optional):", width = 120 },
            f:edit_field { value = LrView.bind{key="gPassword", bind_to_object=props}, fill_horizontal = 1, placeholder_string = editingGallery and "(Unverändert lassen)" or "" }
        })

        local res = LrDialogs.presentModalDialog {
            title = Api.getTitle(editingGallery and "Galerie bearbeiten" or "Neue Galerie anlegen"),
            contents = f:column(rows),
            actionVerb = editingGallery and "Speichern" or "Erstellen",
            cancelVerb = "Abbrechen"
        }

        if res == "ok" and props.gName ~= "" then
            LrTasks.startAsyncTask(function()
                local payload = {
                    name = props.gName,
                    slug = props.gSlug,
                    type = mode,
                    is_public = (mode == "selection") and false or (props.gPublic == "true"),
                    is_live = (mode == "delivery") and props.gLive or false,
                    gallery_group_id = props.gGroup == -1 and nil or props.gGroup
                }
                if props.gPassword ~= "" then payload.password = props.gPassword end
                if props.gExpiresAt ~= "" then payload.expires_at = props.gExpiresAt end

                local endpoint = editingGallery and ("/api/management/galleries/" .. editingGallery.id) or "/api/management/galleries"
                local apiMethod = editingGallery and "PUT" or "POST"
                
                local data, status = Api.call(endpoint, apiMethod, payload, jwt)
                if status == 200 then
                    if onSuccess then onSuccess() end
                else
                    LrDialogs.message(Api.getTitle("Fehler"), "Galerie konnte nicht gespeichert werden.", "critical")
                end
            end)
        end
    end)
end
