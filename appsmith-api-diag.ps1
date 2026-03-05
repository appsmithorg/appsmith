#Requires -Version 5.1
<#
.SYNOPSIS
    Appsmith Consolidated API Diagnostic Script (PowerShell)
.DESCRIPTION
    Interactively tests the Appsmith consolidated API and optionally runs
    network diagnostics. On failure, diagnostics run automatically.
#>

$ErrorActionPreference = "Continue"

#region ── Helpers ─────────────────────────────────────────────────────────────

$script:PassCount = 0
$script:FailCount = 0
$script:WarnCount = 0
$script:LogFile = "appsmith-diag-$(Get-Date -Format 'yyyyMMdd_HHmmss').log"

function Log($msg) {
    Write-Host $msg
    $msg | Out-File -Append -FilePath $script:LogFile -Encoding utf8
}

function Log-NoNewline($msg) {
    Write-Host -NoNewline $msg
    $msg | Out-File -Append -NoNewline -FilePath $script:LogFile -Encoding utf8
}

function Pass($msg) {
    Write-Host "  " -NoNewline; Write-Host "PASS" -ForegroundColor Green -NoNewline; Write-Host ": $msg"
    "  PASS: $msg" | Out-File -Append -FilePath $script:LogFile -Encoding utf8
    $script:PassCount++
}

function Fail($msg) {
    Write-Host "  " -NoNewline; Write-Host "FAIL" -ForegroundColor Red -NoNewline; Write-Host ": $msg"
    "  FAIL: $msg" | Out-File -Append -FilePath $script:LogFile -Encoding utf8
    $script:FailCount++
}

function Warn($msg) {
    Write-Host "  " -NoNewline; Write-Host "WARN" -ForegroundColor Yellow -NoNewline; Write-Host ": $msg"
    "  WARN: $msg" | Out-File -Append -FilePath $script:LogFile -Encoding utf8
    $script:WarnCount++
}

function Section($title) {
    $line = ""
    Write-Host ""
    Write-Host "--- $title ---" -ForegroundColor Cyan
    "" | Out-File -Append -FilePath $script:LogFile -Encoding utf8
    "--- $title ---" | Out-File -Append -FilePath $script:LogFile -Encoding utf8
}

function JsonField($obj, [string[]]$path) {
    $val = $obj
    foreach ($p in $path) {
        if ($null -eq $val) { return $null }
        try { $val = $val.$p } catch { return $null }
    }
    return $val
}

# Session container shared across all web requests
$script:Session = $null

function Invoke-AppsmithWeb {
    param(
        [string]$Uri,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [string]$Body,
        [string]$ContentType,
        [int]$TimeoutSec = 30
    )
    $params = @{
        Uri                = $Uri
        Method             = $Method
        UseBasicParsing    = $true
        TimeoutSec         = $TimeoutSec
        MaximumRedirection = 10
        ErrorAction        = "Stop"
    }
    if ($script:Session) { $params.WebSession = $script:Session }
    else { $params.SessionVariable = "script:Session" }
    if ($Headers.Count -gt 0) { $params.Headers = $Headers }
    if ($Body) { $params.Body = $Body }
    if ($ContentType) { $params.ContentType = $ContentType }
    return Invoke-WebRequest @params
}

#endregion

#region ── Configuration ──────────────────────────────────────────────────────

Section "Configuration"

$BaseUrl = Read-Host "Appsmith URL (e.g. https://app.example.com) [http://localhost]"
if ([string]::IsNullOrWhiteSpace($BaseUrl)) { $BaseUrl = "http://localhost" }
$BaseUrl = $BaseUrl.TrimEnd('/')
Log "  Base URL: $BaseUrl"

Log ""
Log "  Authentication method:"
Log "    1) Password login (email + password)"
Log "    2) Browser login (SSO / Google / OAuth - opens browser)"
Log "    3) Paste SESSION cookie (from browser dev tools)"
$AuthMethod = Read-Host "  Choose [1/2/3] [1]"
if ([string]::IsNullOrWhiteSpace($AuthMethod)) { $AuthMethod = "1" }
"Auth method: $AuthMethod" | Out-File -Append -FilePath $script:LogFile -Encoding utf8

$Email = ""
$Password = ""
$SessionCookie = ""

switch ($AuthMethod) {
    "1" {
        $Email = Read-Host "Email"
        $SecurePass = Read-Host "Password" -AsSecureString
        $Password = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePass))
        "(password hidden)" | Out-File -Append -FilePath $script:LogFile -Encoding utf8
    }
    "2" { <# Browser auth - collected later #> }
    "3" {
        Log ""
        Log "  To get your SESSION cookie:"
        Log "    1. Log into Appsmith in your browser"
        Log "    2. Open Developer Tools (F12)"
        Log "    3. Go to Application > Cookies > your Appsmith domain"
        Log "    4. Right-click the SESSION cookie > Edit Value > copy the value"
        Log ""
        $SessionCookie = Read-Host "SESSION cookie value"
        "(session cookie provided: $(if ($SessionCookie) {'yes'} else {'no'}))" | Out-File -Append -FilePath $script:LogFile -Encoding utf8
    }
    default {
        Log "Invalid choice. Defaulting to password login."
        $AuthMethod = "1"
        $Email = Read-Host "Email"
        $SecurePass = Read-Host "Password" -AsSecureString
        $Password = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePass))
    }
}

$Mode = "edit"
$AppId = ""
$PageId = ""
$BranchName = ""

$ParsedUri = [System.Uri]$BaseUrl
$ParsedHost = $ParsedUri.Host
$ParsedScheme = $ParsedUri.Scheme
$ParsedPort = if ($ParsedUri.Port -ne 80 -and $ParsedUri.Port -ne 443) { $ParsedUri.Port } else { "" }

$AuthLabel = switch ($AuthMethod) { "1" {"password"} "2" {"browser (SSO)"} "3" {"cookie paste"} default {"password"} }
Log ""
Log "  Base URL: $BaseUrl"
Log "  Auth:     $AuthLabel"
if ($Email) { Log "  Email:    $Email" }

#endregion

#region ── Authentication ─────────────────────────────────────────────────────

Section "Authentication"
$AuthOK = $false

