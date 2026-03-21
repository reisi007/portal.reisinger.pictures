local LrHttp = import 'LrHttp'
local LrPrefs = import 'LrPrefs'
local json = require "json"

local Api = {}

function Api.getApiUrl()
    local prefs = LrPrefs.prefsForPlugin()
    return prefs.useTestUrl and "https://portal.test" or "https://portal.reisinger.pictures"
end

function Api.getTitle(title)
    local prefs = LrPrefs.prefsForPlugin()
    return prefs.useTestUrl and ("[TEST] " .. title) or title
end

function Api.call(endpoint, method, payload, jwt)
    local headers = {}
    if jwt then table.insert(headers, { field = "Authorization", value = "Bearer " .. jwt }) end
    local payloadStr = ""
    if payload then
        table.insert(headers, { field = "Content-Type", value = "application/json" })
        payloadStr = json.encode(payload)
    end
    
    local resBody, resHeaders
    local fullUrl = Api.getApiUrl() .. endpoint
    
    if method == "GET" then
        resBody, resHeaders = LrHttp.get(fullUrl, headers)
    elseif method == "PUT" or method == "DELETE" then
        table.insert(headers, { field = "X-HTTP-Method-Override", value = method })
        resBody, resHeaders = LrHttp.post(fullUrl, payloadStr, headers)
    else
        resBody, resHeaders = LrHttp.post(fullUrl, payloadStr, headers)
    end
    
    local status = resHeaders and resHeaders.status or 500
    local data = nil
    if resBody and resBody ~= "" then
        local success, parsed = pcall(json.decode, resBody)
        if success then data = parsed end
    end
    return data, status
end

function Api.login()
    local prefs = LrPrefs.prefsForPlugin()
    if not prefs.apiUser or not prefs.apiPass then return nil end
    local payload = { email = prefs.apiUser, password = prefs.apiPass }
    local data, status = Api.call("/api/auth/login", "POST", payload, nil)
    if status == 200 and data and data.access_token then return data.access_token end
    return nil
end

function Api.checkRole(jwt)
    local data, status = Api.call("/api/auth/me", "GET", nil, jwt)
    if status == 200 and data then
        if data.is_photographer or data.is_admin then return true, data end
    end
    return false, nil
end

return Api
