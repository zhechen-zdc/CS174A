Zhe Chen
CS174A

Hierarchical objects are used on almost everything, the pillars are drawn using a formula to rotate about the center of the temple.  The moon rotates to always face the earth while rotating around the Earth, and the earth rotates.

The starting animation uses lookAt, I calculated the position of the camera as a spiral starting from my beginning point to the end point in front of the temple.  The lookAt moves moves around based on a simple formula to get a good look at the entire scene.
Unfortuantely I didn't have time to finish implementing a function I was writing where I take an array of lookAt points and then interporlate between them to get a smooth tracking so I can do vista points lookats while the camera runs along its track.

The polygonal object I designed is a squarecup, you can see at the bottom of Custom_Shapes.  The normals are calculated to be point towards the upper center of the cup.  The texture mapping is designed so that the edges uses the edge of the texture while the center uses the center.
You can look at both the Phong shaded custom object with flat shading and discountinous edges and the example texture wrapping at the very top of the temple.  I placed one cup at each pillar.

The FPS display I wrote it directly into the Render function because I didn't read the second part and there's no time to move it now.  

Cool stuff:
-I'm using the fake bump mapping shader you provided, its really useful.
-The earth has a transparent cloud layer.
-I'm using a skybox with a rotating star map overlaid on top of it.  Both rotate, its pretty cool.  The star map uses my upsidedown squarecup to simulate a more dome like appearance.

Custom Textures/Objects
Some of the stuff I newly made in Maya, some are old objects I found from online.
Textures are are downloadsed from online sources.