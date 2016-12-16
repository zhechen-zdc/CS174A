// CS 174a Project 3 Ray Tracer Skeleton

function Ball( )
{                                 // *** Notice these data members. Upon construction, a Ball first fills them in with arguments:
  var members = [ "position", "size", "color", "k_a", "k_d", "k_s", "n", "k_r", "k_refract", "refract_index" ];
  for( i in arguments )    this[ members[ i ] ] = arguments[ i ];
  this.construct();
}

Ball.prototype.construct = function()
{
  //use the arguments from position and size to set the model transform of the spheres
  this.model_transform = mat4();
  this.model_transform = mult(this.model_transform, translation(this.position[0], this.position[1], this.position[2])); 
  this.model_transform = mult(this.model_transform, scale(this.size[0], this.size[1], this.size[2]));
 
  // precalculate the inverse transform for easier ray intersection calculations
  this.inverse_transform = inverse(this.model_transform);

  // For some reason after implementing refraction javascript had a memory leak.  I think I was instantiantly too many local variable inside the Balls and javascript wasn't cleanign them up.  
  // Creating them as prototype variables solved the memory issue.
  this.inverse_ray = {};
  this.vec_S;
  this.vec_c;
  this.S_dot_c;
  this.abs_S_squared;
  this.abs_c_squared;
  this.discriminant;
  this.t_final;
  this.t1;
  this.t2;
  this.tmin;
  this.tmax;
  this.negative_B_over_A;
  this.inside = false;
}

Ball.prototype.intersect = function( ray, existing_intersection, minimum_dist )
{
  //calculate the inverse transform of the ray using the inverse_transform from the ball
  this.inverse_ray = {
    origin : mult_vec(this.inverse_transform, ray.origin),
    dir:  mult_vec(this.inverse_transform, ray.dir)
  }
 
  this.vec_S = this.inverse_ray.origin.slice(0, 3);
  this.vec_c = this.inverse_ray.dir.slice(0, 3);
  
  // calculate the discriminant and commonly used dot products
  this.S_dot_c = dot(this.vec_S, this.vec_c);
  this.abs_S_squared = dot(this.vec_S, this.vec_S);
  this.abs_c_squared = dot(this.vec_c, this.vec_c);
 
  this.discriminant = this.S_dot_c * this.S_dot_c - this.abs_c_squared * (this.abs_S_squared - 1);

  // no solution, return old intersection
  if (this.discriminant < 0)
    return existing_intersection;

  this.negative_B_over_A = -1 * (this.S_dot_c/this.abs_c_squared); 
  this.inside = false;

  // set either 1 or 2 solutions
  if (this.discriminant == 0)
    this.t1 = this.negative_B_over_A;
  else {
    this.t1 = this.negative_B_over_A + Math.sqrt(this.discriminant)/this.abs_c_squared;
    this.t2 = this.negative_B_over_A - Math.sqrt(this.discriminant)/this.abs_c_squared;
  }

  // sort the solutions by min and max
  this.tmin = Math.min(this.t1, this.t2);
  this.tmax = Math.max(this.t1, this.t2);

  if (this.tmin < minimum_dist && this.tmax < minimum_dist){
    // case where both intersections are behind the viewing plane, return existing intersection
    return existing_intersection;
  }

  if (this.tmin > minimum_dist)
    // case where ray intersects the outer sphere from our side
    this.t_final = this.tmin;
  else if (this.tmin < minimum_dist && this.tmax > minimum_dist){
    // case where we are inside the sphere, flip the normal 
    this.inside = true;
    this.t_final = this.tmax;
  }

  // if the new intersection insn't actually closer, return existing intersection
  if (this.t_final > existing_intersection.t){
    return existing_intersection;
  }

  // update the existing_intersection object with the new updated intersection data
   existing_intersection.ball = this;
   existing_intersection.t = this.t_final;
   var P = add(this.inverse_ray.origin, scale_vec(this.t_final, this.inverse_ray.dir));
   P[3] = 0;  // Since the origin of the sphere is 0,0,0, we can treat this as a vector from the origin position by setting the 4th element as 0

    //inverse transpose multiplied by P to get the normal of the original ray hitting the transformed sphere, slice off the 4th argument before normalizing the vector
   existing_intersection.normal = normalize(mult_vec(transpose(this.inverse_transform), P).slice(0, 3)).concat(0);

   // if we're inside a sphere, the normal needs to be flipped
  if (this.inside)
   existing_intersection.normal = scale_vec(-1, existing_intersection.normal);
    
  
  return existing_intersection;
}

