xcopy /Y src\index_pwa.html www
xcopy /Y src\favicon.ico www
xcopy /Y src\assets\icon\* www
del www\index.html
move www\index_pwa.html www\index.html
git -C ..\ebudget-pwa-dist pull
attrib -h ..\ebudget-pwa-dist\.git
move ..\ebudget-pwa-dist\.git tmp
del /S /Q /Y /F ..\ebudget-pwa-dist\*
rd /S /Q ..\ebudget-pwa-dist\assets
rd /S /Q ..\ebudget-pwa-dist\build
move tmp\.git ..\ebudget-pwa-dist
attrib +h ..\ebudget-pwa-dist\.git
xcopy /E /Y www\* ..\ebudget-pwa-dist\
git -C ..\ebudget-pwa-dist add .
git -C ..\ebudget-pwa-dist commit -a -m "Automatic Deploy"
git -C ..\ebudget-pwa-dist push
ping -n 10 127.0.0.1 > nul
node scripts\purge-keycdn.js