"use strict";
import {
    initFileShaders,
    vec4,
    mat4,
    perspective,
    flatten,
    lookAt,
    rotateX,
    scalem,
    rotateY,
    vec2, rotateZ
} from "./helperfunctions.js";

//Web GL stuff
let gl:WebGLRenderingContext;
let program:WebGLProgram; //array of different shader programs

//Uniforms
let umv:WebGLUniformLocation;
let uproj:WebGLUniformLocation;
let uLightColor:WebGLUniformLocation;
let uAmbient:WebGLUniformLocation;
let uLightPosition:WebGLUniformLocation;
let functionIndex:WebGLUniformLocation;

let vTexCoord:GLint;
//TODO Texture Stuff
let dayTextureSampler:WebGLUniformLocation;
let earthDayImage:HTMLImageElement;
let dayTexture:WebGLTexture;

let nightTextureSampler:WebGLUniformLocation;
let earthNightImage:HTMLImageElement;
let nightTexture:WebGLTexture;

let specularTextureSampler:WebGLUniformLocation;
let earthSpecularImage:HTMLImageElement;
let specularTexture:WebGLTexture;

let cloudTextureSampler:WebGLUniformLocation;
let earthCloudImage:HTMLImageElement;
let cloudTexture:WebGLTexture;


//UI values
let clouds:boolean = true;
const ALLFEATURES = 0.0;
const SPECULAR = 1.0;
const SURFACETEXTURES = 2.0;
let funcIndexValue:number = ALLFEATURES;



//Globe
let globeBufferId:WebGLBuffer;
let globePoints:any[];

//document elements
let canvas:HTMLCanvasElement;

//translations
let frame:number;

let windowHeight:number;
let windowWidth:number;
let zoom:number = 2.05;


window.onload = function init(){
    canvas = document.getElementById("gl-canvas") as HTMLCanvasElement;
    gl = canvas.getContext('webgl2', {antialias:true}) as WebGLRenderingContext;
    if (!gl) {
        alert("WebGL isn't available");
    }

    //Mousemovement
    canvas.addEventListener("mousedown", mouse_down);
    canvas.addEventListener("mousemove", mouse_drag);
    canvas.addEventListener("mouseup", mouse_up);

    //Setup program
    program = initFileShaders(gl,"./vshader-basic.glsl","./fshader-basic.glsl");
    gl.useProgram(program);

    globeBufferId = gl.createBuffer();
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);


    //Initialize uniforms
    uproj = gl.getUniformLocation(program, "projection");
    umv = gl.getUniformLocation(program, "model_view");
    uLightPosition = gl.getUniformLocation(program, "light_position");
    uAmbient = gl.getUniformLocation(program, "ambient_light");
    uLightColor = gl.getUniformLocation(program, "light_color");
    functionIndex = gl.getUniformLocation(program, "function");


    //Sends over projection matrix
    let proj:mat4 = perspective(60, canvas.clientWidth / canvas.clientHeight, 0.01, 1000.0);
    gl.uniformMatrix4fv(uproj, false, proj.flatten());

    initTextures();
    generateSphere(128);
    frame = 0;
    windowHeight = 0;
    windowWidth = 0;


    window.addEventListener("keydown", function(event){
        keydownEvent(event.key);
    });

    window.setInterval(update, 32);
}

function initTextures() {
    //TODO STUFF FOR NEW TEXTURES
    dayTextureSampler = gl.getUniformLocation(program, "dayTextureSampler");
    dayTexture = gl.createTexture();
    earthDayImage = new Image();
    earthDayImage.onload = function() { handleTextureLoaded(earthDayImage, dayTexture); };
    earthDayImage.src = 'eu4.jpg';

    nightTextureSampler = gl.getUniformLocation(program, "nightTextureSampler");
    nightTexture = gl.createTexture();
    earthNightImage = new Image();
    earthNightImage.onload = function() { handleTextureLoaded(earthNightImage, nightTexture); };
    earthNightImage.src = 'EarthNight.png';


    specularTextureSampler = gl.getUniformLocation(program, "specularTextureSampler");
    specularTexture = gl.createTexture();
    earthSpecularImage = new Image();
    earthSpecularImage.onload = function() { handleTextureLoaded(earthSpecularImage, specularTexture); };
    earthSpecularImage.src = 'EarthSpec.png';

    cloudTextureSampler = gl.getUniformLocation(program, "cloudTextureSampler");
    cloudTexture = gl.createTexture();
    earthCloudImage = new Image();
    earthCloudImage.onload = function() { handleTextureLoaded(earthCloudImage, cloudTexture); };
    //earthCloudImage.src = 'starfield-1.jpg';
    earthCloudImage.src = 'earthcloudmap-visness.png';
    //earthCloudImage.src = 'opengl.png';
}

