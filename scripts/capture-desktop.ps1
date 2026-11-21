param(
    [string]$OutputFile = "C:\Users\dactu\.gemini\antigravity\brain\16fcba20-10c8-4607-84c2-0485428da52f\screenshots\desktop.png",
    [string]$TargetProcess = "Icelauch"
)

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$dir = Split-Path $OutputFile -Parent
if (!(Test-Path $dir)) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
}

$proc = Get-Process -Name $TargetProcess -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1

if ($proc) {
    # If the process is found, we capture its window bounds
    Add-Type @"
    using System;
    using System.Runtime.InteropServices;
    public class Win32 {
        [DllImport("user32.dll")]
        public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
        [StructLayout(LayoutKind.Sequential)]
        public struct RECT {
            public int Left;
            public int Top;
            public int Right;
            public int Bottom;
        }
    }
"@
    $rect = New-Object Win32+RECT
    [Win32]::GetWindowRect($proc.MainWindowHandle, [ref]$rect) | Out-Null
    $width = $rect.Right - $rect.Left
    $height = $rect.Bottom - $rect.Top

    if ($width -gt 0 -and $height -gt 0) {
        $bitmap = New-Object System.Drawing.Bitmap $width, $height
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        $graphics.CopyFromScreen($rect.Left, $rect.Top, 0, 0, (New-Object System.Drawing.Size $width, $height))
        $bitmap.Save($OutputFile, [System.Drawing.Imaging.ImageFormat]::Png)
        $graphics.Dispose()
        $bitmap.Dispose()
        Write-Host "Captured window of $TargetProcess to: $OutputFile"
        exit 0
    }
}

# Fallback to full primary screen
$screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$bitmap = New-Object System.Drawing.Bitmap $screen.Width, $screen.Height
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.CopyFromScreen($screen.Location, [System.Drawing.Point]::Empty, $screen.Size)
$bitmap.Save($OutputFile, [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bitmap.Dispose()
Write-Host "Captured full screen to: $OutputFile"
