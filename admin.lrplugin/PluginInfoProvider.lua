local LrView = import 'LrView'
local LrPrefs = import 'LrPrefs'
local LrTasks = import 'LrTasks'
local LrHttp = import 'LrHttp'
local LrDialogs = import 'LrDialogs'
local json = require "json"

return {
    sectionsForTopOfDialog = function(f, propertyTable)
        local prefs = LrPrefs.prefsForPlugin()
        
        local function getTitle(title)
            return prefs.useTestUrl and ("[TEST] " .. title) or title
        end
        
        return {
            {
                title = getTitle("portal.reisinger.pictures API Einstellungen"),
                
                f:row {
                    f:checkbox {
                        title = "Lokale Test-Umgebung (portal.test) verwenden",
                        value = LrView.bind { key = "useTestUrl", bind_to_object = prefs }
                    }
                },

                f:row {
                    f:static_text { title = "E-Mail:", width = 150 },
                    f:edit_field {
                        value = LrView.bind { key = "apiUser", bind_to_object = prefs },
                        fill_horizontal = 1
                    }
                },
                
                f:row {
                    f:static_text { title = "Passwort:", width = 150 },
                    f:password_field {
                        value = LrView.bind { key = "apiPass", bind_to_object = prefs },
                        fill_horizontal = 1
                    }
                },
                
                f:row {
                    f:spacer { width = 150 },
                    f:push_button {
                        title = "Login testen",
                        action = function()
                            LrTasks.startAsyncTask(function()
                                if not prefs.apiUser or prefs.apiUser == "" or not prefs.apiPass or prefs.apiPass == "" then
                                    LrDialogs.message(getTitle("Fehler"), "Bitte E-Mail und Passwort eingeben.", "warning")
                                    return
                                end

                                local apiUrl = prefs.useTestUrl and "https://portal.test" or "https://portal.reisinger.pictures"
                                local payload = { email = prefs.apiUser, password = prefs.apiPass }
                                local resBody, resHeaders = LrHttp.post(
                                    apiUrl .. "/api/auth/login", 
                                    json.encode(payload), 
                                    { { field = "Content-Type", value = "application/json" } }
                                )

                                if resHeaders and resHeaders.status == 200 and resBody then
                                    local success, parsed = pcall(json.decode, resBody)
                                    if success and parsed and parsed.access_token then
                                        LrDialogs.message(getTitle("Erfolg!"), "Verbindung zum Portal erfolgreich hergestellt.\nDer Token wird ab sofort automatisch verwaltet.", "info")
                                        return
                                    end
                                end
                                
                                LrDialogs.message(getTitle("Fehlgeschlagen"), "E-Mail oder Passwort ist falsch.\nStatus Code: " .. tostring(resHeaders and resHeaders.status) .. "\nURL: " .. apiUrl, "critical")
                            end)
                        end
                    }
                },
                
                f:row {
                    f:static_text { title = "Hinweis:", width = 150 },
                    f:static_text { title = "Deine Fotografen-Zugangsdaten für das Web-Portal." }
                }
            }
        }
    end
}