function Validate-Session {
    try {
        $resp = Invoke-AppsmithWeb -Uri "$BaseUrl/api/v1/users/me" `
            -Headers @{ "X-Requested-By" = "Appsmith" } -TimeoutSec 15
        $userData = $resp.Content | ConvertFrom-Json
        $userEmail = JsonField $userData @("data","email")
        if ($resp.StatusCode -eq 200 -and $userEmail -and $userEmail -ne "null" -and $userEmail -ne "anonymousUser") {
            Pass "Session validated - logged in as $userEmail"
            return $true
        } else {
            Fail "Session not authenticated (HTTP $($resp.StatusCode), user: $userEmail)"
            return $false
        }
    } catch {
        Fail "Session validation failed: $($_.Exception.Message)"
        return $false
    }
}

switch ($AuthMethod) {
    "1" {
        Log "  Fetching initial cookies..."
        try {
            $null = Invoke-AppsmithWeb -Uri "$BaseUrl/" -TimeoutSec 15
            Log "  GET / succeeded"
        } catch {
            Fail "Could not connect to $BaseUrl/ ($($_.Exception.Message))"
            break
        }

        Log "  Logging in as $Email..."
        try {
            $loginResp = Invoke-AppsmithWeb -Uri "$BaseUrl/api/v1/login" -Method POST `
                -Headers @{ "X-Requested-By" = "Appsmith" } `
                -Body "username=$([uri]::EscapeDataString($Email))&password=$([uri]::EscapeDataString($Password))" `
                -ContentType "application/x-www-form-urlencoded" -TimeoutSec 30
            Log "  Login response: HTTP $($loginResp.StatusCode)"

            $sessionCk = $script:Session.Cookies.GetCookies([Uri]$BaseUrl) | Where-Object { $_.Name -eq "SESSION" }
            if ($sessionCk) {
                Pass "SESSION cookie obtained"
                $AuthOK = $true
            } else {
                Fail "SESSION cookie not found after login"
            }
        } catch {
            Fail "Login failed: $($_.Exception.Message)"
        }
    }

    "2" {
        Log "  Opening Appsmith in your default browser..."
        Log "  Please complete the login in your browser, then come back here."
        Log ""
        Start-Process $BaseUrl
        Read-Host "  Press Enter after you have logged in"
        "(user confirmed browser login)" | Out-File -Append -FilePath $script:LogFile -Encoding utf8

        # Try to extract cookie from Chrome on Windows
        Log "  Attempting to extract SESSION cookie from Chrome..."
        $ChromeCookieDb = "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Network\Cookies"
        $extracted = $null

        if (Test-Path $ChromeCookieDb) {
            try {
                # Chrome locks the DB; copy it first
                $tmpDb = [System.IO.Path]::GetTempFileName()
                Copy-Item $ChromeCookieDb $tmpDb -Force
                # Chrome on Windows encrypts cookies with DPAPI; try to read via sqlite + DPAPI
                Log "  Chrome cookies require DPAPI decryption - falling back to manual paste"
            } catch {
                Log "  Could not access Chrome cookie store"
            } finally {
                if (Test-Path $tmpDb) { Remove-Item $tmpDb -Force -ErrorAction SilentlyContinue }
            }
        }

        # Try Firefox (unencrypted SQLite)
        if (-not $extracted) {
            $ffProfiles = Get-ChildItem "$env:APPDATA\Mozilla\Firefox\Profiles\*.default*" -Directory -ErrorAction SilentlyContinue
            foreach ($prof in $ffProfiles) {
                $cookieDb = Join-Path $prof.FullName "cookies.sqlite"
                if (Test-Path $cookieDb) {
                    Log "  Checking Firefox profile: $($prof.Name)..."
                    # Need sqlite3 on PATH
                    if (Get-Command sqlite3 -ErrorAction SilentlyContinue) {
                        $tmpDb = [System.IO.Path]::GetTempFileName()
                        Copy-Item $cookieDb $tmpDb -Force
                        $result = & sqlite3 $tmpDb "SELECT value FROM moz_cookies WHERE name='SESSION' AND (host='$ParsedHost' OR host='.$ParsedHost') ORDER BY lastAccessed DESC LIMIT 1;" 2>$null
                        Remove-Item $tmpDb -Force -ErrorAction SilentlyContinue
                        if ($result) {
                            Log "  Found SESSION cookie in Firefox!"
                            $extracted = $result.Trim()
                            break
                        }
                    } else {
                        Log "  sqlite3 not on PATH - cannot read Firefox cookies"
                    }
                }
            }
        }

        if ($extracted) {
            $SessionCookie = $extracted
        } else {
            Log ""
            Warn "Could not auto-extract cookie from browser stores."
            Log "  Falling back to manual paste..."
            Log ""
            Log "  To get your SESSION cookie:"
            Log "    1. In the browser where you just logged in, open Developer Tools (F12)"
            Log "    2. Go to Application > Cookies > $BaseUrl"
            Log "    3. Right-click the SESSION cookie > Edit Value > copy the value"
            Log ""
            $SessionCookie = Read-Host "  SESSION cookie value"
        }

        if ($SessionCookie) {
            $cookie = [System.Net.Cookie]::new("SESSION", $SessionCookie, "/", $ParsedHost)
            $cookie.HttpOnly = $true
            if (-not $script:Session) {
                $null = Invoke-AppsmithWeb -Uri "$BaseUrl/" -TimeoutSec 15
            }
            $script:Session.Cookies.Add([Uri]$BaseUrl, $cookie)
            Log "  SESSION cookie written to session"
            $AuthOK = Validate-Session
        } else {
            Fail "No SESSION cookie provided"
        }
    }

    "3" {
        if ($SessionCookie) {
            # Bootstrap the session object
            try { $null = Invoke-AppsmithWeb -Uri "$BaseUrl/" -TimeoutSec 15 } catch {}
            $cookie = [System.Net.Cookie]::new("SESSION", $SessionCookie, "/", $ParsedHost)
            $cookie.HttpOnly = $true
            $script:Session.Cookies.Add([Uri]$BaseUrl, $cookie)
            Log "  SESSION cookie written to session"
            $AuthOK = Validate-Session
        } else {
            Fail "No SESSION cookie provided"
        }
    }
}

#endregion

#region ── Consolidated API Call ───────────────────────────────────────────────

Section "Consolidated API Call"

$ApiOK = $false
$RespJson = $null
$ApiUrl = ""

