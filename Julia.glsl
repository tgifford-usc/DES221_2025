// adapted by Toby Gifford
// from https://www.shadertoy.com/view/ddGSRd
// to include mouse reaction

const float PI = 3.14159265359;
const vec2 CA = vec2(-0.200,-0.380);
const vec2 CB = vec2(-0.610,0.635);
vec2 CC = vec2(-0.440,0.170);
const vec2 CD = vec2(0.170,-0.10); 
const float C=1.5; 
const float C2=23.7; 
const vec3 Color = vec3(0.450,0.513,1.000);
const float Speed = 2.;
#ifdef AUDIO
float iAudio = 0.;
#else
const float iAudio = .15;
#endif

// Complex functions
vec2 cis(in float a){ return vec2(cos(a), sin(a));}
vec2 cMul(in vec2 a, in vec2 b) { return vec2( a.x*b.x - a.y*b.y, a.x*b.y + a.y * b.x);}
vec2 cDiv(in vec2 a, in vec2 b) { return vec2(a.x*b.x + a.y*b.y, a.y*b.x - a.x*b.y) / (b.x*b.x+b.y*b.y); }
vec2 cLog(in vec2 a){ return vec2(log(length(a)),atan(a.y,a.x)); }
void fill(inout float[9] k){for( int i=0;i<8;i++) { k[i] = 0.;} }
// Elliptic J function calculation ported from d3
// https://github.com/d3/d3-geo-projection/blob/master/src/elliptic.js
vec4 ellipticJ(float u, float m){
    float ai, b=sqrt(1.-m), phi, t, twon=1.;
    float a[9],c[9];
    fill(a); fill(c);
	a[0] = 1.; c[0] = sqrt(m);
    int i=0;
    for (int j=1;j<8;j++){
        if ((c[j-1] / a[j-1]) > 0.1) {
            i++;
            ai = a[j-1];
            c[j] = (ai - b) * .5;
            a[j] = (ai + b) * .5;
            b = sqrt(ai * b);
            twon *= 2.;
        }
    }
    for (int j=8;j>0;j--){
        if (j == i) phi = twon * a[j] * u;
        if (j <= i){
            t = c[j] * sin(b = phi) / a[j];
            phi = (asin(t) + phi) / 2.;
        }
    }
    return vec4(sin(phi), t = cos(phi), t / cos(phi - b), phi);
}
// Jacobi's cn tiles the plane with a sphere 
vec2 cn(vec2 z, float m) {
    vec4 a = ellipticJ(z.x, m), b = ellipticJ(z.y, 1. - m);
    return vec2(a[1] * b[1] , -a[0] * a[2] * b[0] * b[2] )/ (b[1] * b[1] + m * a[0] * a[0] * b[0] * b[0]);
}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}
vec3 domain(vec2 z){
    return vec3(hsv2rgb(vec3(atan(z.y,z.x)/PI*8.+1.224+(iMouse.y/iResolution.y),1.,1.)));
}
// A Julia fractal, but with a Mobius transformation instead of a translation
vec3 M(vec2 z,vec2 c){
    vec3 mean;
    float ci;
    int k=0;
	vec3 color;
    for ( int i=0; i<50;i++){
        z = cMul(z,z);
        z = cDiv(cMul(CA,z)+CB+cis(iTime)*(iMouse.x / iResolution.x),cMul(z,CC)+CD);          
        if (i < 3) continue;
	 	mean += length(z);
        float amount = pow(7./float(i),2.608);
        color = (1.-amount)*color+amount*length(z)*domain(z);
        k++;
    }
	mean /= float(k-3);
    // Hacky color time!
	ci =  log2(C2*log2(length(mean/C)));
	ci = max(0.,ci);
    vec3 color2 = .5+.5*cos(ci + Color)+.3;
	color = color2*(color);
    
    return color;
}
vec3 color(vec2 z){
    z = cLog(z) * 1.179;
    z.x -= mod(iTime/float(Speed),1.)*3.7;
    z *= mat2(1,-1,1,1);
    z = cn(z,0.5);
    return M(z,z);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    #ifdef AUDIO
    iAudio = texture(iChannel0, vec2(0.1, 0.)).r;
    iAudio = pow(iAudio,4.);
	#endif
    vec2 uv = (fragCoord.xy-0.5*iResolution.xy) / iResolution.y;
	fragColor = vec4(color(uv),1.0);
}