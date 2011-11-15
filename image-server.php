<?
require('config.php');

function my_urlencode($string) {
  return str_replace(' ', '%20', $string);
}

try {
	$ok = true;

	// Check if the URL is set
	if($ok && isset($_GET["url"])) {
	  // Get the URL and decode to remove any %20, etc
		$url = urldecode($_GET["url"]);

		// Hash the url
		$filename = get_filename($url);
	} else {
	  // No URL set so error
		header('HTTP/1.0 400 Bad Request');
		echo "No URL was specified";
		$ok = false;
	}

  if($ok) {
		if(file_exists($filename)) {
		  // Send cached file

		  $file = file_get_contents($filename, false, NULL, strlen($garbage));
		} else {
		  // Load the image and save the file if valid image if found

		  // Get the contents of the URL
  		$file = file_get_contents(my_urlencode($url));

  		// Check if it is an image
  		$img = @imagecreatefromstring($file);
  		if($img) {
  		  $max = 800;
  		  $w = imagesx($img);
  		  $h = imagesy($img);
  		  if ($w > $max || $h > $max) {
  		    // Resize the image if needed
  		    $scale = min($max / $w, $max / $h);
  		    $new_w = intval($scale * $w);
  		    $new_h = intval($scale * $h);
          $new_img = imagecreatetruecolor($new_w, $new_h);
          imagecopyresampled($new_img, $img, 0, 0, 0, 0, $new_w, $new_h, $w, $h);
          imagedestroy($img);
          imagejpeg($new_img, $filename);
          $file = file_get_contents($filename);
        }

        file_put_contents($filename, $garbage);
        file_put_contents($filename, $file, FILE_APPEND);
  		} else {
  		  // The requested file is not an image
  			header('HTTP/1.0 400 Bad Request');
  			print "Invalid image specified";
  			$ok = false;
  		}
		}
	}

  if($ok) {
    header('Content-Type: image');
		print($file);
  }

} catch (Exception $e) {
	header('HTTP/1.0 500 Internal Server Error');
	echo "Internal Server Error";
	$ok = false;
}
?>