if (-not $AuthOK) {
    Fail "Skipping API call - authentication failed"
} else {
    $qs = @()
    if ($AppId) { $qs += "applicationId=$AppId" }
    if ($PageId) { $qs += "defaultPageId=$PageId" }
    if ($BranchName) { $qs += "branchName=$BranchName" }
    $qsStr = if ($qs.Count -gt 0) { "?" + ($qs -join "&") } else { "" }

    $ApiUrl = "$BaseUrl/api/v1/consolidated-api/$Mode$qsStr"
    Log "  URL: $ApiUrl"

    try {
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        $apiResp = Invoke-AppsmithWeb -Uri $ApiUrl `
            -Headers @{ "X-Requested-By" = "Appsmith" } -TimeoutSec 60
        $sw.Stop()

        $elapsed = $sw.Elapsed
        $totalSec = [math]::Round($elapsed.TotalSeconds, 3)
        $contentLen = $apiResp.Headers["Content-Length"]
        $dlSize = if ($contentLen) { [int]$contentLen } else { $apiResp.Content.Length }
        $dlSpeed = if ($totalSec -gt 0) { [math]::Round($dlSize / $totalSec, 0) } else { 0 }

        Log ""
        Log "  Timing Breakdown:"
        Log "  (Each value shows how long your request spent in that phase)"
        Log ""
        Log "    Total: ${totalSec}s  - Total time from start to finish"
        Log "    Size:  $dlSize bytes"
        Log "    Speed: $dlSpeed bytes/s"
        "  Timing: ${totalSec}s, Size: $dlSize" | Out-File -Append -FilePath $script:LogFile -Encoding utf8

        # Auto-interpret timing
        Log ""
        if ($totalSec -gt 10) {
            Warn "Overall request took ${totalSec}s - this is slower than expected"
        } elseif ($totalSec -gt 5) {
            Log "  NOTE: Server response time (${totalSec}s) is moderate - may be normal for large apps"
        }
        if ($dlSpeed -gt 0 -and $dlSpeed -lt 100000) {
            Warn "Download speed is low ($([math]::Round($dlSpeed/1024, 0)) KB/s). Network bandwidth may be limited."
        }

        Log ""
        Log "  HTTP Status: $($apiResp.StatusCode)"

        if ($apiResp.StatusCode -eq 200) {
            $ApiOK = $true
            Pass "Consolidated API returned 200 OK"
            $RespJson = $apiResp.Content | ConvertFrom-Json

            # Response Analysis - CDN/Cache/Compression headers
            Log ""
            Log "  Response Analysis:"

            $xCache = $apiResp.Headers["X-Cache"]
            $cfCache = $apiResp.Headers["cf-cache-status"]
            $contentEnc = $apiResp.Headers["Content-Encoding"]
            $cacheCtrl = $apiResp.Headers["Cache-Control"]
            $serverHdr = $apiResp.Headers["Server"]
            $viaHdr = $apiResp.Headers["Via"]

            if ($xCache) {
                Log "    CDN Cache (X-Cache): $xCache"
                if ($xCache -match "Hit") { Log "      -> Response was served from CDN cache (fast!)" }
                elseif ($xCache -match "Miss") { Log "      -> CDN cache miss - request went to the origin server" }
            }
            if ($cfCache) { Log "    Cloudflare Cache: $cfCache" }
            if ($contentEnc) {
                Log "    Compression: $contentEnc (response is compressed - good!)"
            } else {
                Warn "No response compression detected. Enabling gzip/brotli could reduce response size."
                Log "      -> Check Appsmith's reverse proxy (nginx/Caddy) has gzip enabled"
            }
            if ($cacheCtrl) { Log "    Cache-Control: $cacheCtrl" }
            if ($serverHdr) { Log "    Server: $serverHdr" }
            if ($viaHdr) { Log "    Via: $viaHdr (indicates a proxy/CDN in the path)" }

            # Response size analysis
            $dlKB = [math]::Round($dlSize / 1024, 1)
            $dlMB = [math]::Round($dlSize / 1048576, 2)
            Log "    Response size: ${dlKB} KB (${dlMB} MB)"
            if ($dlSize -gt 5242880) {
                Warn "Response is over 5 MB - unusually large for the consolidated API"
                Log "      -> Large responses may indicate many widgets, actions, or datasources"
                Log "      -> Consider splitting the application into smaller pages"
            } elseif ($dlSize -gt 1048576) {
                Log "      NOTE: Response is over 1 MB - consider if the app can be optimized"
            }
        } else {
            Fail "Consolidated API returned HTTP $($apiResp.StatusCode)"
        }
    } catch {
        $ex = $_.Exception
        if ($ex.Response) {
            $code = [int]$ex.Response.StatusCode
            Fail "Consolidated API returned HTTP $code"
            Log "  $($ex.Message)"
        } else {
            Fail "Consolidated API request failed: $($ex.Message)"
        }
    }
}

#endregion

#region ── Server Info (/info) ────────────────────────────────────────────────

Section "Server Info (/info)"

try {
    $infoResp = Invoke-AppsmithWeb -Uri "$BaseUrl/info" -TimeoutSec 15
    if ($infoResp.StatusCode -eq 200) {
        Pass "/info returned 200"
        $infoObj = $infoResp.Content | ConvertFrom-Json
        $infoResp.Content | ConvertFrom-Json | ConvertTo-Json -Depth 5 | ForEach-Object { Write-Host "  $_" }

        # Log only (not screen)
        "--- /info response ---" | Out-File -Append -FilePath $script:LogFile -Encoding utf8
        ($infoObj | ConvertTo-Json -Depth 5) | Out-File -Append -FilePath $script:LogFile -Encoding utf8
        "--- end /info response ---" | Out-File -Append -FilePath $script:LogFile -Encoding utf8
    } else {
        Warn "/info returned HTTP $($infoResp.StatusCode)"
    }
} catch {
    Warn "/info request failed: $($_.Exception.Message)"
}

#endregion

#region ── Response Handling ───────────────────────────────────────────────────

# Store consolidated API response in log
if ($RespJson) {
    "" | Out-File -Append -FilePath $script:LogFile -Encoding utf8
    "--- consolidated API response ---" | Out-File -Append -FilePath $script:LogFile -Encoding utf8
    ($RespJson | ConvertTo-Json -Depth 20) | Out-File -Append -FilePath $script:LogFile -Encoding utf8
    "--- end consolidated API response ---" | Out-File -Append -FilePath $script:LogFile -Encoding utf8
}

$RunDiagnostics = $false

if ($ApiOK -and $RespJson) {
    Section "Parsed Response"

    $userName = JsonField $RespJson @("data","userProfile","data","name")
    $userEmail = JsonField $RespJson @("data","userProfile","data","email")
    Log "  User:    $userName ($userEmail)"

    $pages = JsonField $RespJson @("data","pages","data","pages")
    $pagesCount = if ($pages) { $pages.Count } else { 0 }
    Log "  Pages:   $pagesCount"
    if ($pages) { $pages | ForEach-Object { Log "           - $($_.name)" } }

    $pubActions = JsonField $RespJson @("data","publishedActions","data")
    $unpubActions = JsonField $RespJson @("data","unpublishedActions","data")
    $pubCount = if ($pubActions) { $pubActions.Count } else { 0 }
    $unpubCount = if ($unpubActions) { $unpubActions.Count } else { 0 }
    Log "  Actions: $pubCount published / $unpubCount unpublished"

    $themeName = JsonField $RespJson @("data","currentTheme","data","name")
    Log "  Theme:   $themeName"

    if ($Mode -eq "edit") {
        $plugins = JsonField $RespJson @("data","plugins","data")
        $plugCount = if ($plugins) { $plugins.Count } else { 0 }
        Log "  Plugins: $plugCount"
        if ($plugins -and $plugCount -le 10) { $plugins | ForEach-Object { Log "           - $($_.name)" } }

        $datasources = JsonField $RespJson @("data","datasources","data")
        $dsCount = if ($datasources) { $datasources.Count } else { 0 }
        Log "  Datasources: $dsCount"
        if ($datasources) { $datasources | ForEach-Object { Log "           - $($_.name)" } }
    }

    $featureFlags = JsonField $RespJson @("data","featureFlags","data")
    $ffCount = 0
    if ($featureFlags) {
        $ffProps = $featureFlags | Get-Member -MemberType NoteProperty
        $ffCount = $ffProps.Count
    }
    Log "  Feature flags: $ffCount"

    $jsLibs = JsonField $RespJson @("data","customJSLibraries","data")
    $jsLibCount = if ($jsLibs) { $jsLibs.Count } else { 0 }
    Log "  Custom JS libs: $jsLibCount"

    # Per-section health check
    Section "Section Health"
    $sectionErrors = 0
    $dataObj = $RespJson.data
    if ($dataObj) {
        $dataObj | Get-Member -MemberType NoteProperty | ForEach-Object {
            $key = $_.Name
            $section = $dataObj.$key
            $status = JsonField $section @("responseMeta","status")
            if ($status -eq 200) {
                Write-Host "  " -NoNewline; Write-Host "OK" -ForegroundColor Green -NoNewline; Write-Host " ${key}: $status"
                "  OK ${key}: $status" | Out-File -Append -FilePath $script:LogFile -Encoding utf8
            } elseif ($null -eq $status) {
                Write-Host "  " -NoNewline; Write-Host "?" -ForegroundColor Yellow -NoNewline; Write-Host " ${key}: no status"
                "  ? ${key}: no status" | Out-File -Append -FilePath $script:LogFile -Encoding utf8
            } else {
                Write-Host "  " -NoNewline; Write-Host "ERR" -ForegroundColor Red -NoNewline; Write-Host " ${key}: $status"
                "  ERR ${key}: $status" | Out-File -Append -FilePath $script:LogFile -Encoding utf8
                $sectionErrors++
            }
        }
    }
    $script:FailCount += $sectionErrors

    Log ""
    $runDiagInput = Read-Host "API call succeeded. Run network diagnostics? (y/n) [n]"
    if ($runDiagInput -match "^[Yy]") { $RunDiagnostics = $true }

} elseif (-not $ApiOK) {
    if ($RespJson) {
        Section "Error Response"
        Log "  Response body (truncated):"
        ($RespJson | ConvertTo-Json -Depth 5).Substring(0, [Math]::Min(2000, ($RespJson | ConvertTo-Json -Depth 5).Length)) | ForEach-Object { Log "    $_" }
    }
    Log ""
    Log "  Auto-running diagnostics due to failure..."
    $RunDiagnostics = $true
}

#endregion

#region ── Network Diagnostics ────────────────────────────────────────────────

if ($RunDiagnostics) {
    Section "Network Diagnostics"
    Log "  These tests check the network path between this computer and your"
    Log "  Appsmith server. Problems here can cause slow loading or timeouts."

    # DNS Lookup
    Log ""
    Log "  [DNS Lookup] $ParsedHost"
    Log "  (Translates the server name to an IP address)"
    try {
        $dns = [System.Net.Dns]::GetHostAddresses($ParsedHost)
        if ($dns.Count -gt 0) {
            Pass "DNS records:"
            $dns | ForEach-Object { Log "    $($_.IPAddressToString)" }
        } else {
            Warn "No DNS records found for $ParsedHost"
        }
    } catch {
        Fail "DNS lookup failed: $($_.Exception.Message)"
    }

    # Ping
    Log ""
    Log "  [Ping] $ParsedHost"
    Log "  (Tests basic connectivity and measures round-trip time)"
    try {
        $pingResults = Test-Connection -ComputerName $ParsedHost -Count 5 -ErrorAction Stop
        $lost = 5 - $pingResults.Count
        $avgMs = ($pingResults | Measure-Object -Property ResponseTime -Average).Average
        Log "  $($pingResults.Count)/5 received, avg ${avgMs}ms"
        if ($lost -eq 0) { Pass "Ping - no packet loss" }
        else { Warn "Ping - $lost/5 packets lost" }
    } catch {
        Fail "Ping failed: $($_.Exception.Message)"
    }

    # Port Reachability
    Log ""
    Log "  [Port Reachability] $ParsedHost"
    Log "  (Checks if specific service ports are open and accepting connections)"
    foreach ($port in @(80, 443, 8080, 3000)) {
        try {
            $tcp = [System.Net.Sockets.TcpClient]::new()
            $connectTask = $tcp.ConnectAsync($ParsedHost, $port)
            if ($connectTask.Wait(3000)) {
                Pass "Port $port - open"
            } else {
                Log "  - Port $port - closed/filtered"
            }
            $tcp.Dispose()
        } catch {
            Log "  - Port $port - closed/filtered"
        }
    }
    if ($ParsedPort -and $ParsedPort -notin @(80, 443, 8080, 3000)) {
        try {
            $tcp = [System.Net.Sockets.TcpClient]::new()
            $connectTask = $tcp.ConnectAsync($ParsedHost, [int]$ParsedPort)
            if ($connectTask.Wait(3000)) { Pass "Port $ParsedPort (from URL) - open" }
            else { Fail "Port $ParsedPort (from URL) - closed/filtered" }
            $tcp.Dispose()
        } catch {
            Fail "Port $ParsedPort (from URL) - closed/filtered"
        }
    }

    # SSL Certificate
    if ($ParsedScheme -eq "https") {
        Log ""
        Log "  [SSL Certificate] $ParsedHost"
        try {
            $sslPort = if ($ParsedPort) { [int]$ParsedPort } else { 443 }
            $tcp = [System.Net.Sockets.TcpClient]::new($ParsedHost, $sslPort)
            $ssl = [System.Net.Security.SslStream]::new($tcp.GetStream(), $false,
                { param($s,$c,$ch,$e) $true })
            $ssl.AuthenticateAsClient($ParsedHost)
            $cert = $ssl.RemoteCertificate
            if ($cert) {
                $x509 = [System.Security.Cryptography.X509Certificates.X509Certificate2]$cert
                Pass "SSL certificate info:"
                Log "    Subject: $($x509.Subject)"
                Log "    Issuer:  $($x509.Issuer)"
                Log "    Expires: $($x509.NotAfter)"
            }
            $ssl.Dispose(); $tcp.Dispose()
        } catch {
            Fail "Could not retrieve SSL certificate: $($_.Exception.Message)"
        }
    }

    # Health Check
    Log ""
    Log "  [Health Check] /api/v1/health"
    try {
        $healthResp = Invoke-WebRequest -Uri "$BaseUrl/api/v1/health" -UseBasicParsing -TimeoutSec 10
        if ($healthResp.StatusCode -eq 200) { Pass "Health endpoint returned $($healthResp.StatusCode)" }
        else { Warn "Health endpoint returned $($healthResp.StatusCode)" }
    } catch {
        Fail "Health endpoint - connection failed: $($_.Exception.Message)"
    }

    # Traceroute
    Log ""
    Log "  [Traceroute] $ParsedHost (max 10 hops)"
    Log "  (Shows the network path - each 'hop' is a router between you and the server)"
    if (Get-Command tracert -ErrorAction SilentlyContinue) {
        Log "  (This may take up to 30 seconds...)"
        $job = Start-Job { param($h) & tracert -d -h 10 -w 2000 $h 2>&1 } -ArgumentList $ParsedHost
        $completed = $job | Wait-Job -Timeout 30
        if ($completed) {
            $traceOut = Receive-Job $job
            $traceOut | ForEach-Object { Log "    $_" }
        } else {
            Stop-Job $job
            Warn "Traceroute timed out"
        }
        Remove-Job $job -Force -ErrorAction SilentlyContinue
    } else {
        Warn "tracert not available"
    }

    # Connection Reuse Test
    if ($AuthOK) {
        Log ""
        Log "  [Connection Reuse Test] 3 sequential requests"
        for ($i = 1; $i -le 3; $i++) {
            $sw2 = [System.Diagnostics.Stopwatch]::StartNew()
            try {
                $null = Invoke-WebRequest -Uri "$BaseUrl/api/v1/health" -UseBasicParsing -TimeoutSec 15
            } catch {}
            $sw2.Stop()
            Log "  Request #${i}: $([math]::Round($sw2.Elapsed.TotalSeconds, 3))s"
        }
        Log "  (Request #1 is cold; #2-3 benefit from connection reuse)"
    }
}

#endregion

#region ── MongoDB Diagnostics ────────────────────────────────────────────────

$MongoDiagNeeded = $RunDiagnostics
$MongoTimeouts = 0
$MongoSectionErrors = 0

# Check if consolidated API sections had 500/408 errors
if ($ApiOK -and $RespJson) {
    $dataObj = $RespJson.data
    if ($dataObj) {
        $dataObj | Get-Member -MemberType NoteProperty | ForEach-Object {
            $sec = $dataObj.($_.Name)
            $st = JsonField $sec @("responseMeta","status")
            if ($st -eq 500 -or $st -eq 408) { $MongoDiagNeeded = $true }
        }
    }
}

if ($MongoDiagNeeded) {
    Section "MongoDB Diagnostics"
    Log "  Appsmith's /api/v1/health checks MongoDB with a 1-second timeout."
    Log "  These tests probe that endpoint repeatedly to detect intermittent DB issues."

    # Health Check Burst
    Log ""
    Log "  [Health Check Burst] 10 rapid sequential requests to /api/v1/health"
    $mongoFails = 0
    $mongoTimes = @()

    for ($i = 1; $i -le 10; $i++) {
        $sw3 = [System.Diagnostics.Stopwatch]::StartNew()
        $hCode = "000"
        $hBody = ""
        try {
            $hResp = Invoke-WebRequest -Uri "$BaseUrl/api/v1/health" -UseBasicParsing -TimeoutSec 10
            $hCode = $hResp.StatusCode
            $hBody = $hResp.Content
        } catch {
            if ($_.Exception.Response) { $hCode = [int]$_.Exception.Response.StatusCode }
        }
        $sw3.Stop()
        $hTime = [math]::Round($sw3.Elapsed.TotalSeconds, 3)

        $hint = ""
        if ($hCode -eq 408) { $MongoTimeouts++; $hint = " <- MongoDB timeout" }
        elseif ($hBody -match "mongo|database|connection.*timed") { $hint = " <- MongoDB issue" }

        $color = if ($hCode -eq 200) { "Green" } else { "Red"; $mongoFails++ }
        Write-Host "  #${i}: HTTP " -NoNewline; Write-Host "$hCode" -ForegroundColor $color -NoNewline
        Write-Host "  ${hTime}s$hint"
        "  #${i}: HTTP $hCode  ${hTime}s$hint" | Out-File -Append -FilePath $script:LogFile -Encoding utf8

        $mongoTimes += $hTime
    }

    Log ""
    if ($mongoFails -eq 0) { Pass "All 10 health checks passed (MongoDB + Redis healthy)" }
    else { Fail "$mongoFails/10 health checks failed ($MongoTimeouts MongoDB timeouts)" }

    # Timing stats
    if ($mongoTimes.Count -gt 0) {
        $tMin = ($mongoTimes | Measure-Object -Minimum).Minimum
        $tMax = ($mongoTimes | Measure-Object -Maximum).Maximum
        $tAvg = [math]::Round(($mongoTimes | Measure-Object -Average).Average, 3)
        $tJitter = [math]::Round($tMax - $tMin, 3)
        Log "  Response times: min=${tMin}s  max=${tMax}s  avg=${tAvg}s  jitter=${tJitter}s"

        if ($tJitter -gt 0.5) { Warn "High response time jitter (${tJitter}s) - may indicate MongoDB connection pool issues" }
        if ($tMax -gt 1.0) { Warn "Slowest health check (${tMax}s) exceeds MongoDB's 1-second timeout threshold" }
    }

    # Consolidated API Section Analysis
    if ($RespJson) {
        Log ""
        Log "  [Consolidated API Section Analysis]"
        Log "  Sections that hit MongoDB: pages, actions, themes, datasources, plugins"
        Log ""

        $mongoSections = @("pages","publishedActions","unpublishedActions","publishedActionCollections",
            "unpublishedActionCollections","currentTheme","themes","datasources","plugins",
            "customJSLibraries","pagesWithMigratedDsl","pageWithMigratedDsl")

        foreach ($sec in $mongoSections) {
            $secObj = $RespJson.data.$sec
            if (-not $secObj) { continue }
            $secStatus = JsonField $secObj @("responseMeta","status")
            if ($null -eq $secStatus) { continue }
            if ($secStatus -eq 200) {
                Write-Host "  " -NoNewline; Write-Host "OK" -ForegroundColor Green -NoNewline; Write-Host " ${sec}: $secStatus"
                "  OK ${sec}: $secStatus" | Out-File -Append -FilePath $script:LogFile -Encoding utf8
            } else {
                $secErr = JsonField $secObj @("responseMeta","error","message")
                Write-Host "  " -NoNewline; Write-Host "ERR" -ForegroundColor Red -NoNewline; Write-Host " ${sec}: $secStatus - $secErr"
                "  ERR ${sec}: $secStatus - $secErr" | Out-File -Append -FilePath $script:LogFile -Encoding utf8
                $MongoSectionErrors++
            }
        }

        if ($MongoSectionErrors -gt 0) { Fail "$MongoSectionErrors MongoDB-dependent section(s) returned errors" }
        else { Pass "All present MongoDB-dependent sections returned 200" }
    }

    # Sustained Health Check
    Log ""
    Log "  [Sustained Health Check] 3 requests with 2-second gaps"
    $sustainedFails = 0
    for ($i = 1; $i -le 3; $i++) {
        $sw4 = [System.Diagnostics.Stopwatch]::StartNew()
        $sCode = "000"
        try {
            $sResp = Invoke-WebRequest -Uri "$BaseUrl/api/v1/health" -UseBasicParsing -TimeoutSec 10
            $sCode = $sResp.StatusCode
        } catch {
            if ($_.Exception.Response) { $sCode = [int]$_.Exception.Response.StatusCode }
        }
        $sw4.Stop()
        $sTime = [math]::Round($sw4.Elapsed.TotalSeconds, 3)

        $color = if ($sCode -eq 200) { "Green" } else { "Red"; $sustainedFails++ }
        Write-Host "  #${i}: HTTP " -NoNewline; Write-Host "$sCode" -ForegroundColor $color -NoNewline; Write-Host "  ${sTime}s"
        "  #${i}: HTTP $sCode  ${sTime}s" | Out-File -Append -FilePath $script:LogFile -Encoding utf8

        if ($i -lt 3) { Start-Sleep -Seconds 2 }
    }
    if ($sustainedFails -gt 0) { Fail "Sustained health check: $sustainedFails/3 failed - MongoDB may be degraded" }
    else { Pass "Sustained health check: all 3 passed" }

    # Direct MongoDB Connectivity
    Log ""
    Log "  [Direct MongoDB Check]"
    $MongoUri = Read-Host "  MongoDB URI (optional, e.g. mongodb://host:27017/appsmith)"
    "(mongo URI provided: $(if ($MongoUri) {'yes, redacted'} else {'no'}))" | Out-File -Append -FilePath $script:LogFile -Encoding utf8

    if ($MongoUri) {
        # Parse host from URI
        $uriNoCreds = $MongoUri -replace '^mongodb(\+srv)?://[^@]*@', 'mongodb$1://'
        $mongoMatch = [regex]::Match($uriNoCreds, 'mongodb(?:\+srv)?://([^/:,?]+)')
        $MongoHost = if ($mongoMatch.Success) { $mongoMatch.Groups[1].Value } else { "unknown" }
        $portMatch = [regex]::Match($uriNoCreds, ':(\d+)')
        $MongoPort = if ($portMatch.Success -and $portMatch.Groups[1].Value -ne "27017") { [int]$portMatch.Groups[1].Value } else { 27017 }
        $isSrv = $MongoUri -match '\+srv'

        Log "  Parsed: host=$MongoHost port=$MongoPort srv=$isSrv"

        # DNS / SRV lookup
        if ($isSrv) {
            Log ""
            Log "  SRV record lookup:"
            try {
                $nslookup = & nslookup -type=SRV "_mongodb._tcp.$MongoHost" 2>&1 | Out-String
                if ($nslookup -match "service") { Pass "SRV records found" }
                else { Warn "SRV lookup returned no service records" }
                $nslookup -split "`n" | ForEach-Object { Log "    $_" }
            } catch { Warn "SRV lookup failed" }
        }

        # Port reachability
        Log ""
        try {
            $tcp = [System.Net.Sockets.TcpClient]::new()
            $connectTask = $tcp.ConnectAsync($MongoHost, $MongoPort)
            if ($connectTask.Wait(3000)) {
                Pass "MongoDB port $MongoPort reachable on $MongoHost"
            } else {
                Fail "MongoDB port $MongoPort NOT reachable on $MongoHost"
            }
            $tcp.Dispose()
        } catch {
            Fail "MongoDB port $MongoPort NOT reachable on $MongoHost ($($_.Exception.Message))"
        }

        # TLS check
        try {
            Log ""
            $tcp2 = [System.Net.Sockets.TcpClient]::new($MongoHost, $MongoPort)
            $ssl2 = [System.Net.Security.SslStream]::new($tcp2.GetStream(), $false, { param($s,$c,$ch,$e) $true })
            $ssl2.AuthenticateAsClient($MongoHost)
            $cert2 = $ssl2.RemoteCertificate
            if ($cert2) {
                $x5092 = [System.Security.Cryptography.X509Certificates.X509Certificate2]$cert2
                Pass "MongoDB TLS certificate:"
                Log "    Subject: $($x5092.Subject)"
                Log "    Expires: $($x5092.NotAfter)"
            }
            $ssl2.Dispose(); $tcp2.Dispose()
        } catch {
            Log "  - No TLS on MongoDB port (may be expected for non-TLS connections)"
        }

        # mongosh test
        if (Get-Command mongosh -ErrorAction SilentlyContinue) {
            Log ""
            Log "  Testing connection via mongosh..."
            try {
                $mongoOut = & mongosh $MongoUri --eval @"
                    const status = db.serverStatus();
                    print('MongoDB version: ' + status.version);
                    print('Uptime: ' + status.uptime + 's');
                    print('Connections current: ' + status.connections.current);
                    print('Connections available: ' + status.connections.available);
"@ --quiet 2>&1 | Out-String
                if ($mongoOut) {
                    Pass "mongosh connection succeeded:"
                    $mongoOut -split "`n" | ForEach-Object { if ($_) { Log "    $_" } }
                } else {
                    Fail "mongosh connection failed or timed out"
                }
            } catch { Fail "mongosh failed: $($_.Exception.Message)" }
        } else {
            Log "  - mongosh not available - skipping direct DB test"
        }
    } else {
        Log "  Skipped (no URI provided)"
    }
}

