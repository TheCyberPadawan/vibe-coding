@echo off
rem Compile Aware en un executable unique : dist\Aware.exe
rem Les dependances sont figees avec leur empreinte (requirements-build.txt) : pip refuse tout paquet modifie.
cd /d "%~dp0"
python -m pip install --user --quiet --require-hashes -r requirements-build.txt || exit /b 1
python make_icon.py || exit /b 1
python -m PyInstaller --noconfirm --clean --windowed --onefile --name Aware ^
  --icon aware\aware.ico --add-data "aware\ui;ui" --paths aware aware\app.py || exit /b 1
rem Empreinte de l'executable, a publier avec lui pour que chacun puisse verifier son integrite
certutil -hashfile dist\Aware.exe SHA256