// function to print easily readable 4x4 matrices
var printTransform = function(m){
  console.log("Transformation Matrix:");
  for (i = 0; i < 4; i++){
    console.log(m[i][0]+"\t",m[i][1]+"\t",m[i][2]+"\t",m[i][3]+"\t");
  }
}

var mult_3_coeffs = function( a, b ) { return [ a[0]*b[0], a[1]*b[1], a[2]*b[2] ]; };       // Convenient way to combine two color vectors

var background_functions = {                // These convert a ray into a color even when no balls were struck by the ray.
waves: function( ray, distance )
{
  return Color( .5 * Math.pow( Math.sin( 2 * ray.dir[0] ), 4 ) + Math.abs( .5 * Math.cos( 8 * ray.dir[0] + Math.sin( 10 * ray.dir[1] ) + Math.sin( 10 * ray.dir[2] ) ) ),
                .5 * Math.pow( Math.sin( 2 * ray.dir[1] ), 4 ) + Math.abs( .5 * Math.cos( 8 * ray.dir[1] + Math.sin( 10 * ray.dir[0] ) + Math.sin( 10 * ray.dir[2] ) ) ),
                .5 * Math.pow( Math.sin( 2 * ray.dir[2] ), 4 ) + Math.abs( .5 * Math.cos( 8 * ray.dir[2] + Math.sin( 10 * ray.dir[1] ) + Math.sin( 10 * ray.dir[0] ) ) ), 1 );
},
lasers: function( ray, distance ) 
{
  var u = Math.acos( ray.dir[0] ), v = Math.atan2( ray.dir[1], ray.dir[2] );
  return Color( 1 + .5 * Math.cos( Math.floor( 20 * u ) ), 1 + .5 * Math.cos( Math.floor( 20 * v ) ), 1 + .5 * Math.cos( Math.floor( 8 * u ) ), 1 );
},
mixture:       function( ray, distance ) { return mult_3_coeffs( background_functions["waves"]( ray, distance ), background_functions["lasers"]( ray, distance ) ).concat(1); },
ray_direction: function( ray, distance ) { return Color( Math.abs( ray.dir[ 0 ] ), Math.abs( ray.dir[ 1 ] ), Math.abs( ray.dir[ 2 ] ), 1 );  },
color:         function( ray, distance ) { return background_color;  }
};
var curr_background_function = "color";
var background_color = vec4( 0, 0, 0, 1 );

// *******************************************************
// Raytracer class - gets registered to the window by the Animation object that owns it
function Raytracer( parent )  
{
  //var defaults = { width: 32, height: 32, near: 1, left: -1, right: 1, bottom: -1, top: 1, scanline: 0, visible: true, anim: parent, ambient: vec3( .1, .1, .1 ) };
  var defaults = { width: 4, height: 4, near: 1, left: -1, right: 1, bottom: -1, top: 1, scanline: 0, visible: true, anim: parent, ambient: vec3( .1, .1, .1 ) };
  for( i in defaults )  this[ i ] = defaults[ i ];
  
  this.m_square = new N_Polygon( 4 );                   // For texturing with and showing the ray traced result
  this.m_sphere = new Subdivision_Sphere( 4, true );    // For drawing with ray tracing turned off
  this.count = 0;
  
  this.balls = [];    // Array for all the balls
    
  initTexture( "procedural", true, true );      // Our texture for drawing the ray trace    
  textures["procedural"].image.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"   // Blank gif file
  
  this.scratchpad = document.createElement('canvas');   // A hidden canvas for assembling the texture
  this.scratchpad.width  = this.width;
  this.scratchpad.height = this.height;
  
  this.scratchpad_context = this.scratchpad.getContext('2d');
  this.imageData          = new ImageData( this.width, this.height );     // Will hold ray traced pixels waiting to be stored in the texture
  
  this.make_menu();

  this.white = vec3(1, 1, 1);
}

Raytracer.prototype.toggle_visible = function() { this.visible = !this.visible; document.getElementById("progress").style = "display:inline-block;" };