#endregion

#region ── Redis Diagnostics ────────────────────────────────────────────────

$RedisDiagNeeded = $MongoDiagNeeded

if ($RedisDiagNeeded) {
    Section "Redis Diagnostics"
    Log "  Appsmith uses Redis for: sessions, caching, rate limiting, real-time"
    Log "  events (pub/sub), git file locking, and auto-commit tracking."
    Log "  The health endpoint checks Redis with a 3-second timeout."
    Log ""

    # Redis-specific Health Analysis
    Log "  [Health Endpoint Redis Analysis]"
    Log "  (The health burst test above checks BOTH MongoDB and Redis)"
    if ($mongoFails -gt 0 -and $MongoTimeouts -eq 0) {
        Warn "Health failures without MongoDB timeouts may indicate Redis issues"
        Log "    -> Redis failures often show as generic 500 errors or connection refused"
    } elseif ($mongoFails -eq 0) {
        Pass "Health endpoint indicates Redis is responding (no failures in burst test)"
    }

    # Rate Limit Detection
    Log ""
    Log "  [Rate Limit Check]"
    Log "  Appsmith uses Redis-backed rate limiting (Bucket4j)."
    Log "  Limits: login = 5 attempts/day, test datasource = 3 per 5 seconds."
    if ($apiResp -and $apiResp.Headers) {
        $rateLimitHeaders = $apiResp.Headers.Keys | Where-Object { $_ -match "ratelimit|retry-after" }
        if ($rateLimitHeaders) {
            Warn "Rate limit headers detected in API response:"
            $rateLimitHeaders | ForEach-Object { Log "    ${_}: $($apiResp.Headers[$_])" }
            Log "    -> You may be hitting Appsmith's rate limits. Wait and retry."
        } else {
            Pass "No rate limiting detected"
        }
    } else {
        Pass "No rate limiting detected"
    }

    # Direct Redis Connectivity
    Log ""
    Log "  [Direct Redis Check]"
    Log "  Note: This requires network access to the Redis server."
    Log "  If Appsmith runs in Docker/K8s, Redis may not be directly accessible."
    $RedisUri = Read-Host "  Redis URI (optional, e.g. redis://host:6379)"
    "(redis URI provided: $(if ($RedisUri) {'yes, redacted'} else {'no'}))" | Out-File -Append -FilePath $script:LogFile -Encoding utf8

    if ($RedisUri) {
        # Parse host:port from Redis URI
        $redisNoCreds = $RedisUri -replace '^rediss?://[^@]*@', ($RedisUri -replace '^(rediss?)://.*', '$1://')
        $redisMatch = [regex]::Match($redisNoCreds, 'rediss?://([^/:,?]+)')
        $RedisHost = if ($redisMatch.Success) { $redisMatch.Groups[1].Value } else { "localhost" }
        $redisPortMatch = [regex]::Match($redisNoCreds, ':(\d+)')
        $RedisPort = if ($redisPortMatch.Success) { [int]$redisPortMatch.Groups[1].Value } else { 6379 }
        $RedisIsTls = $RedisUri -match '^rediss://'

        Log "  Parsed: host=$RedisHost port=$RedisPort tls=$RedisIsTls"

        # Port reachability
        Log ""
        try {
            $tcp = [System.Net.Sockets.TcpClient]::new()
            $connectTask = $tcp.ConnectAsync($RedisHost, $RedisPort)
            if ($connectTask.Wait(3000)) {
                Pass "Redis port $RedisPort reachable on $RedisHost"
            } else {
                Fail "Redis port $RedisPort NOT reachable on $RedisHost"
                Log "    -> Redis may be behind a firewall, in a private network, or not running"
            }
            $tcp.Dispose()
        } catch {
            Fail "Redis port $RedisPort NOT reachable on $RedisHost ($($_.Exception.Message))"
        }

        # TCP connect latency
        Log ""
        Log "  TCP connect latency to Redis (3 attempts):"
        for ($i = 1; $i -le 3; $i++) {
            $swR = [System.Diagnostics.Stopwatch]::StartNew()
            try {
                $tcp2 = [System.Net.Sockets.TcpClient]::new()
                $null = $tcp2.ConnectAsync($RedisHost, $RedisPort).Wait(3000)
                $tcp2.Dispose()
            } catch {}
            $swR.Stop()
            Log "    #${i}: $([math]::Round($swR.Elapsed.TotalSeconds, 3))s"
        }
        Log "  (Appsmith's Lettuce client has a 2-second command timeout)"

        # TLS check
        if ($RedisIsTls) {
            Log ""
            try {
                $tcpTls = [System.Net.Sockets.TcpClient]::new($RedisHost, $RedisPort)
                $sslR = [System.Net.Security.SslStream]::new($tcpTls.GetStream(), $false, { param($s,$c,$ch,$e) $true })
                $sslR.AuthenticateAsClient($RedisHost)
                $certR = $sslR.RemoteCertificate
                if ($certR) {
                    $x509R = [System.Security.Cryptography.X509Certificates.X509Certificate2]$certR
                    Pass "Redis TLS certificate:"
                    Log "    Subject: $($x509R.Subject)"
                    Log "    Expires: $($x509R.NotAfter)"
                }
                $sslR.Dispose(); $tcpTls.Dispose()
            } catch {
                Log "  - Could not verify Redis TLS certificate"
            }
        }

        # redis-cli test
        if (Get-Command redis-cli -ErrorAction SilentlyContinue) {
            Log ""
            Log "  Testing connection via redis-cli..."

            $redisCliArgs = @("-h", $RedisHost, "-p", $RedisPort)
            # Extract password from URI
            $redisPassMatch = [regex]::Match($RedisUri, 'rediss?://[^:]*:([^@]+)@')
            if ($redisPassMatch.Success) {
                $redisCliArgs += @("-a", $redisPassMatch.Groups[1].Value, "--no-auth-warning")
            }
            if ($RedisIsTls) { $redisCliArgs += "--tls" }

            # PING test
            try {
                $redisPing = & redis-cli @redisCliArgs PING 2>&1 | Out-String
                if ($redisPing -match "PONG") {
                    Pass "Redis PING -> PONG (connection successful)"
                } else {
                    Fail "Redis PING failed: $redisPing"
                    Log "    -> Check Redis credentials and network access"
                }
            } catch { Fail "Redis PING failed: $($_.Exception.Message)" }

            # INFO memory
            Log ""
            Log "  Redis memory & client info:"
            try {
                $redisInfo = & redis-cli @redisCliArgs INFO memory 2>&1 | Out-String
                $usedMem = if ($redisInfo -match "used_memory_human:(\S+)") { $Matches[1] }
                $peakMem = if ($redisInfo -match "used_memory_peak_human:(\S+)") { $Matches[1] }
                $memFrag = if ($redisInfo -match "mem_fragmentation_ratio:(\S+)") { $Matches[1] }
                if ($usedMem) { Log "    Memory used: $usedMem" }
                if ($peakMem) { Log "    Memory peak: $peakMem" }
                if ($memFrag) {
                    Log "    Fragmentation ratio: $memFrag"
                    if ([double]$memFrag -gt 1.5) { Warn "High memory fragmentation (${memFrag}x) - Redis may need a restart" }
                }
            } catch {}

            # INFO clients
            try {
                $redisClients = & redis-cli @redisCliArgs INFO clients 2>&1 | Out-String
                $connClients = if ($redisClients -match "connected_clients:(\d+)") { $Matches[1] }
                $blockedCli = if ($redisClients -match "blocked_clients:(\d+)") { $Matches[1] }
                if ($connClients) { Log "    Connected clients: $connClients" }
                if ($blockedCli -and [int]$blockedCli -gt 0) { Warn "Blocked clients: $blockedCli - clients waiting on Redis operations" }
            } catch {}

            # DBSIZE
            try {
                $redisDbsize = & redis-cli @redisCliArgs DBSIZE 2>&1 | Out-String
                $keyCount = if ($redisDbsize -match "(\d+)") { $Matches[1] } else { "unknown" }
                Log "    Total keys: $keyCount"
                Log "    (Includes sessions, rate limit buckets, cached data, locks)"
            } catch {}

            # INFO server
            try {
                $redisServer = & redis-cli @redisCliArgs INFO server 2>&1 | Out-String
                $redisVer = if ($redisServer -match "redis_version:(\S+)") { $Matches[1] }
                $redisUp = if ($redisServer -match "uptime_in_seconds:(\d+)") { [int]$Matches[1] }
                if ($redisVer) { Log "    Redis version: $redisVer" }
                if ($redisUp) {
                    $ts = [TimeSpan]::FromSeconds($redisUp)
                    Log "    Uptime: $($ts.Days)d $($ts.Hours)h $($ts.Minutes)m"
                }
            } catch {}

            # Latency test
            Log ""
            Log "  Redis latency (3 PING samples):"
            for ($i = 1; $i -le 3; $i++) {
                $swLat = [System.Diagnostics.Stopwatch]::StartNew()
                try { $null = & redis-cli @redisCliArgs PING 2>&1 } catch {}
                $swLat.Stop()
                Log "    PING #${i}: $([math]::Round($swLat.Elapsed.TotalMilliseconds, 1))ms"
            }
            Log "    (Appsmith's Lettuce client timeout is 2 seconds per command)"

        } else {
            Log "  - redis-cli not available - skipping detailed Redis diagnostics"
            Log "    -> Install redis-cli to enable (e.g. choco install redis or download from https://redis.io)"
        }
    } else {
        Log "  Skipped (no URI provided)"
    }
}

