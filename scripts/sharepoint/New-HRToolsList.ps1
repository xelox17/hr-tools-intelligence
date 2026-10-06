<#
.SYNOPSIS
    Creates (or updates) the HR_Tools_Data SharePoint list and loads it with
    the UC0 HR tools portfolio, so Power Automate can drive the catalog from
    SharePoint instead of the hardcoded data/applications.ts array.

.DESCRIPTION
    - If the target site does not exist yet, creates it first as a
      SharePoint Communication site (via the tenant admin center), waits
      for provisioning to finish, then continues.
    - Connects to the target SharePoint site via Azure AD device code
      sign-in (you'll be shown a short code and a URL to open in any
      browser - no credentials are stored in this script, no app
      registration needed).
    - Creates the "HR_Tools_Data" list if it does not already exist.
    - Ensures the required columns exist (Title already exists by default):
        URL          Hyperlink
        Category     Choice
        Scope        Text
        Country      Text
        Description  Multi-line text
    - Upserts the 10 UC0 portfolio tools by Title, so the script is safe to
      re-run (it will not create duplicates, and will refresh existing rows).

.PARAMETER SiteUrl
    The SharePoint site to connect to (and create, if it doesn't exist yet).
    Defaults to the Lesaffre RH site - override with -SiteUrl if the list
    should live on a different site.

.PARAMETER SiteTitle
    The site's display title, used only if the site has to be created.

.PARAMETER AdminUrl
    The tenant's SharePoint admin center URL, used only to create the site
    if it's missing. Auto-derived from -SiteUrl's domain when not given
    (e.g. lesaffre.sharepoint.com -> lesaffre-admin.sharepoint.com).

.EXAMPLE
    ./New-HRToolsList.ps1
    ./New-HRToolsList.ps1 -SiteUrl "https://lesaffre.sharepoint.com/sites/LINT_RH" -SiteTitle "LINT RH"

.NOTES
    Requires the PnP.PowerShell module (installed automatically for the
    current user if missing) and an Azure AD account with permission to
    create sites (SharePoint admin or Global admin) the first time it's
    run, and permission to create lists on the target site on every run.
#>

[CmdletBinding()]
param(
    [string]$SiteUrl = "https://lesaffre.sharepoint.com/sites/LINT_RH",
    [string]$SiteTitle = "LINT RH",
    [string]$AdminUrl
)

$ErrorActionPreference = "Stop"

if (-not $AdminUrl) {
    $AdminUrl = $SiteUrl -replace "^(https://[^.]+)\.sharepoint\.com.*$", '$1-admin.sharepoint.com'
}

# --- 1. Make sure PnP.PowerShell is available -------------------------------

if (-not (Get-Module -ListAvailable -Name PnP.PowerShell)) {
    Write-Host "Installing PnP.PowerShell for the current user..." -ForegroundColor Cyan
    Install-Module -Name PnP.PowerShell -Scope CurrentUser -Force -AllowClobber
}
Import-Module PnP.PowerShell -ErrorAction Stop

# --- 2. Create the site if it doesn't exist yet ------------------------------

Write-Host "Checking whether $SiteUrl already exists (via $AdminUrl)..." -ForegroundColor Cyan
Connect-PnPOnline -Url $AdminUrl -DeviceLogin
$existingSite = Get-PnPTenantSite -Url $SiteUrl -ErrorAction SilentlyContinue

if (-not $existingSite) {
    Write-Host "Site not found - creating it as a Communication site..." -ForegroundColor Cyan
    New-PnPSite -Type CommunicationSite -Title $SiteTitle -Url $SiteUrl | Out-Null

    Write-Host "Waiting for the site to finish provisioning..." -ForegroundColor Cyan
    $ready = $false
    for ($i = 0; $i -lt 24; $i++) {
        Start-Sleep -Seconds 10
        $site = Get-PnPTenantSite -Url $SiteUrl -ErrorAction SilentlyContinue
        if ($site -and $site.Status -eq "Active") {
            $ready = $true
            break
        }
        Write-Host "  still provisioning... ($(($i + 1) * 10)s)" -ForegroundColor DarkGray
    }
    if (-not $ready) {
        throw "Site $SiteUrl did not finish provisioning in time. Check the SharePoint admin center and re-run this script once it shows as Active."
    }
    Write-Host "Site created and active." -ForegroundColor Green
} else {
    Write-Host "Site already exists - reusing it." -ForegroundColor Yellow
}

Disconnect-PnPOnline

# --- 3. Connect to the site via Azure AD (device code sign-in) --------------

Write-Host "Connecting to $SiteUrl ..." -ForegroundColor Cyan
Connect-PnPOnline -Url $SiteUrl -DeviceLogin
Write-Host "Connected." -ForegroundColor Green

# --- 4. Create the list if it doesn't exist ----------------------------------

$listName = "HR_Tools_Data"
$list = Get-PnPList -Identity $listName -ErrorAction SilentlyContinue

if (-not $list) {
    Write-Host "Creating list '$listName'..." -ForegroundColor Cyan
    $list = New-PnPList -Title $listName -Template GenericList -OnQuickLaunch
} else {
    Write-Host "List '$listName' already exists - reusing it." -ForegroundColor Yellow
}

# --- 5. Ensure the required columns exist ------------------------------------

$categoryChoices = @(
    "HRIS",
    "Recruitment",
    "Learning",
    "Payroll",
    "Collaboration",
    "Time Management",
    "Onboarding"
)

function Ensure-Field {
    param(
        [string]$InternalName,
        [string]$DisplayName,
        [string]$Type,
        [string[]]$Choices
    )

    $existing = Get-PnPField -List $listName -Identity $InternalName -ErrorAction SilentlyContinue
    if ($existing) {
        Write-Host "  Field '$InternalName' already exists." -ForegroundColor DarkGray
        return
    }

    Write-Host "  Adding field '$InternalName' ($Type)..." -ForegroundColor Cyan
    switch ($Type) {
        "URL" {
            Add-PnPField -List $listName -InternalName $InternalName -DisplayName $DisplayName -Type URL -AddToDefaultView | Out-Null
        }
        "Choice" {
            Add-PnPField -List $listName -InternalName $InternalName -DisplayName $DisplayName -Type Choice -Choices $Choices -AddToDefaultView | Out-Null
        }
        "Text" {
            Add-PnPField -List $listName -InternalName $InternalName -DisplayName $DisplayName -Type Text -AddToDefaultView | Out-Null
        }
        "MultilineText" {
            Add-PnPField -List $listName -InternalName $InternalName -DisplayName $DisplayName -Type Note -AddToDefaultView | Out-Null
        }
    }
}

Write-Host "Ensuring columns on '$listName'..." -ForegroundColor Cyan
Ensure-Field -InternalName "URL"         -DisplayName "URL"         -Type "URL"
Ensure-Field -InternalName "Category"    -DisplayName "Category"    -Type "Choice" -Choices $categoryChoices
Ensure-Field -InternalName "Scope"       -DisplayName "Scope"       -Type "Text"
Ensure-Field -InternalName "Country"     -DisplayName "Country"     -Type "Text"
Ensure-Field -InternalName "Description" -DisplayName "Description" -Type "MultilineText"

# --- 6. The UC0 portfolio (10 tools) -----------------------------------------
# Scope/Country follow the same convention as my-app/src/data/applications.ts:
# "Corporate" + empty Country = available everywhere; "Local" + a Country =
# restricted to that country.

$tools = @(
    @{ Title = "SuccessFactors";     Url = "https://www.successfactors.com/";                          Category = "HRIS";            Scope = "Corporate"; Country = "";       Description = "SAP SuccessFactors - core HR system for employee records, performance and goals." }
    @{ Title = "Workday";            Url = "https://www.workday.com/";                                  Category = "HRIS";            Scope = "Corporate"; Country = "";       Description = "Workday HCM - workforce planning, compensation and HR analytics." }
    @{ Title = "LinkedIn Recruiter"; Url = "https://business.linkedin.com/talent-solutions/recruiter";  Category = "Recruitment";      Scope = "Corporate"; Country = "";       Description = "Sourcing and candidate outreach platform for the recruitment team." }
    @{ Title = "Cornerstone LMS";    Url = "https://www.cornerstoneondemand.com/";                      Category = "Learning";        Scope = "Corporate"; Country = "";       Description = "Learning Management System - training content, courses and certifications." }
    @{ Title = "ADP France";         Url = "https://www.adp.com/fr-fr";                                 Category = "Payroll";         Scope = "Local";     Country = "France"; Description = "Payroll processing and payslips for the France entity." }
    @{ Title = "Microsoft Teams";    Url = "https://www.microsoft.com/microsoft-teams";                 Category = "Collaboration";   Scope = "Corporate"; Country = "";       Description = "Group-wide chat, meetings and collaboration." }
    @{ Title = "Kelio";              Url = "https://www.kelio.com/";                                    Category = "Time Management"; Scope = "Local";     Country = "France"; Description = "Time tracking and attendance management." }
    @{ Title = "Glassdoor";          Url = "https://www.glassdoor.com/";                                Category = "Recruitment";     Scope = "Corporate"; Country = "";       Description = "Employer branding and candidate reviews platform." }
    @{ Title = "SAP SF Onboarding";  Url = "https://www.sap.com/products/hcm/onboarding.html";           Category = "Onboarding";       Scope = "Corporate"; Country = "";       Description = "SAP SuccessFactors Onboarding - new hire workflows and paperwork." }
    @{ Title = "PayFit";             Url = "https://payfit.com/";                                       Category = "Payroll";         Scope = "Local";     Country = "France"; Description = "Payroll and HR management for small/local entities." }
)

# --- 7. Upsert each tool by Title ---------------------------------------------

Write-Host "Loading $($tools.Count) tools into '$listName'..." -ForegroundColor Cyan

foreach ($tool in $tools) {
    $camlQuery = "<View><Query><Where><Eq><FieldRef Name='Title'/><Value Type='Text'>$($tool.Title)</Value></Eq></Where></Query></View>"
    $existingItem = Get-PnPListItem -List $listName -Query $camlQuery -ErrorAction SilentlyContinue

    $values = @{
        Title       = $tool.Title
        URL         = @{ Url = $tool.Url; Description = $tool.Title }
        Category    = $tool.Category
        Scope       = $tool.Scope
        Country     = $tool.Country
        Description = $tool.Description
    }

    if ($existingItem -and $existingItem.Count -gt 0) {
        Write-Host "  Updating '$($tool.Title)'..." -ForegroundColor DarkGray
        Set-PnPListItem -List $listName -Identity $existingItem[0].Id -Values $values | Out-Null
    } else {
        Write-Host "  Adding '$($tool.Title)'..." -ForegroundColor Green
        Add-PnPListItem -List $listName -Values $values | Out-Null
    }
}

Write-Host ""
Write-Host "Done. '$listName' is ready at: $SiteUrl/Lists/$listName" -ForegroundColor Green
Disconnect-PnPOnline