Raytracer.prototype.make_menu = function()      // The buttons
{
  document.getElementById( "raytracer_menu" ).innerHTML = "<span style='white-space: nowrap'><button id='toggle_raytracing' class='dropbtn' style='background-color: #AF4C50'>Toggle Ray Tracing</button> \
                                                           <button onclick='document.getElementById(\"myDropdown2\").classList.toggle(\"show\"); return false;' class='dropbtn' style='background-color: #8A8A4C'>Select Background Effect</button><div id='myDropdown2' class='dropdown-content'>  </div>\
                                                           <button onclick='document.getElementById(\"myDropdown\").classList.toggle(\"show\"); return false;' class='dropbtn' style='background-color: #4C50AF'>Select Test Case</button><div id='myDropdown' class='dropdown-content'>  </div> \
                                                           <button id='submit_scene' class='dropbtn'>Submit Scene Textbox</button> \
                                                           <div id='progress' style = 'display:none;' ></div></span>";
  for( i in test_cases )
  {
    var a = document.createElement( "a" );
    a.addEventListener("click", ( function( i, self ) { return function() { load_case( i ); self.parseFile(); }; } )( i, this ), false);
    a.innerHTML = i;
    document.getElementById( "myDropdown" ).appendChild( a );
  }
  for( j in background_functions )
  {
    var a = document.createElement( "a" );
    a.addEventListener("click", ( function( j ) { return function() { curr_background_function = j; } } )( j ), false);
    a.innerHTML = j;
    document.getElementById( "myDropdown2" ).appendChild( a );
  }
  
  document.getElementById( "input_scene" ).addEventListener( "keydown", function(event) { event.cancelBubble = true; }, false );
  
  window.addEventListener( "click", function(event) {  if (!event.target.matches('.dropbtn')) {    
  document.getElementById( "myDropdown"  ).classList.remove("show");
  document.getElementById( "myDropdown2" ).classList.remove("show"); } }, false );

  document.getElementById( "toggle_raytracing" ).addEventListener("click", this.toggle_visible.bind( this ), false);
  document.getElementById( "submit_scene" ).addEventListener("click", this.parseFile.bind( this ), false);
}

Raytracer.prototype.getDir = function( ix, iy ) {
 
  // calculates the width and height of the view plane based on the given right, left, top and bottom
  var g_width = this.right - this.left;
  var g_height = this.top - this.bottom;

  var alpha = ix/(this.width);
  var beta = iy/(this.height);

  // interpolate over x and y
  var x = parseFloat(this.left) + alpha*g_width;
  var y = parseFloat(this.bottom) + beta*g_height;

  return vec4( x, y, -this.near, 0 ); 
}
  
