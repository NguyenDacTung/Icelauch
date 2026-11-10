Add-Type -AssemblyName System.Drawing

# 1. Remove the default robot vector icon that overrides mipmaps
$robotPath = "C:\Icelauch\android\app\src\main\res\drawable-v24\ic_launcher_foreground.xml"
if (Test-Path $robotPath) {
    Remove-Item $robotPath -Force
    Write-Output "Removed robot vector icon: $robotPath"
}

# 2. Re-run generate-android-icons.ps1
& "C:\Icelauch\scripts\generate-android-icons.ps1"

# 3. Generate Android TV 16:9 Banner (320x180 and 640x360)
$src = "C:\Icelauch\build\icon.png"
$sourceImg = [System.Drawing.Image]::FromFile($src)

$bannerConfigs = @(
    @{ dir = "C:\Icelauch\android\app\src\main\res\drawable"; w = 320; h = 180; iconSize = 130 },
    @{ dir = "C:\Icelauch\android\app\src\main\res\drawable-xhdpi"; w = 640; h = 360; iconSize = 260 }
)

foreach ($b in $bannerConfigs) {
    if (-not (Test-Path $b.dir)) { 
        New-Item -ItemType Directory -Path $b.dir | Out-Null 
    }
    $bmp = New-Object System.Drawing.Bitmap($b.w, $b.h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    
    # Fill dark obsidian gradient / solid
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 11, 15, 25))
    $g.FillRectangle($bgBrush, 0, 0, $b.w, $b.h)
    $bgBrush.Dispose()

    # Draw centered icon
    $ox = [int](($b.w - $b.iconSize) / 2)
    $oy = [int](($b.h - $b.iconSize) / 2)
    $g.DrawImage($sourceImg, $ox, $oy, $b.iconSize, $b.iconSize)

    $outPath = Join-Path $b.dir "tv_banner.png"
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Output "Generated TV Banner: $outPath"
}

$sourceImg.Dispose()
Write-Output "Android TV Banner and Icon update completed successfully!"
