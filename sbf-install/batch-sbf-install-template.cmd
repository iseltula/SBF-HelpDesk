cd "sbfFrameworkDir"
call npm link

cd "sbfApiDir"
call npm install
call npm link sbfNodePackageName
