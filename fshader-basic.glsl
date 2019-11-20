#version 300 es
precision mediump float;

in vec4 veyepos;
in vec3 vN;
in vec4 fAmbientColor;
in vec4 fDiffuseColor;
in vec4 fSpecularColor;
in float fSpecularExponent;
in vec2 fTexCoord;

out vec4  fColor;

uniform vec4 light_color;
uniform vec4 ambient_light;
uniform vec4 light_position;
uniform sampler2D textureSampler;

void main()
{
    vec3 N = normalize(vN);
    vec3 V = normalize(-veyepos.xyz);
    vec3 L = normalize(light_position.xyz - veyepos.xyz);
    vec3 H = normalize(L + V);

    //Ambient term
    vec4 amb = fAmbientColor * ambient_light;

    //Diffuse Term
    vec4 diff = max(0.0, dot(L, N)) * fDiffuseColor * light_color;

    //Specular Color
    vec4 spec = pow(max(0.0, dot(N, H)), fSpecularExponent) * fSpecularColor * light_color;

    if(dot(L, N) < 0.0){
        spec = vec4(0,0,0,1); //no light on the back side, Blim-Phong Issue
    }

    fColor = texture(textureSampler, fTexCoord);// + amb + spec + diff;
    //fColor = vec4(vN, 1);
}