@echo off
chcp 65001 >nul
title C 盘清理工具
echo ============================================
echo         C 盘清理工具
echo ============================================
echo.

:: 检查管理员权限
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] 请右键以管理员身份运行此脚本
    pause
    exit /b
)

echo [1/8] 清理临时文件...
del /f /s /q "%TEMP%\*" 2>nul
del /f /s /q "C:\Windows\Temp\*" 2>nul
del /f /s /q "%USERPROFILE%\AppData\Local\Temp\*" 2>nul
echo 完成.

echo [2/8] 清理回收站...
rd /s /q C:\$Recycle.Bin 2>nul
for %%d in (C D E F G H) do (
    rd /s /q %%d:\$Recycle.Bin 2>nul
)
echo 完成.

echo [3/8] 清理 Windows 更新缓存...
net stop wuauserv 2>nul
rd /s /q "C:\Windows\SoftwareDistribution\Download" 2>nul
net start wuauserv 2>nul
echo 完成.

echo [4/8] 清理 Windows.old（旧系统备份）...
if exist "C:\Windows.old" (
    echo 发现 Windows.old，正在清理（耗时较长）...
    takeown /f "C:\Windows.old" /r /d y >nul 2>&1
    icacls "C:\Windows.old" /grant administrators:F /t >nul 2>&1
    rd /s /q "C:\Windows.old" 2>nul
)
echo 完成.

echo [5/8] 清理 Delivery Optimization 缓存...
rd /s /q "C:\Windows\ServiceProfiles\NetworkService\AppData\Local\Microsoft\Windows\DeliveryOptimization\Cache" 2>nul
echo 完成.

echo [6/8] 清理浏览器缓存...
:: Chrome
rd /s /q "%USERPROFILE%\AppData\Local\Google\Chrome\User Data\Default\Cache" 2>nul
rd /s /q "%USERPROFILE%\AppData\Local\Google\Chrome\User Data\Default\Code Cache" 2>nul
:: Edge
rd /s /q "%USERPROFILE%\AppData\Local\Microsoft\Edge\User Data\Default\Cache" 2>nul
rd /s /q "%USERPROFILE%\AppData\Local\Microsoft\Edge\User Data\Default\Code Cache" 2>nul
echo 完成.

echo [7/8] 清理缩略图缓存...
del /f /s /q "%USERPROFILE%\AppData\Local\Microsoft\Windows\Explorer\thumbcache_*.db" 2>nul
echo 完成.

echo [8/8] 运行系统磁盘清理...
cleanmgr /sagerun:1 2>nul || (
    echo 首次运行，请先配置...
    cleanmgr /sageset:1
    cleanmgr /sagerun:1
)
echo 完成.

echo.
echo ============================================
echo 清理完成！
echo.

:: 显示 C 盘剩余空间
for /f "tokens=3" %%a in ('dir C:\ ^| findstr "可用"') do set free=%%a
echo C 盘剩余空间: %free% 字节

echo.
echo 建议：还可以手动检查以下内容：
echo  - 大文件扫描：在 C: 根目录搜索 size:gigantic
echo  - 微信/QQ 文件：%USERPROFILE%\Documents\WeChat Files
echo  - 关闭休眠：powercfg -h off（可释放数GB）
echo  - 移动虚拟内存到其他盘
echo.
pause