Raytracer.prototype.trace = function( ray, color_remaining, is_shadow_test, is_rf)
{

  if( length(color_remaining) < .3)    return Color( 0, 0, 0, 1 );  // Is there any remaining potential for brightening this pixel even more?

  // default closest_intersection boject
  var closest_intersection = { 
    ball: null,
    t: Number.POSITIVE_INFINITY,
    normal: null
  } 

  //predeclare constants and variables we'll be using
  var ball;
  var vec_c = ray.dir;
  var vec_N, vec_L, vec_V, vec_R;
  var vec_N_dot_L, vec_R_dot_V;
  var point_P, light, diffuse_component, specular_component, surface_color, reflectColor, refractColor, pixel_color;
  var reflectRay, reflectTrace, refractRay, resfractTrace, shadowRay, shadowHit;

  // find the closest object intersecting with the input ray
  for(var i =0, iLen = this.balls.length; i < iLen; i++){
    // if we're shadow testing or if we're using is_rf flag for refraction or reflection, set minimum distance ot 0.0001, otherwise 1
    this.balls[i].intersect(ray, closest_intersection, is_shadow_test || is_rf ? 0.0001 : 1);
    // when we are doing shadow ray test, as soon as there's 1 hit for shadow we can stop calculating for other objects
    if (is_shadow_test && closest_intersection.balls)
      break;
  }

  // if we're doing a shadow test just return the closest distance hit for slight performance boost, or null if no object hit
  if (is_shadow_test){
    return closest_intersection.ball ? closest_intersection.t : null;
  }
  
  // if we didn't hit anything, return the background color
  if( !closest_intersection.ball )
    return mult_3_coeffs( this.ambient, background_functions[ curr_background_function ] ( ray ) ).concat(1);     

  // set the variables using the closest intersected ball
  ball = closest_intersection.ball;
  vec_N = closest_intersection.normal;
  point_P = add(ray.origin, scale_vec(closest_intersection.t, ray.dir));


  // set ambient color
  surface_color = clamp(scale_vec(ball.k_a, ball.color));
 
  // for each light source...
  for (var i = 0, iLen = this.anim.graphicsState.lights.length; i < iLen; i++){
    light = this.anim.graphicsState.lights[i];

    // create a shadow ray
    shadowRay = {
      origin: point_P, 
      dir: subtract(light.position, point_P)
    };
  
    // shoot the shadow ray
    shadowHit = this.trace(shadowRay, vec3(1, 1, 1), true);

    // if our shadowRay hit something and the distance it hit is between 0.0001 and 1, we can skip the rest of the surface_color from this light source
    if (shadowHit && shadowHit > 0.0001 && shadowHit < 1){
      continue;
    }

    // if we didn't hit anything, calculate N, L, V, R for diffuse and specular lighting   
    vec_L = normalize(subtract(light.position, point_P));
    vec_N_dot_L = dot(vec_N, vec_L);
    vec_V = normalize(subtract(ray.origin, point_P));
    vec_N_dot_L = dot(vec_N, vec_L);
    vec_R = subtract(scale_vec(2 * vec_N_dot_L, vec_N), vec_L);
    vec_R_dot_V = dot(vec_R, vec_V);
  
    diffuse_componet = clamp(scale_vec(ball.k_d * Math.max(0, vec_N_dot_L), ball.color));
    specular_component = clamp(scale_vec(ball.k_s * Math.pow(Math.max(0, vec_R_dot_V), ball.n), this.white));
  
    surface_color = add(surface_color, mult_3_coeffs(light.color.slice(0.3), add(diffuse_componet, specular_component)));
  }

  // calculate the available remaining color
  var newColorRemaining = mult_3_coeffs(color_remaining, subtract(this.white, surface_color));

  // if the k_r is 0, don't bother running any reflection code for performance boost
  if (ball.k_r > 0){
     // create a new reflection ray
    reflectRay = {
      origin: point_P,
      dir: add(scale_vec(-2 * dot(vec_N, vec_c), vec_N), vec_c)
    };
    reflectTrace = this.trace(reflectRay, scale_vec(ball.k_r, newColorRemaining) , false, true);
    reflectColor = clamp(scale_vec(ball.k_r, reflectTrace.slice(0, 3)));
  }
  else
    reflectColor = vec3(0, 0, 0);

  // if the k_refract is 0, don't bother running any refraction code for performance boost
  if (ball.k_refract > 0){
    // create a new refraction ray using snell's law converted to vectors
    var small_l = normalize(ray.dir);
    var small_c = -1 * dot(vec_N, small_l);

    var discriminant = 1.0 - ball.refract_index*ball.refract_index*(1.0 - small_c*small_c);

    refractRay = {
      origin: point_P,
      dir: add(scale_vec(ball.refract_index, small_l), scale_vec(ball.refract_index*small_c - Math.sqrt(discriminant), vec_N))
    }
 
    refractTrace = this.trace(refractRay, scale_vec(ball.k_refract, newColorRemaining), false, true);
    refractColor = clamp(scale_vec(ball.k_refract, refractTrace.slice(0, 3)));
  }
  else 
    refractColor = vec3(0, 0, 0)
  
  //pixel_color = surface_color + (white - surface_color) (reflect + refract);
  pixel_color = add(surface_color, mult_3_coeffs(subtract(this.white, surface_color), add(reflectColor, refractColor)));

  return clamp(pixel_color);
}

Raytracer.prototype.parseLine = function( tokens )            // Load the text lines into variables
{
  switch( tokens[0] )
    {
        case "NEAR":    this.near   = tokens[1];  break;
        case "LEFT":    this.left   = tokens[1];  break;
        case "RIGHT":   this.right  = tokens[1];  break;
        case "BOTTOM":  this.bottom = tokens[1];  break;
        case "TOP":     this.top    = tokens[1];  break;
        case "RES":     this.width  = tokens[1];  
                        this.height = tokens[2]; 
                        this.scratchpad.width  = this.width;
                        this.scratchpad.height = this.height; 
                        break;
        case "SPHERE":
          this.balls.push( new Ball( vec3( tokens[1], tokens[2], tokens[3] ), vec3( tokens[4], tokens[5], tokens[6] ), vec3( tokens[7], tokens[8], tokens[9] ), 
                             tokens[10], tokens[11], tokens[12], tokens[13], tokens[14], tokens[15], tokens[16] ) );
          break;
        case "LIGHT":
          this.anim.graphicsState.lights.push( new Light( vec4( tokens[1], tokens[2], tokens[3], 1 ), Color( tokens[4], tokens[5], tokens[6], 1 ), 100000 ) );
          break;
        case "BACK":     background_color = Color( tokens[1], tokens[2], tokens[3], 1 );  gl.clearColor.apply( gl, background_color ); break;
        case "AMBIENT":
          this.ambient = vec3( tokens[1], tokens[2], tokens[3] );          
    }
}

Raytracer.prototype.parseFile = function()        // Move through the text lines
{
  this.balls = [];   this.anim.graphicsState.lights = [];
  this.scanline = 0; this.scanlines_per_frame = 1;                            // Begin at bottom scanline, forget the last image's speedup factor
  document.getElementById("progress").style = "display:inline-block;";        // Re-show progress bar
  this.anim.graphicsState.camera_transform = mat4();                          // Reset camera
  var input_lines = document.getElementById( "input_scene" ).value.split("\n");
  for( var i = 0; i < input_lines.length; i++ ) this.parseLine( input_lines[i].split(/\s+/) );
}

