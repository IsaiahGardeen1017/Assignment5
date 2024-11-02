#version 300 es

in vec4 vPosition;
in vec4 vNormal;
in vec2 texCoord;

in vec4 vDiffuseColor; //material color
in vec4 vAmbientColor; //material color
in vec4 vSpecularColor;
in float vSpecularExponent;



//In and Outs
out vec4 fAmbientColor;
out vec4 fDiffuseColor;
out vec4 fSpecularColor;
out float fSpecularExponent;
out vec4 veyepos;
out vec3 vN;
out vec2 fTexCoord;

uniform mat4 model_view;
uniform mat4 projection;

//vectors end in zero

void main(){

    fTexCoord = texCoord;

    veyepos = model_view * vPosition; //move object to eye space
    vN = normalize((model_view * normalize(vNormal)).xyz);

    gl_Position = projection * veyepos;

    fAmbientColor = vAmbientColor;
    fDiffuseColor = vDiffuseColor;
    fSpecularColor = vSpecularColor;
    fSpecularExponent = vSpecularExponent;
}