<?PHP
header('Access-Control-Allow-Origin: https://worldtimeapi.org/, https://api.dring-time.fr');
echo file_get_contents("main.html");
?>