function handleTextureLoaded(image:HTMLImageElement, texture:WebGLTexture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    let anisotropic_ext = gl.getExtension('EXT_texture_filter_anisotropic');
    gl.texParameterf(gl.TEXTURE_2D, anisotropic_ext.TEXTURE_MAX_ANISOTROPY_EXT, 4);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

function update(){
    frame++;
    setLightValues();
    render();
}

function setLightValues(){
    gl.uniform4fv(uLightColor, [1, 1, 1, 1]); //Light color
    gl.uniform4fv(uAmbient, [.01, .01, .01, 1]); //intensity
    gl.vertexAttrib4fv(gl.getAttribLocation(program, "vAmbientColor"), [1.0, 1.0, 1.0, 1.0]);
    gl.vertexAttrib4fv(gl.getAttribLocation(program, "vDiffuseColor"), [1.0, 1.0, 1.0, 1.0]);
    gl.vertexAttrib4fv(gl.getAttribLocation(program, "vSpecularColor"), [0.8, 0.8, 0.8, 1.0]);
    gl.vertexAttrib1f(gl.getAttribLocation(program, "vSpecularExponent"), 25.0);
}


function generateSphere(subdiv:number){
    let step:number = (360.0 / subdiv)*(Math.PI / 180.0);
    globePoints = [];


    for (let lat:number = 0; lat <= Math.PI ; lat += step){ //latitude
        for (let lon:number = 0; lon + step <= 2*Math.PI; lon += step){ //longitude
            let nlat = lat/Math.PI;
            let nlon = lon/(2 * Math.PI);
            let slat = (lat + step)/Math.PI;
            let slon = (lon + step)/(2 * Math.PI);

            

            //triangle 1
            globePoints.push(new vec4(Math.sin(lat)*Math.cos(lon), Math.sin(lon)*Math.sin(lat), Math.cos(lat), 1.0)); //position
            globePoints.push(new vec4(Math.sin(lat)*Math.cos(lon), Math.sin(lon)*Math.sin(lat), Math.cos(lat), 0.0)); //normal
            globePoints.push(new vec2(nlon, nlat));

            globePoints.push(new vec4(Math.sin(lat)*Math.cos(lon+step), Math.sin(lat)*Math.sin(lon+step), Math.cos(lat), 1.0));
            globePoints.push(new vec4(Math.sin(lat)*Math.cos(lon+step), Math.sin(lat)*Math.sin(lon+step), Math.cos(lat), 0.0));
            //globePoints.push(new vec2(nlon, slat));
            globePoints.push(new vec2(slon, nlat));

            globePoints.push(new vec4(Math.sin(lat+step)*Math.cos(lon+step), Math.sin(lon+step)*Math.sin(lat+step), Math.cos(lat+step), 1.0));
            globePoints.push(new vec4(Math.sin(lat+step)*Math.cos(lon+step), Math.sin(lon+step)*Math.sin(lat+step), Math.cos(lat+step), 0.0));
            globePoints.push(new vec2(slon, slat));

            //triangle 2
            globePoints.push(new vec4(Math.sin(lat+step)*Math.cos(lon+step), Math.sin(lon+step)*Math.sin(lat+step), Math.cos(lat+step), 1.0));
            globePoints.push(new vec4(Math.sin(lat+step)*Math.cos(lon+step), Math.sin(lon+step)*Math.sin(lat+step), Math.cos(lat+step), 0.0));
            globePoints.push(new vec2(slon, slat));

            globePoints.push(new vec4(Math.sin(lat+step)*Math.cos(lon), Math.sin(lat+step)*Math.sin(lon), Math.cos(lat+step), 1.0));
            globePoints.push(new vec4(Math.sin(lat+step)*Math.cos(lon), Math.sin(lat+step)*Math.sin(lon), Math.cos(lat+step),0.0));
            //globePoints.push(new vec2(slon, nlat));
            globePoints.push(new vec2(nlon, slat));

            globePoints.push(new vec4(Math.sin(lat)*Math.cos(lon), Math.sin(lon)*Math.sin(lat), Math.cos(lat), 1.0));
            globePoints.push(new vec4(Math.sin(lat)*Math.cos(lon), Math.sin(lon)*Math.sin(lat), Math.cos(lat), 0.0));
            globePoints.push(new vec2(nlon, nlat));
        }
    }

    globeBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, globeBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(globePoints), gl.STATIC_DRAW);

    let vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 40, 0);
    gl.enableVertexAttribArray(vPosition);

    let vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 40, 16);
    gl.enableVertexAttribArray(vNormal);

    vTexCoord = gl.getAttribLocation(program, "texCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 40, 32);
    gl.enableVertexAttribArray(vTexCoord);

}

