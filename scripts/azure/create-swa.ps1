<#
.SYNOPSIS
  Provision the Azure Static Web App that hosts cursive.

.DESCRIPTION
  Creates the resource group + Static Web App without a GitHub source — that
  avoids the auto-generated workflow file Azure would otherwise drop into
  the repo and conflict with the one already at .github/workflows/. Pulls
  the deploy token off the new SWA and stores it as the
  AZURE_STATIC_WEB_APPS_API_TOKEN secret on the GitHub repo so the
  committed workflow can deploy.

  Re-running is safe — az group create and az staticwebapp create are
  no-ops when the resource already exists with the same shape.

.PARAMETER Subscription
  Azure subscription ID or name. Required.

.PARAMETER Hostname
  Optional custom domain (FQDN, e.g. cursive.textjoint.com). When set, the
  script adds a CNAME in the parent DNS zone pointing at the SWA's default
  hostname and binds the hostname on the SWA. Subdomains only — apex
  domains need TXT-token validation (different command shape).

.PARAMETER DnsZoneRg
  Resource group of the DNS zone (required when -Hostname is given). The
  zone name is derived from the hostname (everything after the first dot).

.EXAMPLE
  .\scripts\azure\create-swa.ps1 -Subscription <id-or-name>

.EXAMPLE
  .\scripts\azure\create-swa.ps1 -Subscription <id-or-name> `
    -Hostname cursive.textjoint.com -DnsZoneRg textjoint

.NOTES
  Prereqs (one-time, you'll be prompted in a browser):
    az login
    gh auth login
#>

[CmdletBinding()]
param(
	[Parameter(Mandatory)] [string] $Subscription,
	[string] $ResourceGroup = 'cursive-rg',
	[string] $Name = 'cursive',
	[string] $Location = 'westeurope',
	[string] $Repo = 'jurijsk/cursive',
	[string] $Hostname = '',
	[string] $DnsZoneRg = ''
)

$ErrorActionPreference = 'Stop'

function Assert-LastExit {
	param([string] $Step)
	if ($LASTEXITCODE -ne 0) { throw "$Step failed (exit $LASTEXITCODE)" }
}

# Azure SWA Free tier is only hosted in a handful of regions. Map anything
# unsupported to westeurope so the create call doesn't fail. The resource
# group itself can live in any region.
$swaLocation = $Location
$freeRegions = @('westus2', 'centralus', 'eastus2', 'westeurope', 'eastasia')
if ($freeRegions -notcontains $Location) {
	Write-Host "  note: SWA Free tier doesn't host in $Location; using westeurope for the SWA"
	$swaLocation = 'westeurope'
}

Write-Host "==> az account set --subscription $Subscription"
az account set --subscription $Subscription
Assert-LastExit 'az account set'

az account show --query '{name:name, id:id, tenant:tenantId}' -o table
Assert-LastExit 'az account show'

Write-Host "==> az group create $ResourceGroup ($Location)"
az group create --name $ResourceGroup --location $Location -o table
Assert-LastExit 'az group create'

Write-Host "==> az staticwebapp create $Name ($swaLocation, Free tier)"
az staticwebapp create --name $Name --resource-group $ResourceGroup --location $swaLocation --sku Free -o table
Assert-LastExit 'az staticwebapp create'

Write-Host "==> fetching deploy token"
$token = az staticwebapp secrets list --name $Name --resource-group $ResourceGroup --query 'properties.apiKey' -o tsv
Assert-LastExit 'az staticwebapp secrets list'
if (-not $token) { throw 'deploy token came back empty' }

Write-Host "==> gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN on $Repo"
# Pipe via stdin so the token never lands on the command line / shell history.
$token | gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN --repo $Repo
Assert-LastExit 'gh secret set'

$swaHost = az staticwebapp show --name $Name --resource-group $ResourceGroup --query 'defaultHostname' -o tsv
Assert-LastExit 'az staticwebapp show'

# --- Optional: custom hostname binding --------------------------------------
# When -Hostname is given, idempotently create a CNAME in the parent zone
# pointing at the SWA's default hostname, then bind the hostname on the SWA
# using cname-delegation validation. Only subdomains are supported here —
# apex domains need TXT-token validation (different command shape).
if ($Hostname) {
	if (-not $DnsZoneRg) { throw '-Hostname requires -DnsZoneRg' }
	# Need at least two dots so we have both a record label and a parent zone.
	if (($Hostname.Split('.').Count) -lt 3) {
		throw "$Hostname looks like an apex domain; only subdomains are supported"
	}
	$record = $Hostname.Substring(0, $Hostname.IndexOf('.'))
	$zone   = $Hostname.Substring($Hostname.IndexOf('.') + 1)

	Write-Host "==> verifying DNS zone $zone in $DnsZoneRg"
	az network dns zone show --name $zone --resource-group $DnsZoneRg --query 'name' -o tsv | Out-Null
	Assert-LastExit 'az network dns zone show'

	Write-Host "==> upserting CNAME $record.$zone -> $swaHost (TTL 300)"
	# set-record creates the record set if missing and replaces the alias if
	# it already exists, so this stays idempotent on re-runs.
	az network dns record-set cname set-record `
		--resource-group $DnsZoneRg `
		--zone-name $zone `
		--record-set-name $record `
		--cname $swaHost `
		--ttl 300 -o none
	Assert-LastExit 'az network dns record-set cname set-record'

	Write-Host "==> binding $Hostname on SWA $Name"
	$bound = az staticwebapp hostname list --name $Name --resource-group $ResourceGroup `
		--query "[?name=='$Hostname'] | length(@)" -o tsv
	Assert-LastExit 'az staticwebapp hostname list'
	if ($bound -ne '0') {
		Write-Host '  already bound — skipping'
	} else {
		az staticwebapp hostname set `
			--name $Name `
			--resource-group $ResourceGroup `
			--hostname $Hostname `
			--validation-method cname-delegation -o none
		Assert-LastExit 'az staticwebapp hostname set'
		Write-Host '  bound (Azure provisions the TLS cert in the background; first hit can be slow)'
	}
}

Write-Host ''
Write-Host 'DONE'
Write-Host "  resource group:  $ResourceGroup"
Write-Host "  static web app:  $Name"
Write-Host "  url:             https://$swaHost"
if ($Hostname) {
	Write-Host "  custom url:      https://$Hostname"
}
Write-Host ''
Write-Host 'next: push any commit to master — the workflow will pick up the secret'
Write-Host "and deploy. tail it with:  gh run watch --repo $Repo"
