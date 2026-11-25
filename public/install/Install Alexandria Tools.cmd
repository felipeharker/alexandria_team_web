@echo off
rem Alexandria: installs or repairs Alexandria Rhino Tools and Alexandria Grasshopper Tools on this PC,
rem and has Rhino keep them up to date. Works from the installer folder, from the top of alexandria_packages,
rem and on its own, downloaded from the hub: with no installer beside it, it runs the one in the office
rem shared folder. Keep that path in step with $SHARED in install.ps1 and SHARED in tools/release.py.
set "SCRIPT=%~dp0install.ps1"
if not exist "%SCRIPT%" set "SCRIPT=%~dp0installer\install.ps1"
if not exist "%SCRIPT%" set "SCRIPT=\\aria-design\Aria Projects\ARIA LLC\12_Aria_Architectural Design Standards Files\alexandria_packages\installer\install.ps1"
if exist "%SCRIPT%" goto run
echo.
echo Alexandria: the office drive is out of reach, so there is nothing to install from.
echo Connect to the office network or the VPN and run this again,
echo or download the zip from the Alexandria hub, unzip it and run this from that folder.
echo.
pause
exit /b 1
:run
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT%" %*
