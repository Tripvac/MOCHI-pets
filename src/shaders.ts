export const vertex = `
in vec2 aPosition;out vec2 vTextureCoord;
uniform vec4 uInputSize;uniform vec4 uOutputFrame;uniform vec4 uOutputTexture;
void main(){vec2 p=aPosition*uOutputFrame.zw+uOutputFrame.xy;p.x=p.x*(2.0/uOutputTexture.x)-1.0;p.y=p.y*(2.0*uOutputTexture.z/uOutputTexture.y)-uOutputTexture.z;gl_Position=vec4(p,0.0,1.0);vTextureCoord=aPosition*(uOutputFrame.zw*uInputSize.zw);}`;
// One WebGL pass: moving sunbeams, soft vignette, rain droplets in the window, and local lamplight.
export const fragment = `
in vec2 vTextureCoord;out vec4 finalColor;uniform sampler2D uTexture;
uniform vec4 uInputSize;uniform vec4 uOutputFrame;
uniform float uTime;uniform float uNight;uniform float uRain;uniform float uQuality;uniform float uLamp;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){
 vec2 uv=vTextureCoord*uInputSize.xy/uOutputFrame.zw;vec4 color=texture(uTexture,vTextureCoord);
 float beam=pow(max(0.0,sin((uv.x+uv.y*.53)*23.0+sin(uTime*.14)*.22)),16.0);
 float light=beam*smoothstep(.28,.65,uv.y)*.055*(1.0-uNight)*(1.0-uRain);
 color.rgb+=vec3(1.0,.79,.45)*light*uQuality;
 vec3 nightColor=color.rgb*vec3(.86,.89,.97);color.rgb=mix(color.rgb,nightColor,uNight*.86);
 float lamp=exp(-length((uv-vec2(.15,.63))*vec2(4.0,4.8))*3.0);
 color.rgb+=vec3(.43,.25,.08)*lamp*uNight*.35*uLamp;
 float win=step(.325,uv.x)*step(uv.x,.70)*step(.20,uv.y)*step(uv.y,.435);
 color.rgb=mix(color.rgb,color.rgb*vec3(.78,.84,.88),uRain*.30);
 vec2 grid=uv*vec2(65.,85.);vec2 cell=floor(grid);vec2 drop=fract(grid+vec2(0.,uTime*(.12+hash(cell)*.16)))-.5;
 float bead=(1.-smoothstep(.018,.11,length(drop*vec2(1.,.28))))*step(.65,hash(cell));
 color.rgb+=bead*win*uRain*vec3(.15,.20,.22);
 float edge=pow(length((uv-.5)*vec2(1.,.7)),2.);color.rgb*=1.-edge*.13;
 finalColor=vec4(color.rgb,color.a);
}`;
