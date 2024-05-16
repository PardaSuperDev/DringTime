<?PHP
header('Access-Control-Allow-Origin: https://worldtimeapi.org/');
echo file_get_contents("main.html");
?>