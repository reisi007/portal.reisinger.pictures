return {
    LrSdkVersion = 8.0,
    LrToolkitIdentifier = 'pictures.reisinger.portal',
    LrPluginName = 'reisinger.pictures - Portal',
    VERSION = { major = 2, minor = 0, revision = 0, build = 0, display = "2.0.0" },
    LrPluginInfoProvider = 'PluginInfoProvider.lua',
    LrExportMenuItems = {
        {
            title = "1. Bilder zur Auswahl hochladen...",
            file = "SelectionManager.lua",
        },
        {
            title = "2. Fertige Bilder hochladen (Download)...",
            file = "DeliveryManager.lua",
        }
    }
}
