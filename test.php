<?
function my_urlencode($string) {
  return str_replace(' ', '%20', $string);
}

$url = urldecode($_GET["url"]);
echo $_GET["url"];
echo $url;
echo my_urlencode($url);
		
$file = file_get_contents(my_urlencode($url));

if(@imagecreatefromstring($file)) {
  echo "yes";
} else {
  echo "no";
}
?>