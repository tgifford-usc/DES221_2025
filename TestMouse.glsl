void mainImage( out vec4 fragColor, in vec2 fragCoord )
    {	
        // vec2 q = fragCoord.xy/iResolution.xy;
        // vec2 p = (gl_FragCoord.xy - 0.5*iResolution.xy)/iResolution.y;
        // vec2 bsMo = (iMouse.xy - 0.5*iResolution.xy)/iResolution.y;
        
        vec3 col = vec3(1.0, 0.0, 0.0);
        
        vec2 d = fragCoord - iMouse.xy;
        if (sqrt(d.x * d.x + d.y * d.y) < 10.0) { 
            fragColor = vec4( col, 1.0 );
        } else {
            fragColor = vec4( 0.0, 0.0, 0.0, 1.0);
        }
    }    
