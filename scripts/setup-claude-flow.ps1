# =============================================================================
#  PeopleHub - claude-flow runtime setup
#  Run this yourself (Claude Code's safety layer won't let the agent do it).
#  How to run:  right-click -> "Run with PowerShell"
#         or:   powershell -ExecutionPolicy Bypass -File .\scripts\setup-claude-flow.ps1
#  Then RESTART Claude Code so the claude-flow MCP tools load.
# =============================================================================

Write-Host "`n[1/3] Installing claude-flow@3.10.37 (global, matches your installed skills)..." -ForegroundColor Cyan
npm install -g claude-flow@3.10.37

Write-Host "`n[2/3] Registering the claude-flow MCP server with Claude Code (user scope)..." -ForegroundColor Cyan
claude mcp add claude-flow -s user -- npx claude-flow@3.10.37 mcp start

Write-Host "`n[3/3] Verifying MCP registration..." -ForegroundColor Cyan
claude mcp list

Write-Host "`nDone. Now RESTART Claude Code to load the claude-flow MCP tools." -ForegroundColor Green
Write-Host "Optional (only in a throwaway repo, NOT people-management):" -ForegroundColor DarkGray
Write-Host "  npx claude-flow@3.10.37 init --force   # adds auto-running hooks + slash-commands" -ForegroundColor DarkGray
