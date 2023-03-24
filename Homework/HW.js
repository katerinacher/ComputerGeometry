// HW.js

"use strict";

// Vertex shader program
const VSHADER_SOURCE =
    '#version 100\n' +
  'attribute vec4 a_Position;\n' +
  'uniform mat4 u_mvpMatrix;\n' +
  'void main() {\n' +
  '  gl_Position = u_mvpMatrix * a_Position;\n' +
  '  gl_PointSize = 3.0;\n' +
  '}\n';

// Fragment shader program
const FSHADER_SOURCE =
  'precision mediump float;\n' +
  'void main() {\n' +
  '  gl_FragColor = vec4(0.6, 0.3, 0.7, 1.0);\n' +
  '}\n';

const {mat2, mat3, mat4, vec2, vec3, vec4} = glMatrix;

function main() {
  const canvas = document.getElementById('webgl');

  const gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  const controls = {
    view: 'axonometry',
    zoom: 'in',
    perspective_effect: 'more',
    a: 1,
    b: 1,
    c: 1,
    t: 2,
    r: 2
  };

  var n;
  const gui = new dat.GUI();

  const paramsFolder = gui.addFolder('Parameters');

  paramsFolder.add(controls, 'a', 0.1, 10).onChange(function (value) {
    controls.a = value;
    n = initEllipsoid(gl, controls.a, controls.b, controls.c, controls.t, controls.r);
  });

  paramsFolder.add(controls, 'b', 0.1, 10).onChange(function (value) {
    controls.b = value;
    n = initEllipsoid(gl, controls.a, controls.b, controls.c, controls.t, controls.r);
  });

  paramsFolder.add(controls, 'c', 0.1, 10).onChange(function (value) {
    controls.c = value;
    n = initEllipsoid(gl, controls.a, controls.b, controls.c, controls.t, controls.r);
  });

  paramsFolder.add(controls, 't', 0.1, 10).onChange(function (value) {
    controls.t = value;
    n = initEllipsoid(gl, controls.a, controls.b, controls.c, controls.t, controls.r);
  });

  paramsFolder.add(controls, 'r', 0.1, 10).onChange(function (value) {
    controls.r = value;
    n = initEllipsoid(gl, controls.a, controls.b, controls.c, controls.t, controls.r);
  });

  var t = controls.t;
  var r = controls.r;
  var a = controls.a;
  var b = controls.b;
  var c = controls.c;

  n = initEllipsoid(gl, a, b, c, t, r);
  if (n < 0) {
    console.log('Failed to set the positions of the vertices');
    return;
  }

  gl.clearColor(0, 0, 0, 1);
  gl.enable(gl.DEPTH_TEST);

  let perspectiveMatrix = mat4.create();
  let modelMatrix = mat4.create();
  let lookAtMatrix = mat4.create();

  let lastView = 'axonometry'
  const projection = {
    type: "Orthographic",
  };

  let view = gui.add(controls, 'view', ['left', 'right', 'top', 'bottom', 'front', 'back', 'isometry', 'axonometry']);
  let zoom = gui.add(controls, 'zoom', ['in', 'out']);

  const u_mvpMatrix = gl.getUniformLocation(gl.program, 'u_mvpMatrix');
  if (!u_mvpMatrix) {
    console.log('Failed to get the storage location of u_mvpMatrix');
    return -1;
  }

  let eye = [10, 0.5, 1];
  let center = [0, 0, 0];
  let up = [0, 1, 0];

  function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    let mvpMatrix = mat4.create();

    switch (controls.zoom) {
      case 'in':
        mat4.ortho(perspectiveMatrix, -1, 1, -1, 1, 0.001, 100);
      break;

      case 'out':
        mat4.ortho(perspectiveMatrix, -2, 2, -2, 2, 0.001, 100);
      break;

    }

    switch (controls.view) {
      case 'left':
        lastView = 'left'
        eye = [-0.5, 0, 0];
        mat4.lookAt(lookAtMatrix, eye, center, up);
        break;

      case 'right':
        lastView = 'right';
        eye = [0.5, 0, 0];
        mat4.lookAt(lookAtMatrix, eye, center, up);
        break;

      case 'top':
        lastView = 'top';
        eye = [0, 0.5, 0];
        mat4.lookAt(lookAtMatrix, eye, center, [0, 0, 1]);
        break;

      case 'bottom':
        lastView = 'bottom';
        eye = [0, -0.5, 0];
        mat4.lookAt(lookAtMatrix, eye, center, [0, 0, 1]);
        break;

      case 'front':
        lastView = 'front';
        eye = [0, 0, 0.5];
        mat4.lookAt(lookAtMatrix, eye, center, up);
        break;

      case 'back':
        lastView = 'back';
        eye = [0, 0, -0.5];
        mat4.lookAt(lookAtMatrix, eye, center, up);
        break;

      case 'isometry':
        lastView = 'isometry';
        eye = [10, 10, 10];
        mat4.lookAt(lookAtMatrix, eye, center, up);
        break;

      case 'axonometry':
        lastView = 'axonometry';
        eye = [10, 0.1, 0.9];
        mat4.lookAt(lookAtMatrix, eye, center, up);
        break;
      }

    gl.clear(gl.COLOR_BUFFER_BIT);

    mat4.multiply(mvpMatrix, perspectiveMatrix, lookAtMatrix);
    mat4.multiply(mvpMatrix, mvpMatrix, modelMatrix);

    gl.uniformMatrix4fv(u_mvpMatrix, false, mvpMatrix);

    gl.drawElements(gl.LINE_STRIP, n, gl.UNSIGNED_SHORT, 0);

    requestAnimationFrame(render);
  }

  render();
}

