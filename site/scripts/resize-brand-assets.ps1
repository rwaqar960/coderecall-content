# Regenerates site/static/img/{logo,favicon}.png from the app's source icon.
# Windows-only helper (System.Drawing). Run from anywhere:
#   powershell -File site\scripts\resize-brand-assets.ps1

Add-Type -AssemblyName System.Drawing

$src = Join-Path $PSScriptRoot "..\..\..\coderecall-app\assets\branding\icon_full.png"
$out = Join-Path $PSScriptRoot "..\static\img"
New-Item -ItemType Directory -Force $out | Out-Null

function Resize-Png([string]$srcPath, [string]$dstPath, [int]$size) {
    $original = [System.Drawing.Image]::FromFile($srcPath)
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($original, 0, 0, $size, $size)
    $bmp.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose(); $original.Dispose()
}

Resize-Png $src (Join-Path $out "logo.png") 512
Resize-Png $src (Join-Path $out "favicon.png") 32

Write-Output "Wrote logo.png (512x512) and favicon.png (32x32) to $out"
