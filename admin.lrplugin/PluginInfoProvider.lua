local LrView = import 'LrView'
local LrPrefs = import 'LrPrefs'

return {
    sectionsForTopOfDialog = function(f, propertyTable)
        local prefs = LrPrefs.prefsForPlugin()
        return {
            {
                title = "portal.reisinger.pictures API Einstellungen",
                f:row {
                    f:static_text { title = "API Token (JWT):", width = 150 },
                    f:password_field {
                        value = LrView.bind { key = "apiToken", bind_to_object = prefs },
                        fill_horizontal = 1
                    }
                },
                f:row {
                    f:static_text { title = "Hinweis:", width = 150 },
                    f:static_text { title = "Diesen Admin-Token generierst du im Web-Portal." }
                }
            }
        }
    end
}