#endregion

#region ── Summary ────────────────────────────────────────────────────────────

Section "Summary"

Write-Host "  " -NoNewline; Write-Host "Passed: $($script:PassCount)" -ForegroundColor Green
Write-Host "  " -NoNewline; Write-Host "Failed: $($script:FailCount)" -ForegroundColor Red
Write-Host "  " -NoNewline; Write-Host "Warnings: $($script:WarnCount)" -ForegroundColor Yellow
"  Passed: $($script:PassCount)" | Out-File -Append -FilePath $script:LogFile -Encoding utf8
"  Failed: $($script:FailCount)" | Out-File -Append -FilePath $script:LogFile -Encoding utf8
"  Warnings: $($script:WarnCount)" | Out-File -Append -FilePath $script:LogFile -Encoding utf8

Log ""

# Overall Health Assessment
if ($script:FailCount -eq 0 -and $script:WarnCount -eq 0) {
    Write-Host "  " -NoNewline; Write-Host "Everything looks healthy!" -ForegroundColor Green
    Log "  No issues detected with your Appsmith instance."
} elseif ($script:FailCount -eq 0) {
    Write-Host "  " -NoNewline; Write-Host "Mostly healthy, but some warnings to review." -ForegroundColor Yellow
    Log "  Your Appsmith instance is working, but there are minor concerns."
} elseif ($script:FailCount -le 3) {
    Write-Host "  " -NoNewline; Write-Host "Some issues detected." -ForegroundColor Red
    Log "  Your Appsmith instance has problems that may affect performance."
} else {
    Write-Host "  " -NoNewline; Write-Host "Multiple issues detected - Appsmith may not be working correctly." -ForegroundColor Red
}
Log ""

