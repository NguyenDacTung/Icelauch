Add-Type -AssemblyName System.Drawing

$src = "C:\Users\dactu\.gemini\antigravity\brain\16fcba20-10c8-4607-84c2-0485428da52f\.user_uploaded\media_1794977148115_a23fb5be.jpg"
$sourceImg = [System.Drawing.Image]::FromFile($src)
$w = $sourceImg.Width
$h = $sourceImg.Height
Write-Output "Source Dimensions: ${w}x${h}"

# Targets to update
$targets = @(
    "C:\Icelauch\build\icon.png",
    "C:\Icelauch\public\icon.png",
    "C:\Icelauch\icon.png",
    "C:\Icelauch\src\renderer\src\assets\icon.png"
)

# Convert to high-res PNG (512x512 standard master)
$bmp = New-Object System.Drawing.Bitmap(512, 512)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
$g.DrawImage($sourceImg, 0, 0, 512, 512)

foreach ($target in $targets) {
    $parent = Split-Path $target -Parent
    if (-not (Test-Path $parent)) {
        New-Item -ItemType Directory -Path $parent | Out-Null
    }
    $bmp.Save($target, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Output "Saved master icon to $target"
}

$g.Dispose()
$bmp.Dispose()
$sourceImg.Dispose()
Write-Output "Master icons updated successfully."
