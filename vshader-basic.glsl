#version 300 es

in vec4 vPosition;
in vec4 vNormal;


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

uniform mat4 model_view;
uniform mat4 projection;

//vectors end in zero

void main(){


    veyepos = model_view * vPosition; //move object to eye space
    vN = normalize((model_view * vNormal).xyz);

    gl_Position = projection * veyepos;

    fAmbientColor = vAmbientColor;
    fDiffuseColor = vDiffuseColor;
    fSpecularColor = vSpecularColor;
    fSpecularExponent = vSpecularExponent;
}