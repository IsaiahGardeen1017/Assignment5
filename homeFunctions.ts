"use strict";
import {initFileShaders, vec4, mat4, perspective, flatten, lookAt, rotateX, scalem, rotateY} from "./helperfunctions.js";

//Web GL stuff
let gl:WebGLRenderingContext;
let program:WebGLProgram; //array of different shader programs

//Uniforms
let umv:WebGLUniformLocation;
let uproj:WebGLUniformLocation;
let uLightColor:WebGLUniformLocation;
let uAmbient:WebGLUniformLocation;
let uLightPosition:WebGLUniformLocation;


//Globe
let globeBufferId:WebGLBuffer;
let globePoints:vec4[];

//document elements
let canvas:HTMLCanvasElement;

//translations
let xAngle:number;


window.onload = function init(){
    canvas = document.getElementById("gl-canvas") as HTMLCanvasElement;
    gl = canvas.getContext('webgl2', {antialias:true}) as WebGLRenderingContext;
    if (!gl) {
        alert("WebGL isn't available");
    }

    //Setup program
    program = initFileShaders(gl,"./vshader-basic.glsl","./fshader-basic.glsl");
    gl.useProgram(program);

    globeBufferId = gl.createBuffer();
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.cullFace(gl.BACK);
    gl.enable(gl.CULL_FACE);


    //Initialize uniforms
    uproj = gl.getUniformLocation(program, "projection");
    umv = gl.getUniformLocation(program, "model_view");
    uLightPosition = gl.getUniformLocation(program, "light_position");
    uAmbient = gl.getUniformLocation(program, "ambient_light");
    uLightColor = gl.getUniformLocation(program, "light_color");

    //Sends over projection matrix
    let proj:mat4 = perspective(60, canvas.clientWidth / canvas.clientHeight, 0.01, 1000.0);
    gl.uniformMatrix4fv(uproj, false, proj.flatten());

    generateSphere(15);
    xAngle = 0;


    window.setInterval(update, 50);
}


function update(){
    xAngle++;
    setLightValues();
    render();
}

function setLightValues(){
    gl.uniform4fv(uLightColor, [1, 1, 1, 1]); //Light color
    gl.uniform4fv(uAmbient, [.25, .25, .25, 1]); //intensity
    gl.uniform4fv(uLightPosition, [1, 1, 1, 0]); //Light Position
}


function generateSphere(subdiv:number){
    let step:number = (360.0 / subdiv)*(Math.PI / 180.0);
    globePoints = [];

    for (let lat:number = 0; lat <= Math.PI ; lat += step){ //latitude
        for (let lon:number = 0; lon + step <= 2*Math.PI; lon += step){ //longitude
            //triangle 1
            globePoints.push(new vec4(Math.sin(lat)*Math.cos(lon), Math.sin(lon)*Math.sin(lat), Math.cos(lat), 1.0)); //position
            globePoints.push(new vec4(Math.sin(lat)*Math.cos(lon), Math.sin(lon)*Math.sin(lat), Math.cos(lat), 0.0)); //normal
            globePoints.push(new vec4(Math.sin(lat)*Math.cos(lon+step), Math.sin(lat)*Math.sin(lon+step), Math.cos(lat), 1.0));
            globePoints.push(new vec4(Math.sin(lat)*Math.cos(lon+step), Math.sin(lat)*Math.sin(lon+step), Math.cos(lat), 0.0));
            globePoints.push(new vec4(Math.sin(lat+step)*Math.cos(lon+step), Math.sin(lon+step)*Math.sin(lat+step), Math.cos(lat+step), 1.0));
            globePoints.push(new vec4(Math.sin(lat+step)*Math.cos(lon+step), Math.sin(lon+step)*Math.sin(lat+step), Math.cos(lat+step), 0.0));

            //triangle 2
            globePoints.push(new vec4(Math.sin(lat+step)*Math.cos(lon+step), Math.sin(lon+step)*Math.sin(lat+step), Math.cos(lat+step), 1.0));
            globePoints.push(new vec4(Math.sin(lat+step)*Math.cos(lon+step), Math.sin(lon+step)*Math.sin(lat+step), Math.cos(lat+step), 0.0));
            globePoints.push(new vec4(Math.sin(lat+step)*Math.cos(lon), Math.sin(lat+step)*Math.sin(lon), Math.cos(lat+step), 1.0));
            globePoints.push(new vec4(Math.sin(lat+step)*Math.cos(lon), Math.sin(lat+step)*Math.sin(lon), Math.cos(lat+step),0.0));
            globePoints.push(new vec4(Math.sin(lat)*Math.cos(lon), Math.sin(lon)*Math.sin(lat), Math.cos(lat), 1.0));
            globePoints.push(new vec4(Math.sin(lat)*Math.cos(lon), Math.sin(lon)*Math.sin(lat), Math.cos(lat), 0.0));
        }
    }

    globeBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, globeBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(globePoints), gl.STATIC_DRAW);

}

function render(){
    let mv:mat4 = lookAt(new vec4(2,0,0,0), new vec4(0,0,0,0), new vec4(0,1,0,0));



    gl.bindBuffer(gl.ARRAY_BUFFER, globeBufferId);
    let vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 32, 0);
    gl.enableVertexAttribArray(vPosition);

    let vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 32, 16);
    gl.enableVertexAttribArray(vNormal);
    gl.vertexAttrib4fv(gl.getAttribLocation(program, "vAmbientColor"), [0.5, 0.0, 0.0, 1.0]);
    gl.vertexAttrib4fv(gl.getAttribLocation(program, "vDiffuseColor"), [0.3, 0.1, 0.1, 1.0]);
    gl.vertexAttrib4fv(gl.getAttribLocation(program, "vSpecularColor"), [1.0, 1.0, 1.0, 1.0]);
    gl.vertexAttrib1f(gl.getAttribLocation(program, "vSpecularExponent"), 50.0);
    mv = mv.mult(rotateY(xAngle));
    gl.uniformMatrix4fv(umv, false, mv.flatten());
    gl.drawArrays(gl.TRIANGLES, 0, globePoints.length);
}