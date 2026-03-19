return {
    LrSdkVersion = 8.0,
    LrToolkitIdentifier = 'pictures.reisinger.pick',
    LrPluginName = 'pick.reisinger.pictures - Admin Interface',
    VERSION = { major = 1, minor = 1, revision = 0, build = 0, display = "1.1.0" },

    LrPluginInfoProvider = 'PluginInfoProvider.lua',

    LrExportMenuItems = {
        {
            title = "Bewertungs-Galerien verwalten...",
            file = "SelectionManager.lua",
        },
        {
            title = "Delivery-Galerien verwalten...",
            file = "DeliveryManager.lua",
        }
    }
}