Raytracer.prototype.setColor = function( ix, iy, color )        // Sends a color to one pixel value of our final result
{
  var index = iy * this.width + ix;
  this.imageData.data[ 4 * index     ] = 255.9 * color[0];    
  this.imageData.data[ 4 * index + 1 ] = 255.9 * color[1];    
  this.imageData.data[ 4 * index + 2 ] = 255.9 * color[2];    
  this.imageData.data[ 4 * index + 3 ] = 255;  
}

Raytracer.prototype.display = function(time)
{
  var desired_milliseconds_per_frame = 100;
  if( ! this.prev_time ) this.prev_time = 0;
  if( ! this.scanlines_per_frame ) this.scanlines_per_frame = 1;
  this.milliseconds_per_scanline = Math.max( ( time - this.prev_time ) / this.scanlines_per_frame, 1 );
  this.prev_time = time;
  this.scanlines_per_frame = desired_milliseconds_per_frame / this.milliseconds_per_scanline + 1;
  
  if( !this.visible )  {                         // Raster mode, to draw the same shapes out of triangles when you don't want to trace rays
    for( i in this.balls ){
        this.m_sphere.draw( this.anim.graphicsState, this.balls[i].model_transform, new Material( this.balls[i].color.concat( 1 ), 
                                                                              this.balls[i].k_a, this.balls[i].k_d, this.balls[i].k_s, this.balls[i].n ) );
      }
    this.scanline = 0;    document.getElementById("progress").style = "display:none";     return; }; 
  if( !textures["procedural"] || ! textures["procedural"].loaded ) return;      // Don't display until we've got our first procedural image
  
  this.scratchpad_context.drawImage(textures["procedural"].image, 0, 0 );
  this.imageData = this.scratchpad_context.getImageData(0, 0, this.width, this.height );    // Send the newest pixels over to the texture
  var camera_inv = inverse( this.anim.graphicsState.camera_transform );
    
  for( var i = 0; i < this.scanlines_per_frame; i++ )     // Update as many scanlines on the picture at once as we can, based on previous frame's speed
  {
    var y = this.scanline++;
    if( y >= this.height ) { 
  //    die(); 
      this.scanline = 0; document.getElementById("progress").style = "display:none" };
    document.getElementById("progress").innerHTML = "Rendering ( " + 100 * y / this.height + "% )..."; 
    for ( var x = 0; x < this.width; x++ )
    {
      var ray = { origin: mult_vec( camera_inv, vec4( 0, 0, 0, 1 ) ), dir: mult_vec( camera_inv, this.getDir( x, y ) ) };   // Apply camera
      this.setColor( x, y, this.trace( ray, vec3(1, 1, 1) ) );                                    // ******** Trace a single ray *********
    }
  }

  
  this.scratchpad_context.putImageData( this.imageData, 0, 0);                    // Draw the image on the hidden canvas
  textures["procedural"].image.src = this.scratchpad.toDataURL("image/png");      // Convert the canvas back into an image and send to a texture
  
  this.m_square.draw( new GraphicsState( mat4(), mat4(), 0 ), mat4(), new Material( Color( 0, 0, 0, 1 ), 1,  0, 0, 1, "procedural" ) );

  if( !this.m_text  ) { this.m_text  = new Text_Line( 45 ); this.m_text .set_string("Open some test cases with the blue button."); }
  if( !this.m_text2 ) { this.m_text2 = new Text_Line( 45 ); this.m_text2.set_string("Click and drag to steer."); }
  
  var model_transform = rotation( -90, vec3( 0, 1, 0 ) );                           
      model_transform = mult( model_transform, translation( .3, .9, .9 ) );
      model_transform = mult( model_transform, scale( 1, .075, .05) );
  
  this.m_text .draw( new GraphicsState( mat4(), mat4(), 0 ), model_transform, true, vec4(0,0,0, 1 - time/10000 ) );         
      model_transform = mult( model_transform, translation( 0, -1, 0 ) );
  this.m_text2.draw( new GraphicsState( mat4(), mat4(), 0 ), model_transform, true, vec4(0,0,0, 1 - time/10000 ) );   
}

Raytracer.prototype.init_keys = function()   {  shortcut.add( "SHIFT+r", this.toggle_visible.bind( this ) );  }

Raytracer.prototype.update_strings = function( debug_screen_object )    // Strings that this displayable object (Raytracer) contributes to the UI:
  { }