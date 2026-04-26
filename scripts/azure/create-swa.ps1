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

.EXAMPLE
  .\scripts\azure\create-swa.ps1 -Subscription <id-or-name>

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
	[string] $Repo = 'jurijsk/cursive'
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

Write-Host ''
Write-Host 'DONE'
Write-Host "  resource group:  $ResourceGroup"
Write-Host "  static web app:  $Name"
Write-Host "  url:             https://$swaHost"
Write-Host ''
Write-Host 'next: push any commit to master — the workflow will pick up the secret'
Write-Host "and deploy. tail it with:  gh run watch --repo $Repo"