function resize(){
    let w = document.body.offsetWidth;
    let h = document.documentElement.clientHeight - 25;

    if(windowWidth != w || windowHeight != h) {
        canvas.height = h;
        canvas.width = w;

        let proj: mat4 = perspective(60, canvas.width / canvas.height, 0.01, 1000.0);
        gl.uniformMatrix4fv(uproj, false, proj.flatten());

        gl.viewport(0,0, gl.drawingBufferWidth, gl.drawingBufferHeight);

        windowWidth = w;
        windowHeight = h;
    }
}



function render(){
    resize();
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    let mv:mat4 = lookAt(new vec4(0,0,zoom,0), new vec4(0,0,0,0), new vec4(0,1,0,0));

    let simulationSpeed = 0.05;
    let cloudSpeed = 0.25;
    let sunDistance = 10;
    let sunVertOffset = 5;


    //TODO Needed for every new texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, dayTexture);
    gl.uniform1i(dayTextureSampler, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, nightTexture);
    gl.uniform1i(nightTextureSampler, 1);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, specularTexture);
    gl.uniform1i(specularTextureSampler, 2);

    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, cloudTexture);
    gl.uniform1i(cloudTextureSampler, 3);



    let rotOffset = frame * simulationSpeed;
    let sunRotOffset = rotOffset / 500;
    let cs = Math.cos(sunRotOffset);
    let sn = Math.sin(sunRotOffset);


    let lp = new vec4(sunDistance*cs - sunDistance*sn, sunVertOffset, sunDistance*sn + sunDistance*cs, 0);

    //Earth + sun transformations
    mv = mv.mult(rotateX(xAngle));
    mv = mv.mult(rotateY(yAngle));

    //Light Position
    lp = mv.mult(lp);
    gl.uniform4fv(uLightPosition, lp);

    //Earth only transformations
    mv = mv.mult(rotateY(rotOffset));
    mv = mv.mult(rotateX(-90));

    gl.uniform1f(functionIndex, funcIndexValue);
    gl.uniformMatrix4fv(umv, false, mv.flatten());
    gl.drawArrays(gl.TRIANGLES, 0, globePoints.length);


    if(clouds) {
        //Clouds
        let scaler = 1.01;
        let cloudOffset = rotOffset * cloudSpeed;
        mv = mv.mult(scalem(scaler, scaler, scaler));
        mv = mv.mult(rotateZ(cloudOffset));
        mv = mv.mult(rotateY(cloudOffset / 2));

        gl.uniform1f(functionIndex, 3.0);
        gl.uniformMatrix4fv(umv, false, mv.flatten());
        gl.drawArrays(gl.TRIANGLES, 0, globePoints.length);
    }



}



//I/O
let mouse_button_down:boolean = false;
let xAngle = 0;
let yAngle = 0;
let prevMouseX = 0;
let prevMouseY = 0;
function mouse_drag(event:MouseEvent){
    let thetaY:number, thetaX:number;
    if (mouse_button_down) {
        thetaY = 360.0 *(event.clientX-prevMouseX)/canvas.clientWidth;
        thetaX = 360.0 *(event.clientY-prevMouseY)/canvas.clientHeight;
        prevMouseX = event.clientX;
        prevMouseY = event.clientY;
        xAngle += thetaX;
        yAngle += thetaY;
    }
    requestAnimationFrame(render);
}
//record that the mouse button is now down
function mouse_down(event:MouseEvent) {
    //establish point of reference for dragging mouse in window
    mouse_button_down = true;
    prevMouseX= event.clientX;
    prevMouseY = event.clientY;
    requestAnimationFrame(render);
}
//record that the mouse button is now up, so don't respond to mouse movements
function mouse_up(){
    mouse_button_down = false;
    requestAnimationFrame(render);
}


function keydownEvent(key:string){
    switch(key) {
        case" ":
            funcIndexValue = (funcIndexValue + 1) % 3;
            break;
        case"c":
            clouds = !clouds;
            break;
        case"ArrowUp":
            zoom -= 0.05;
            break;
        case"ArrowDown":
            zoom += 0.05;
            break;
    }
}