function initEllipsoid(gl, a, b, c, t, r) {
  var SPHERE_DIV = 20; // количество разбиений
  var i, lat, latitude, lat_sin, lat_cos;
  var j, long, longtitude, long_sin, long_cos;
  var ind_vertex1, ind_vertex2;
  var vertices = [], indices = [];
  for (lat = 0; lat < SPHERE_DIV + 1; lat++) {
    latitude = -Math.PI / 2 + lat * Math.PI / SPHERE_DIV; // широта (-pi/2, pi/2)
    lat_sin = Math.sign(Math.sin(latitude)) * Math.pow(Math.abs(Math.sin(latitude)), 2 / t);
    lat_cos = Math.sign(Math.cos(latitude)) * Math.pow(Math.abs(Math.cos(latitude)), 2 / t);
    for (long = 0; long < SPHERE_DIV + 1; long++) {
      longtitude = -Math.PI + 2 * long * Math.PI / SPHERE_DIV; // долгота (-pi, pi)
      long_sin = Math.sign(Math.sin(longtitude)) * Math.pow(Math.abs(Math.sin(longtitude)), 2 / r);
      long_cos = Math.sign(Math.cos(longtitude)) * Math.pow(Math.abs(Math.cos(longtitude)), 2 / r);
      vertices.push(a * long_cos * lat_cos);  // X
      vertices.push(c * lat_sin);             // Z
      vertices.push(b * long_sin * lat_cos);  // Y     
    }
  }

  for (i = 0; i < SPHERE_DIV; i++) {
    for (j = 0; j < SPHERE_DIV; j++) {
      ind_vertex1 = i * (SPHERE_DIV + 1) + j;
      ind_vertex2 = ind_vertex1 + (SPHERE_DIV + 1);
      indices.push(ind_vertex1);
      indices.push(ind_vertex2);
      //indices.push(ind_vertex1 + 1); (диагональ прямоугольника)
      indices.push(ind_vertex2);
      indices.push(ind_vertex2 + 1);
    }
  }


  const vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  const indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  const a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }

  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  return indices.length;
}