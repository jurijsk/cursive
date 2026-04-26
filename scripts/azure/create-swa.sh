#!/usr/bin/env bash
# Provision the Azure Static Web App that hosts cursive.
#
# What this does:
#   1. Sets the active Azure subscription.
#   2. Creates (or reuses) a resource group.
#   3. Creates the Static Web App without GitHub source — that avoids the
#      auto-generated workflow file Azure would otherwise drop into the repo
#      and conflict with the one already at .github/workflows/.
#   4. Pulls the deploy token off the new SWA.
#   5. Stores the token as the AZURE_STATIC_WEB_APPS_API_TOKEN secret on the
#      GitHub repo so the committed workflow can deploy.
#   6. Prints the public URL.
#
# Re-running this is safe — `az group create` and `az staticwebapp create`
# are no-ops when the resource already exists with the same shape.
#
# Prereqs (one-time, you'll be prompted in a browser):
#     az login
#     gh auth login
#
# Usage:
#     scripts/azure/create-swa.sh --subscription <id-or-name>
#
# Optional flags (with defaults):
#     --resource-group cursive-rg
#     --name           cursive
#     --location       westeurope
#     --repo           jurijsk/cursive
#     --hostname       <fqdn>          e.g. cursive.textjoint.com — when set,
#                                      adds a CNAME in the parent zone and
#                                      binds the hostname on the SWA.
#     --dns-zone-rg    <rg>            resource group of the DNS zone (required
#                                      with --hostname). Zone name is derived
#                                      from the hostname (everything after the
#                                      first dot).

set -euo pipefail

RESOURCE_GROUP="cursive-rg"
NAME="cursive"
LOCATION="westeurope"
REPO="jurijsk/cursive"
SUBSCRIPTION=""
HOSTNAME_FQDN=""
DNS_ZONE_RG=""

while [[ $# -gt 0 ]]; do
	case "$1" in
		--subscription)   SUBSCRIPTION="$2"; shift 2 ;;
		--resource-group) RESOURCE_GROUP="$2"; shift 2 ;;
		--name)           NAME="$2"; shift 2 ;;
		--location)       LOCATION="$2"; shift 2 ;;
		--repo)           REPO="$2"; shift 2 ;;
		--hostname)       HOSTNAME_FQDN="$2"; shift 2 ;;
		--dns-zone-rg)    DNS_ZONE_RG="$2"; shift 2 ;;
		-h|--help)
			sed -n '2,38p' "$0"
			exit 0
			;;
		*)
			echo "unknown arg: $1" >&2
			exit 1
			;;
	esac
done

if [[ -z "$SUBSCRIPTION" ]]; then
	echo "ERROR: --subscription is required" >&2
	echo "Run with -h for usage." >&2
	exit 1
fi

# Azure SWA Free tier is only hosted in a handful of regions. Map anything
# unsupported to westeurope so the create call doesn't fail. The bulk of
# requests still hit the resource group's --location for everything else.
SWA_LOCATION="$LOCATION"
case "$LOCATION" in
	westus2|centralus|eastus2|westeurope|eastasia) ;;
	*)
		echo "  note: SWA Free tier doesn't host in $LOCATION; using westeurope for the SWA itself"
		SWA_LOCATION="westeurope"
		;;
esac

echo "==> az account set --subscription $SUBSCRIPTION"
az account set --subscription "$SUBSCRIPTION"
az account show --query '{name:name, id:id, tenant:tenantId}' -o table

echo "==> az group create $RESOURCE_GROUP ($LOCATION)"
az group create \
	--name "$RESOURCE_GROUP" \
	--location "$LOCATION" \
	-o table

echo "==> az staticwebapp create $NAME ($SWA_LOCATION, Free tier)"
az staticwebapp create \
	--name "$NAME" \
	--resource-group "$RESOURCE_GROUP" \
	--location "$SWA_LOCATION" \
	--sku Free \
	-o table

echo "==> fetching deploy token"
TOKEN=$(az staticwebapp secrets list \
	--name "$NAME" \
	--resource-group "$RESOURCE_GROUP" \
	--query "properties.apiKey" -o tsv)

if [[ -z "$TOKEN" ]]; then
	echo "ERROR: deploy token came back empty" >&2
	exit 1
fi

echo "==> gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN on $REPO"
# Stdin-piped to keep the token off the command line / shell history.
printf '%s' "$TOKEN" | gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN --repo "$REPO"

HOST=$(az staticwebapp show \
	--name "$NAME" \
	--resource-group "$RESOURCE_GROUP" \
	--query "defaultHostname" -o tsv)

# --- Optional: custom hostname binding --------------------------------------
# When --hostname is given, idempotently create a CNAME in the parent zone
# pointing at the SWA's default hostname, then bind the hostname on the SWA
# using cname-delegation validation. Only subdomains are supported here —
# apex domains need TXT-token validation (different command shape).
if [[ -n "$HOSTNAME_FQDN" ]]; then
	if [[ -z "$DNS_ZONE_RG" ]]; then
		echo "ERROR: --hostname requires --dns-zone-rg" >&2
		exit 1
	fi
	# "cursive.textjoint.com" needs at least two dots to have both a record
	# label and a parent zone. One-dot FQDNs are apex and not handled here.
	if [[ "$HOSTNAME_FQDN" != *.*.* ]]; then
		echo "ERROR: $HOSTNAME_FQDN looks like an apex domain; only subdomains are supported" >&2
		exit 1
	fi
	RECORD="${HOSTNAME_FQDN%%.*}"
	ZONE="${HOSTNAME_FQDN#*.}"

	echo "==> verifying DNS zone $ZONE in $DNS_ZONE_RG"
	az network dns zone show --name "$ZONE" --resource-group "$DNS_ZONE_RG" --query "name" -o tsv >/dev/null

	echo "==> upserting CNAME $RECORD.$ZONE -> $HOST (TTL 300)"
	# set-record creates the record set if missing and replaces the alias if
	# it already exists, so this stays idempotent on re-runs.
	az network dns record-set cname set-record \
		--resource-group "$DNS_ZONE_RG" \
		--zone-name "$ZONE" \
		--record-set-name "$RECORD" \
		--cname "$HOST" \
		--ttl 300 -o none

	echo "==> binding $HOSTNAME_FQDN on SWA $NAME"
	BOUND=$(az staticwebapp hostname list --name "$NAME" --resource-group "$RESOURCE_GROUP" \
		--query "[?name=='$HOSTNAME_FQDN'] | length(@)" -o tsv)
	if [[ "$BOUND" != "0" ]]; then
		echo "  already bound — skipping"
	else
		az staticwebapp hostname set \
			--name "$NAME" \
			--resource-group "$RESOURCE_GROUP" \
			--hostname "$HOSTNAME_FQDN" \
			--validation-method cname-delegation -o none
		echo "  bound (Azure provisions the TLS cert in the background; first hit can be slow)"
	fi
fi

echo
echo "✓ done"
echo "  resource group:  $RESOURCE_GROUP"
echo "  static web app:  $NAME"
echo "  url:             https://$HOST"
if [[ -n "$HOSTNAME_FQDN" ]]; then
	echo "  custom url:      https://$HOSTNAME_FQDN"
fi
echo
echo "next: push any commit to master — the workflow will pick up the secret"
echo "and deploy. tail it with:  gh run watch --repo $REPO"
