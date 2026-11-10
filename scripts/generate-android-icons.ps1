Add-Type -AssemblyName System.Drawing

$src = "C:\Icelauch\build\icon.png"
$sourceImg = [System.Drawing.Image]::FromFile($src)
Write-Output "Source size: $($sourceImg.Width)x$($sourceImg.Height)"

$densities = @(
    @{ folder = "mipmap-mdpi"; size = 48; fgSize = 108 },
    @{ folder = "mipmap-hdpi"; size = 72; fgSize = 162 },
    @{ folder = "mipmap-xhdpi"; size = 96; fgSize = 216 },
    @{ folder = "mipmap-xxhdpi"; size = 144; fgSize = 324 },
    @{ folder = "mipmap-xxxhdpi"; size = 192; fgSize = 432 }
)

foreach ($d in $densities) {
    $dir = Join-Path "C:\Icelauch\android\app\src\main\res" $d.folder
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir | Out-Null
    }

    # 1. ic_launcher.png (legacy square/rounded)
    $bmp = New-Object System.Drawing.Bitmap($d.size, $d.size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.DrawImage($sourceImg, 0, 0, $d.size, $d.size)
    $bmp.Save((Join-Path $dir "ic_launcher.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Save((Join-Path $dir "ic_launcher_round.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()

    # 2. ic_launcher_foreground.png (for adaptive icon: centered with padding)
    # Foreground is 108dp, icon within inner 72dp -> inner ratio = 72/108 = ~66%
    $fgBmp = New-Object System.Drawing.Bitmap($d.fgSize, $d.fgSize)
    $fgG = [System.Drawing.Graphics]::FromImage($fgBmp)
    $fgG.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $fgG.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    
    $iconSize = [int]($d.fgSize * 0.72)
    $offset = [int](($d.fgSize - $iconSize) / 2)
    $fgG.DrawImage($sourceImg, $offset, $offset, $iconSize, $iconSize)
    $fgBmp.Save((Join-Path $dir "ic_launcher_foreground.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $fgG.Dispose()
    $fgBmp.Dispose()

    Write-Output "Generated icons for $($d.folder) [Size: $($d.size), FG: $($d.fgSize)]"
}

$sourceImg.Dispose()
Write-Output "All icons successfully generated!"