# Prioritized, Plain-Language Suggestions
if ($script:FailCount -gt 0 -or $script:WarnCount -gt 0) {
    Log "  What to do next (in priority order):"
    Log ""

    # Priority 1: Can't connect at all
    if (-not $AuthOK) {
        Log "  1. Cannot connect or log in"
        Log "     The script could not authenticate with your Appsmith instance."
        Log "     Try these:"
        Log "       - Double-check the URL - open it in a browser to make sure it loads"
        Log "       - Verify your email and password are correct"
        Log "       - If using SSO, make sure you completed the browser login"
        Log "       - Check if Appsmith is actually running (try: docker ps or check your hosting)"
        Log ""
    }

    # Priority 2: API errors
    if (-not $ApiOK -and $AuthOK) {
        Log "  2. Consolidated API is not responding correctly"
        Log "     You can log in, but the main API is returning errors."
        Log "     Try these:"
        Log "       - Check the Appsmith server logs for errors"
        Log "       - Restart the Appsmith server (docker restart appsmith)"
        Log "       - The database might be overloaded - see MongoDB/Redis sections below"
        Log ""
    }

    # Priority 3: Database issues
    if ($MongoTimeouts -gt 0 -or $MongoSectionErrors -gt 0) {
        Log "  3. MongoDB may be slow or unhealthy"
        Log "     Some requests to MongoDB are timing out or returning errors."
        Log "     What this means: Appsmith stores all your apps, pages, and queries in"
        Log "     MongoDB. When MongoDB is slow, everything in Appsmith feels slow."
        Log "     Try these:"
        Log "       - Check if MongoDB is running: docker logs appsmith | findstr mongo"
        Log "       - MongoDB might need more memory or CPU"
        Log "       - If using MongoDB Atlas, check your cluster metrics in the Atlas dashboard"
        Log "       - Large apps (100+ widgets/queries) can strain MongoDB - consider splitting"
        Log ""
    }

    Log "  For more help:"
    Log "    - Share the log file with your Appsmith admin or support team"
    Log "    - Appsmith community: https://community.appsmith.com"
    Log "    - Appsmith docs: https://docs.appsmith.com/help-and-support/troubleshooting-guide"
}

Log ""
Log "  Log file: $($script:LogFile)"
Log "  Tip: Share this log file when asking for help - it contains all the details."
Log ""
Log "Done."

#endregion
