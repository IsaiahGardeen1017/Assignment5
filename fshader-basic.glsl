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
uniform sampler2D dayTextureSampler;
uniform sampler2D nightTextureSampler;
uniform sampler2D specularTextureSampler;
uniform sampler2D cloudTextureSampler;
uniform float function;


void surfaceTexturesOnly(){
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


    //fColor = texture(textureSampler, fTexCoord);// + amb + spec + diff;
    vec4 dayTex = texture(dayTextureSampler, fTexCoord);
    vec4 nightTex = texture(nightTextureSampler, fTexCoord);
    vec4 final = vec4(1,1,1,1);
    final.x = ((diff.x) * dayTex.x) + ((1.0 - diff.x) * nightTex.x) + spec.x;//(spec.x * diff.x);
    final.y = ((diff.y) * dayTex.y) + ((1.0 - diff.y) * nightTex.y) + spec.y;//(spec.y * diff.y);
    final.z = ((diff.z) * dayTex.z) + ((1.0 - diff.z) * nightTex.z) + spec.z;//(spec.z * diff.z);

    fColor = final;
}

void allFeatures(){
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
    spec = spec * texture(specularTextureSampler, fTexCoord);

    //fColor = texture(textureSampler, fTexCoord);// + amb + spec + diff;
    vec4 dayTex = texture(dayTextureSampler, fTexCoord);
    vec4 nightTex = texture(nightTextureSampler, fTexCoord);
    vec4 final = vec4(1,1,1,1);
    final.x = ((diff.x) * dayTex.x) + ((1.0 - diff.x) * nightTex.x) + spec.x;//(spec.x * diff.x);
    final.y = ((diff.y) * dayTex.y) + ((1.0 - diff.y) * nightTex.y) + spec.y;//(spec.y * diff.y);
    final.z = ((diff.z) * dayTex.z) + ((1.0 - diff.z) * nightTex.z) + spec.z;//(spec.z * diff.z);


    final.w = 1.0;
    fColor = final;
}


void specularOnly(){
    vec3 N = normalize(vN);
    vec3 V = normalize(-veyepos.xyz);
    vec3 L = normalize(light_position.xyz - veyepos.xyz);
    vec3 H = normalize(L + V);
    vec4 spec = pow(max(0.0, dot(N, H)), fSpecularExponent) * fSpecularColor * light_color;
    spec = spec * texture(specularTextureSampler, fTexCoord);
    spec.w = 1.0;
    fColor = spec;
}

void decentClouds(){
    vec3 N = normalize(vN);
    vec3 V = normalize(-veyepos.xyz);
    vec3 L = normalize(light_position.xyz - veyepos.xyz);
    vec3 H = normalize(L + V);

    vec4 cloudTex = texture(cloudTextureSampler, fTexCoord);
    //Ambient term
    vec4 amb = vec4(cloudTex.x * ambient_light.x, cloudTex.y * ambient_light.y, cloudTex.z * ambient_light.z, cloudTex.w) ;
    //Diffuse Term
    vec4 diff = max(0.0, dot(L, N)) * texture(cloudTextureSampler, fTexCoord) * light_color;
    //Specular Color
    vec4 spec = pow(max(0.0, dot(N, H)), fSpecularExponent) * texture(cloudTextureSampler, fTexCoord) * light_color;


    fColor = diff;
}

void clouds(){
    vec3 N = normalize(vN);
    vec3 V = normalize(-veyepos.xyz);
    vec3 L = normalize(light_position.xyz - veyepos.xyz);
    vec3 H = normalize(L + V);

    vec4 cloudTex = texture(cloudTextureSampler, fTexCoord);

    vec4 diff = max(0.0, dot(L, N)) * fDiffuseColor * light_color;

    fColor.x = 0.0;//diff.x * cloudTex.x;
    fColor.y = 0.0;//diff.y * cloudTex.y;
    fColor.z = 0.0;//diff.z * cloudTex.z;
    fColor.w = cloudTex.w;

    //fColor = cloudTex;

    //diff.w = 1.0;
    //fColor = diff;
}

void main()
{
    if(function == 0.0){//All effects
        allFeatures();
    }else if(function == 1.0){//Specular Only
        specularOnly();
    }else if(function == 2.0){//Surface Textures Only
        surfaceTexturesOnly();
    }else if(function == 3.0){//Clouds
        decentClouds();
    }
}