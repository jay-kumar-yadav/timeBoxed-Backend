@echo off
echo 🚀 Starting Time Boxed Auth Backend...
echo.

REM Check if .env file exists
if not exist .env (
    echo ⚠️  .env file not found!
    echo Creating .env file...
    (
        echo GMAIL_USER=your-email@gmail.com
        echo GMAIL_APP_PASSWORD=your-16-digit-app-password
        echo PORT=3000
    ) > .env
    echo ✅ Created .env file
    echo.
    echo ⚠️  Please edit .env file and add your Gmail credentials!
    echo    GMAIL_USER=your-email@gmail.com
    echo    GMAIL_APP_PASSWORD=your-app-password
    echo.
    pause
)

REM Check if node_modules exists
if not exist node_modules (
    echo 📦 Installing dependencies...
    call npm install
    echo.
)

REM Start the server
echo 🚀 Starting server...
call npm start
