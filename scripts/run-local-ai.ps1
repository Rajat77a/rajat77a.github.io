$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
$env:AI_PROVIDER = 'ollama'
$env:OLLAMA_MODEL = 'qwen3:4b'
$env:OLLAMA_TIMEOUT_MS = '60000'
node scripts/serve-rag.mjs
