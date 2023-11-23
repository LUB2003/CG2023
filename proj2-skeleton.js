    <script type="importmap">
    {
        "imports": {
            "three": "https://unpkg.com/three/build/three.module.js",
            "orbitcontrols": "https://unpkg.com/three/examples/jsm/controls/OrbitControls.js",
            "datgui": "https://unpkg.com/dat.gui/build/dat.gui.module.js"
        }
    }
    </script>


import * as mat4 from "./lib/gl-matrix/mat4.js";
import {toRadian} from "./lib/gl-matrix/common.js";
import * as THREE from 'three';

const loc_aPosition = 0;
const loc_aColor = 1;

const src_vert = 
`#version 300 es
layout(location=${loc_aPosition}) in vec4 aPosition;
layout(location=${loc_aColor}) in vec4 aColor;
uniform mat4 MVP;
out vec4 vColor;
void main() 
{
    gl_Position = MVP * aPosition;
    vColor = aColor;
}`;
const src_frag =
`#version 300 es
precision mediump float;
in vec4 vColor;
out vec4 fColor;
void main() 
{
    fColor = vColor;
//    fColor = vec4(1,0,0,1);
}`;


function main() {

 
    // Getting the WebGL context
    const canvas = document.getElementById('webgl');
    const gl = canvas.getContext("webgl2");

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('black');
 

    
    const h_prog = createProgram(gl, src_vert, src_frag);

    const loc_MVP = gl.getUniformLocation(h_prog, "MVP");

    const vao = init_square(gl);

    const VP = mat4.create();
    // Projection transformation
    mat4.perspective(VP, toRadian(30), canvas.width/canvas.height, 1, 100);

    // View transformation
    mat4.translate(VP, VP, [0, 0, -20]);

    // Model transformation (might be different for each object to render)
    const M = mat4.create();
    mat4.translate(M, M, [1, 0, 0]);
    mat4.rotate(M, M, toRadian(30), [0, 0, 1]);

    // build the MVP matrix
    const MVP = mat4.create();
    mat4.multiply(MVP, VP, M);

    render_scene({gl, canvas, h_prog, vao, uniforms:{MVP:{location:loc_MVP, value:MVP}}});
}

    // base
    const base = new THREE.Object3D();
    {
        canvas.add(base);
    }
    
    // baseMesh 
    const baseMesh = {width:4, height:1, color:'red'};
    {
        baseMesh.mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshPhongMaterial({color: baseMesh.color}));
        base.add(baseMesh.mesh);
    }



function init_square(gl)
{
    const vertices = new Float32Array([
                     //   position     color
                     // ------------  -------
                        -0.90, -0.90, 1, 0, 0,   
                         0.90, -0.90, 0, 1, 0,   
                         0.90,  0.90, 0, 0, 1,   
                        -0.90,  0.90, 1, 1, 1]); 
    const indices = new Uint16Array([
                        0, 1, 2,    // triangle #0
                        0, 2, 3]);  // triangle #1
   
 
    // Setting up the geometry data
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
 
    const vbo = gl.createBuffer();
 
    // From which VBO to retrieve the geometry data? --> stored in the VAO
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);    
    // Upload the geometry data
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const BYTE_SIZE_OF_FLOAT32 = 4;
 
    // In which pattern vertex position data (specified by loc_aPosition)
    // are stored in the buffer? --> stored in the VAO
    gl.vertexAttribPointer(loc_aPosition, 2, gl.FLOAT, false, 5*BYTE_SIZE_OF_FLOAT32, 0);
    // Enable the attribute specified by loc_aPosition --> stored in the VAO
    gl.enableVertexAttribArray(loc_aPosition);

    gl.vertexAttribPointer(loc_aColor, 3, gl.FLOAT, false, 5*BYTE_SIZE_OF_FLOAT32, 2*BYTE_SIZE_OF_FLOAT32);
    gl.enableVertexAttribArray(loc_aColor);

    const ibo = gl.createBuffer(); // index buffer
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
 
    gl.bindVertexArray(null);   // Unbind the VAO
     
    // After unbinding the VAO, the followings don't affect 
    // the states stored in the VAO.
    gl.disableVertexAttribArray(loc_aPosition); 
    gl.disableVertexAttribArray(loc_aColor); 
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    return vao;
}

function render_scene(params)
{
    const {gl, canvas, h_prog, vao, uniforms} = params;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.1, 0.1, 0.1, 1);
    
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(h_prog);
    gl.uniformMatrix4fv(uniforms.MVP.location, false, uniforms.MVP.value);
    gl.bindVertexArray(vao);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);
}

function createProgram(gl, src_vert, src_frag)
{
    function compileShader(gl, type, src)
    {
        let shader = gl.createShader(type);
        if(!shader)
        {
            console.log('Compile Error: Failed to create a shader.');
            return null;
        }
        
        gl.shaderSource(shader, src);
        
        gl.compileShader(shader);
        
        let status = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if(!status)
        {
            let err = gl.getShaderInfoLog(shader);
            console.log(`Compilation Error: ${err}`);
            gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    }


    let h_vert = compileShader(gl, gl.VERTEX_SHADER, src_vert);
    var h_frag = compileShader(gl, gl.FRAGMENT_SHADER, src_frag);
    if(!h_vert || !h_frag) return null;
    
    let h_prog = gl.createProgram();
    if(!h_prog)   return null;
    
    gl.attachShader(h_prog, h_vert);
    gl.attachShader(h_prog, h_frag);
    gl.linkProgram(h_prog);
    
    let status = gl.getProgramParameter(h_prog, gl.LINK_STATUS);
    if(!status)
    {
        let err = gl.getProgramInfoLog(h_prog);
        console.log(`Link Error: ${err}`);
        gl.deleteProgram(h_prog);
        gl.deleteShader(h_vert);
        gl.deleteShader(h_frag);
        return null;
    }
    return h_prog;
}


main();
