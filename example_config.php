<?
// Rename this file to config.php after editing the fields bellow
$garbage = "some_garbage_string_to_be_used_for_redneck_encryption";

// How to generate the hashed filename form the URL.
function get_filename($url) {
  // Make sure path/to/cache/dir exists
  return "path/to/cache/dir/" . md5('something_to_prepend_' . $url . '_sometihng_to_append') . ".extension";
}
?>