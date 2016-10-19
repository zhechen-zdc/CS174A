Zhe Chen
CS174A

I've marked all the joints and relevant areas with CURRENT_BASIS_IS_WORTH_SHOWING, so you can just hit P to look at each axis of rotation for quick reference.  You can lock the bee in place so it doesn't move by commenting out lines 309 + 310 while uncommenting 313.  This will fix the Bee in place while the animation plays so you can look at the legs/wings without having to adjust the camera.

The tree length is built to be dynamic so you can increase the length of segments or increase the sway angle just by changin the parameters.   

The legs and wings are drawn using a modified version of the snowman code where using a simple for loop we haver the same code draw legs/wings on each side of the body using only the -1/+1 values as a switch to change all the angles.   