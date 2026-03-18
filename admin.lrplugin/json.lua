local json = { _version = "0.1.2" }
local encode
local escape_char_map = { ["\\"] = "\\", ["\""] = "\"", ["\b"] = "b", ["\f"] = "f", ["\n"] = "n", ["\r"] = "r", ["\t"] = "t" }
local escape_char_map_inv = { ["/"] = "/" }
for k, v in pairs(escape_char_map) do escape_char_map_inv[v] = k end
local function escape_char(c) return "\\" .. (escape_char_map[c] or string.format("u%04x", c:byte())) end
local function encode_nil(val) return "null" end
local function encode_table(val, stack)
    local res = {}
    stack = stack or {}
    if stack[val] then error("circular reference") end
    stack[val] = true
    if rawget(val, 1) ~= nil or next(val) == nil then
        local n = 0
        for k in pairs(val) do if type(k) ~= "number" then error("invalid table") end n = n + 1 end
        for i, v in ipairs(val) do table.insert(res, encode(v, stack)) end
        stack[val] = nil
        return "[" .. table.concat(res, ",") .. "]"
    else
        for k, v in pairs(val) do
            if type(k) ~= "string" then error("invalid table") end
            table.insert(res, encode(k, stack) .. ":" .. encode(v, stack))
        end
        stack[val] = nil
        return "{" .. table.concat(res, ",") .. "}"
    end
end
local function encode_string(val) return '"' .. val:gsub('[%z\1-\31\\"]', escape_char) .. '"' end
local function encode_number(val) return string.format("%.14g", val) end
local type_func_map = { ["nil"] = encode_nil, ["table"] = encode_table, ["string"] = encode_string, ["number"] = encode_number, ["boolean"] = tostring }
encode = function(val, stack)
    local t = type(val)
    local f = type_func_map[t]
    if f then return f(val, stack) end
    error("unexpected type '" .. t .. "'")
end
function json.encode(val) return (encode(val)) end
local parse
local function next_char(str, idx, set, negate)
    for i = idx, #str do if set[str:sub(i, i)] ~= negate then return i end end
    return #str + 1
end
local function decode_error(str, idx, msg) error(msg) end
local function parse_string(str, i)
    local res = ""
    local j = i + 1
    local k = j
    while j <= #str do
        local x = str:byte(j)
        if x < 32 then decode_error(str, j, "control character in string")
        elseif x == 92 then
            res = res .. str:sub(k, j - 1)
            j = j + 1
            local c = str:sub(j, j)
            res = res .. escape_char_map_inv[c]
            k = j + 1
        elseif x == 34 then
            res = res .. str:sub(k, j - 1)
            return res, j + 1
        end
        j = j + 1
    end
end
local function parse_number(str, i)
    local x = next_char(str, i, {[" "]=true, ["\t"]=true, ["\r"]=true, ["\n"]=true, ["]"]=true, ["}"]=true, [","]=true})
    local s = str:sub(i, x - 1)
    return tonumber(s), x
end
function json.decode(str) return {} end -- Minimal stub for this setup
return json
