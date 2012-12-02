# Introducation

Exploration of pixalized koalas*.

(*may include animals other than koalas)

Made with love by [Vadim Ogievetsky](http://vadim.ogievetsky.com) for [Annie Albagli](http://anniealbagli.com)

Powered by [Mike Bostock](http://bost.ocks.org/mike/)'s [D3](http://d3js.org/)


# Usage

## Custom images

Supported URLs are:

1. DOMAIN
  The just the page domain / loads one of the default files

2. DOMAIN?BA5E64==
  Where BA5E64== is a UTF-8 base64 encoded string of one of the following things:
 
  1. An image URL
  
     Example: `http://i.imgur.com/cz1Jb.jpg`

     Use that URL image instead of the default one.

  2. A JSON string representing an array of URLs
  
     Example: `["http://i.imgur.com/cz1Jb.jpg","http://i.imgur.com/Q5IqH.jpg"]`

     Pick one of the images at random and use that instead of the default one.

  3. A JSON string representing an object with the keys 'images', 'background' and 'hideNote'
  
     Example: `{"background":"#000","images":["http://i.imgur.com/cz1Jb.jpg","http://i.imgur.com/Q5IqH.jpg"]}`

     images (required): Pick one of the images at random and use that instead of the default one.
     
     background (optional): Use the value of background as the page background.
     
     hideNote (optional): Hide the mention on the bottom.

3. DOMAIN?image_url

  Where image URL is an actual image URL this is for backwards compatibility.
  
  Example: `http://i.imgur.com/cz1Jb.jpg`
  
  This is how putting in a custom image used to work.

4. DOMAIN#a_string
  
  This will redirect to DOMAIN?b64(a_string)
  
  This should be used to construct things as above.

Note: where DOMAIN is usually http://koalastothemax.com
