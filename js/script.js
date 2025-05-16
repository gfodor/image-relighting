var canvas;
var m4;
var v3;
var gl;

var shaderProgram;
var mesh = [];
var normals = [];

var imgBuffer = {};

var lightPos = [0, 0, -1];
var xlightSlider; 
var ylightSlider;
var zlightSlider;
var lightPosSpan;

var textureCheckbox;

var lightIntensity = 0.4;
var lightIntensitySlider;
var lightIntensitySpan;

var lightColor = [1.0, 1.0, 1.0];
var lightColorPicker;

var constantFalloff = 1.0;
var linearFalloff = 0.09;
var quadraticFalloff = 0.03;
var constantFalloffSlider, linearFalloffSlider, quadraticFalloffSlider;
var constantFalloffSpan, linearFalloffSpan, quadraticFalloffSpan;

// Light 2 variables
var lightPos2 = [0.5, 0.5, -0.8];
var xlightSlider2;
var ylightSlider2;
var zlightSlider2;
var lightPosSpan2;

var lightIntensity2 = 0.3;
var lightIntensitySlider2;
var lightIntensitySpan2;

var lightColor2 = [0.8, 0.8, 1.0];
var lightColorPicker2;

var constantFalloff2 = 1.0;
var linearFalloff2 = 0.09;
var quadraticFalloff2 = 0.03;
var constantFalloffSlider2, linearFalloffSlider2, quadraticFalloffSlider2;
var constantFalloffSpan2, linearFalloffSpan2, quadraticFalloffSpan2;

// Light enabled states
var light1Enabled = true;
var light2Enabled = true;
var light1Checkbox, light2Checkbox;

// Add new ambient light variables
var ambientIntensity = 0.1;
var ambientIntensitySlider;
var ambientIntensitySpan;

// Add new light map variables
var lightMapIntensity = 0.5;
var lightMapIntensitySlider;
var lightMapIntensitySpan;

var images = {
    img: [
        "pot.png",
        "bird.jpg",
        "coke.jpg",
        "tunnel.jpg",
        "room.jpg",
        "shelf.jpg",
        "flower.jpg",
        "misc.jpg",
        'office.jpg',
        'kitchen.jpg',
        'human.jpg'
    ],
    texRoot: './images/texture/',
    depthRoot: './images/depth/',
    normalRoot: './images/normal/',
    lightMapRoot: './images/lighting/'
};

var imgIdx = 8;

var canvasDrag = false;
var mouseInCanvas = false;

window.onload = function() {

    if (location.search.substr(1) == "") {
        imgIdx = 0;
    } else {
        imgIdx = parseInt(location.search.substr(1));
    }
    Promise.all([
        load.img(images.depthRoot + images.img[imgIdx], "src-depth-img"),
        load.img(images.texRoot + images.img[imgIdx], "src-tex-img"),
        load.img(images.normalRoot + images.img[imgIdx], "src-normal-img"),
        load.img(images.lightMapRoot + images.img[imgIdx], "src-lightmap-img")
    ]).then(() => {

        if (!init()) {
            return;
        }
        setTimeout(startProcessing, 100);
    });

};

function startProcessing() {
    setCanvasSize();
    mesh = new Float32Array(ImgHelper.getMesh(5));
    normals = new Float32Array(ImgHelper.getNormals());
    setupShaderAttributes();
    
    // Light 1 controls
    xlightSlider = document.getElementById('xlightSlider');
    ylightSlider = document.getElementById('ylightSlider');
    zlightSlider = document.getElementById('zlightSlider');
    lightPosSpan = document.getElementById('light-pos-span');

    xlightSlider.value = 0.00;
    xlightSlider.addEventListener('input', sliderUpdate);

    ylightSlider.value = 0.00;
    ylightSlider.addEventListener('input', sliderUpdate);

    zlightSlider.value = -100.00;
    zlightSlider.addEventListener('input', sliderUpdate);

    // Texture toggle
    textureCheckbox = document.getElementById('texture-checkbox');

    // Light 1 intensity and color
    lightIntensitySlider = document.getElementById('lightIntensitySlider');
    lightIntensitySpan = document.getElementById('light-intensity-span');
    lightIntensitySlider.value = 40;
    lightIntensitySlider.addEventListener('input', sliderUpdate);

    lightColorPicker = document.getElementById('lightColorPicker');
    if (lightColorPicker) {
        lightColorPicker.value = rgbToHex(lightColor);
        lightColorPicker.addEventListener('input', sliderUpdate);
    }

    // Falloff sliders for Light 1
    constantFalloffSlider = document.getElementById('constantFalloffSlider');
    constantFalloffSpan = document.getElementById('constant-falloff-span');
    linearFalloffSlider = document.getElementById('linearFalloffSlider');
    linearFalloffSpan = document.getElementById('linear-falloff-span');
    quadraticFalloffSlider = document.getElementById('quadraticFalloffSlider');
    quadraticFalloffSpan = document.getElementById('quadratic-falloff-span');

    if (constantFalloffSlider && constantFalloffSpan) {
        constantFalloffSlider.value = constantFalloff * 100;
        constantFalloffSpan.innerHTML = constantFalloff.toFixed(2);
        constantFalloffSlider.addEventListener('input', sliderUpdate);
    }
    if (linearFalloffSlider && linearFalloffSpan) {
        linearFalloffSlider.value = linearFalloff * 100;
        linearFalloffSpan.innerHTML = linearFalloff.toFixed(2);
        linearFalloffSlider.addEventListener('input', sliderUpdate);
    }
    if (quadraticFalloffSlider && quadraticFalloffSpan) {
        quadraticFalloffSlider.value = quadraticFalloff * 100;
        quadraticFalloffSpan.innerHTML = quadraticFalloff.toFixed(2);
        quadraticFalloffSlider.addEventListener('input', sliderUpdate);
    }

    // Setup Light 2 controls
    xlightSlider2 = document.getElementById('xlightSlider2');
    ylightSlider2 = document.getElementById('ylightSlider2');
    zlightSlider2 = document.getElementById('zlightSlider2');
    lightPosSpan2 = document.getElementById('light-pos-span2');

    xlightSlider2.value = lightPos2[0] * 100;
    xlightSlider2.addEventListener('input', sliderUpdate);

    ylightSlider2.value = lightPos2[1] * 100;
    ylightSlider2.addEventListener('input', sliderUpdate);

    zlightSlider2.value = lightPos2[2] * 100;
    zlightSlider2.addEventListener('input', sliderUpdate);

    lightIntensitySlider2 = document.getElementById('lightIntensitySlider2');
    lightIntensitySpan2 = document.getElementById('light-intensity-span2');

    lightIntensitySlider2.value = lightIntensity2 * 100;
    lightIntensitySlider2.addEventListener('input', sliderUpdate);

    lightColorPicker2 = document.getElementById('lightColorPicker2');
    if (lightColorPicker2) {
        lightColorPicker2.value = rgbToHex(lightColor2);
        lightColorPicker2.addEventListener('input', sliderUpdate);
    }

    constantFalloffSlider2 = document.getElementById('constantFalloffSlider2');
    constantFalloffSpan2 = document.getElementById('constant-falloff-span2');
    linearFalloffSlider2 = document.getElementById('linearFalloffSlider2');
    linearFalloffSpan2 = document.getElementById('linear-falloff-span2');
    quadraticFalloffSlider2 = document.getElementById('quadraticFalloffSlider2');
    quadraticFalloffSpan2 = document.getElementById('quadratic-falloff-span2');

    if (constantFalloffSlider2 && constantFalloffSpan2) {
        constantFalloffSlider2.value = constantFalloff2 * 100;
        constantFalloffSpan2.innerHTML = constantFalloff2.toFixed(2);
        constantFalloffSlider2.addEventListener('input', sliderUpdate);
    }
    if (linearFalloffSlider2 && linearFalloffSpan2) {
        linearFalloffSlider2.value = linearFalloff2 * 100;
        linearFalloffSpan2.innerHTML = linearFalloff2.toFixed(2);
        linearFalloffSlider2.addEventListener('input', sliderUpdate);
    }
    if (quadraticFalloffSlider2 && quadraticFalloffSpan2) {
        quadraticFalloffSlider2.value = quadraticFalloff2 * 100;
        quadraticFalloffSpan2.innerHTML = quadraticFalloff2.toFixed(2);
        quadraticFalloffSlider2.addEventListener('input', sliderUpdate);
    }

    // Setup light enable checkboxes
    light1Checkbox = document.getElementById('light1-checkbox');
    light2Checkbox = document.getElementById('light2-checkbox');

    light1Checkbox.checked = light1Enabled;
    light2Checkbox.checked = light2Enabled;

    light1Checkbox.addEventListener('input', checkboxUpdate);
    light2Checkbox.addEventListener('input', checkboxUpdate);
    textureCheckbox.addEventListener('input', checkboxUpdate);

    // Setup ambient intensity slider
    ambientIntensitySlider = document.getElementById('ambientIntensitySlider');
    ambientIntensitySpan = document.getElementById('ambient-intensity-span');

    if (ambientIntensitySlider) {
        ambientIntensitySlider.value = ambientIntensity * 100;
        ambientIntensitySlider.addEventListener('input', sliderUpdate);
    }

    // Setup light map intensity slider
    lightMapIntensitySlider = document.getElementById('lightMapIntensitySlider');
    lightMapIntensitySpan = document.getElementById('lightmap-intensity-span');

    if (lightMapIntensitySlider) {
        lightMapIntensitySlider.value = lightMapIntensity * 100;
        lightMapIntensitySlider.addEventListener('input', sliderUpdate);
    }

    // Canvas interaction
    canvas.addEventListener('click', function(event) {
        updateLightFromCanvas(event);
    });
    canvas.addEventListener('mousedown', function(event) {
        canvasDrag = true;
        updateLightFromCanvas();
    });
    canvas.addEventListener('mouseup', function(event) {
        canvasDrag = false;
    });
    canvas.addEventListener('mousemove', function(event) {
        if (canvasDrag) {
            updateLightFromCanvas(event);
        }
    });
    canvas.addEventListener('mouseenter', () => { mouseInCanvas = true; });
    canvas.addEventListener('mouseout', () => { mouseInCanvas = false; });

    window.addEventListener('wheel', function(event) {
        if (mouseInCanvas) {
            event.preventDefault();
            var delta = event.deltaY / 80;
            delta = Number(zlightSlider.value) - delta;
            Math.abs(delta) > 100 ? delta > 0 ? delta = 100 : delta = -100 : delta = delta;
            zlightSlider.value = delta;
            sliderUpdate();
        }
    });

    // Initial spans and draw
    document.getElementById('loader-overlay-div').setAttribute('style', 'display: none; visibility: hidden;');
    lightPosSpan.innerHTML = '[' + lightPos[0].toFixed(2) + ', ' + lightPos[1].toFixed(2) + ', ' + lightPos[2].toFixed(2) + ']';
    lightIntensitySpan.innerHTML = lightIntensity;
    lightPosSpan2.innerHTML = '[' + lightPos2[0].toFixed(2) + ', ' + lightPos2[1].toFixed(2) + ', ' + lightPos2[2].toFixed(2) + ']';
    lightIntensitySpan2.innerHTML = lightIntensity2;
    if (ambientIntensitySpan) {
        ambientIntensitySpan.innerHTML = ambientIntensity.toFixed(2);
    }
    if (lightMapIntensitySpan) {
        lightMapIntensitySpan.innerHTML = lightMapIntensity.toFixed(2);
    }
    draw();
    setupImageSelector();
}

function updateLightFromCanvas(event) {
    if (event) {
        var rect = canvas.getBoundingClientRect();
        var x = event.offsetX;
        var y = event.offsetY;
        x = (2 * x / canvas.width) - 1;
        y = -((2 * y / canvas.height) - 1);
        
        xlightSlider.value = Math.round(x * 100);
        ylightSlider.value = Math.round(y * 100);
    }
    sliderUpdate();
}

function sliderUpdate() {
    // Light 1
    lightPos = [xlightSlider.value / 100, ylightSlider.value / 100, zlightSlider.value / 100];
    lightPosSpan.innerHTML = '[' + lightPos[0].toFixed(2) + ', ' + lightPos[1].toFixed(2) + ', ' + lightPos[2].toFixed(2) + ']';

    lightIntensity = lightIntensitySlider.value / 100;
    lightIntensitySpan.innerHTML = lightIntensity;

    if (lightColorPicker) {
        lightColor = hexToRgb(lightColorPicker.value);
    }

    if (constantFalloffSlider && constantFalloffSpan) {
        constantFalloff = constantFalloffSlider.value / 100;
        constantFalloffSpan.innerHTML = constantFalloff.toFixed(2);
    }
    if (linearFalloffSlider && linearFalloffSpan) {
        linearFalloff = linearFalloffSlider.value / 100;
        linearFalloffSpan.innerHTML = linearFalloff.toFixed(2);
    }
    if (quadraticFalloffSlider && quadraticFalloffSpan) {
        quadraticFalloff = quadraticFalloffSlider.value / 100;
        quadraticFalloffSpan.innerHTML = quadraticFalloff.toFixed(2);
    }

    // Light 2
    lightPos2 = [xlightSlider2.value / 100, ylightSlider2.value / 100, zlightSlider2.value / 100];
    lightPosSpan2.innerHTML = '[' + lightPos2[0].toFixed(2) + ', ' + lightPos2[1].toFixed(2) + ', ' + lightPos2[2].toFixed(2) + ']';

    lightIntensity2 = lightIntensitySlider2.value / 100;
    lightIntensitySpan2.innerHTML = lightIntensity2;

    if (lightColorPicker2) {
        lightColor2 = hexToRgb(lightColorPicker2.value);
    }

    if (constantFalloffSlider2 && constantFalloffSpan2) {
        constantFalloff2 = constantFalloffSlider2.value / 100;
        constantFalloffSpan2.innerHTML = constantFalloff2.toFixed(2);
    }
    if (linearFalloffSlider2 && linearFalloffSpan2) {
        linearFalloff2 = linearFalloffSlider2.value / 100;
        linearFalloffSpan2.innerHTML = linearFalloff2.toFixed(2);
    }
    if (quadraticFalloffSlider2 && quadraticFalloffSpan2) {
        quadraticFalloff2 = quadraticFalloffSlider2.value / 100;
        quadraticFalloffSpan2.innerHTML = quadraticFalloff2.toFixed(2);
    }

    // Ambient and lightmap
    if (ambientIntensitySlider && ambientIntensitySpan) {
        ambientIntensity = ambientIntensitySlider.value / 100;
        ambientIntensitySpan.innerHTML = ambientIntensity.toFixed(2);
    }
    if (lightMapIntensitySlider && lightMapIntensitySpan) {
        lightMapIntensity = lightMapIntensitySlider.value / 100;
        lightMapIntensitySpan.innerHTML = lightMapIntensity.toFixed(2);
    }

    draw();
}

function checkboxUpdate() {
    light1Enabled = light1Checkbox.checked;
    light2Enabled = light2Checkbox.checked;
    draw();
}

function init() {
    canvas = document.getElementById('canvas');
    m4 = twgl.m4;
    v3 = twgl.v3;

    gl = canvas.getContext("webgl");

    window.addEventListener('resize', setCanvasSize);
    if(!setupShaders()) {
        return false;
    }

    return true;
}

function setCanvasSize() {
    var imgSize = ImgHelper.getImageSize();
    var ratio = 0.25;
    if (window.innerWidth * ratio < imgSize[0] || window.innerHeight * ratio < imgSize[1]) {
        canvas.width = window.innerWidth * ratio;
        canvas.height = window.innerHeight * ratio;

        var aspectRatio = ImgHelper.getAspectRatio();
        var m_width = window.innerWidth * ratio;
        var m_height = m_width / aspectRatio;

        if (canvas.height > canvas.width && m_height > window.innerHeight * 0.6) {
            m_height = window.innerHeight;
            m_width = m_height * aspectRatio;
        }

        canvas.width = m_width;
        canvas.height = m_height;
    } else {
        canvas.width = imgSize[0];
        canvas.height = imgSize[1];
    }

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}

function setupShaders() {
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vs_src);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        alert("Compile Error : Vertex Shader\n" +
              "-----------------------------\n" +
              gl.getShaderInfoLog(vertexShader) + 
              "\n-----------------------------");
        return false;
    }

    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fs_src);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        alert("Compile Error : Fragment Shader\n" +
              "-------------------------------\n" +
              gl.getShaderInfoLog(fragmentShader) +
              "\n-----------------------------");
        return false;
    }

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Failed to Link Shaders");
        return false;
    }
    gl.useProgram(shaderProgram);
    return true;
}

function setupShaderAttributes() {
    shaderProgram.positionAttr = gl.getAttribLocation(shaderProgram, 'vPos');
    gl.enableVertexAttribArray(shaderProgram.positionAttr);

    shaderProgram.normalAttr = gl.getAttribLocation(shaderProgram, 'normal');
    gl.enableVertexAttribArray(shaderProgram.normalAttr);

    imgBuffer.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, imgBuffer.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh, gl.STATIC_DRAW);
    imgBuffer.positionBuffer.itemSize = 3;
    imgBuffer.positionBuffer.numItems  = mesh.length / imgBuffer.positionBuffer.itemSize;

    imgBuffer.normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, imgBuffer.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
    imgBuffer.normalBuffer.itemSize = 3;
    imgBuffer.normalBuffer.numItems = normals.length / imgBuffer.normalBuffer.itemSize;

    imgBuffer.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, imgBuffer.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, document.getElementById('src-tex-img'));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    imgBuffer.normalTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, imgBuffer.normalTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, document.getElementById('src-normal-img'));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    imgBuffer.lightMapTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, imgBuffer.lightMapTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, document.getElementById('src-lightmap-img'));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    shaderProgram.imgSizeUnif = gl.getUniformLocation(shaderProgram, 'imgSize');
    shaderProgram.minMaxZUnif = gl.getUniformLocation(shaderProgram, 'minMaxZ');
    shaderProgram.lightPos = gl.getUniformLocation(shaderProgram, 'lightPos');
    shaderProgram.texSampler = gl.getUniformLocation(shaderProgram, 'texSampler');
    shaderProgram.normalSampler = gl.getUniformLocation(shaderProgram, 'normalSampler');
    shaderProgram.lightMapSampler = gl.getUniformLocation(shaderProgram, 'lightMapSampler');
    shaderProgram.lightIntensity = gl.getUniformLocation(shaderProgram, 'lightIntensity');
    shaderProgram.ambientIntensity = gl.getUniformLocation(shaderProgram, 'ambientIntensity');
    shaderProgram.lightMapIntensity = gl.getUniformLocation(shaderProgram, 'lightMapIntensity');
    shaderProgram.lightColorUnif = gl.getUniformLocation(shaderProgram, 'u_lightColor');
    shaderProgram.constantFalloffUnif = gl.getUniformLocation(shaderProgram, 'u_constantFalloff');
    shaderProgram.linearFalloffUnif = gl.getUniformLocation(shaderProgram, 'u_linearFalloff');
    shaderProgram.quadraticFalloffUnif = gl.getUniformLocation(shaderProgram, 'u_quadraticFalloff');

    // Light 2 uniforms
    shaderProgram.lightPos2 = gl.getUniformLocation(shaderProgram, 'lightPos2');
    shaderProgram.lightIntensity2 = gl.getUniformLocation(shaderProgram, 'lightIntensity2');
    shaderProgram.lightColorUnif2 = gl.getUniformLocation(shaderProgram, 'u_lightColor2');
    shaderProgram.constantFalloffUnif2 = gl.getUniformLocation(shaderProgram, 'u_constantFalloff2');
    shaderProgram.linearFalloffUnif2 = gl.getUniformLocation(shaderProgram, 'u_linearFalloff2');
    shaderProgram.quadraticFalloffUnif2 = gl.getUniformLocation(shaderProgram, 'u_quadraticFalloff2');

    // Enabled state uniforms
    shaderProgram.u_light1Enabled = gl.getUniformLocation(shaderProgram, 'u_light1Enabled');
    shaderProgram.u_light2Enabled = gl.getUniformLocation(shaderProgram, 'u_light2Enabled');
    shaderProgram.u_textureEnabled = gl.getUniformLocation(shaderProgram, 'u_textureEnabled');

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

function draw() {
    gl.clearColor(0, 0, 0, 1);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, imgBuffer.positionBuffer);
    gl.vertexAttribPointer(shaderProgram.positionAttr, imgBuffer.positionBuffer.itemSize, 
        gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, imgBuffer.normalBuffer);
    gl.vertexAttribPointer(shaderProgram.normalAttr, imgBuffer.normalBuffer.itemSize, 
        gl.FLOAT, false, 0, 0);

    gl.bindTexture(gl.TEXTURE_2D, imgBuffer.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, document.getElementById('src-tex-img'));

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, imgBuffer.normalTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, document.getElementById('src-normal-img'));

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, imgBuffer.lightMapTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, document.getElementById('src-lightmap-img'));

    gl.uniform2fv(shaderProgram.imgSizeUnif, new Float32Array(ImgHelper.getImageSize()));
    gl.uniform2fv(shaderProgram.minMaxZUnif, new Float32Array([ImgHelper.minZ, ImgHelper.maxZ]));
    gl.uniform3fv(shaderProgram.lightPos, new Float32Array(lightPos));
    gl.uniform1i(shaderProgram.texSampler, 0);
    gl.uniform1i(shaderProgram.normalSampler, 1);
    gl.uniform1i(shaderProgram.lightMapSampler, 2);
    gl.uniform1f(shaderProgram.lightIntensity, lightIntensity);
    gl.uniform1f(shaderProgram.ambientIntensity, ambientIntensity);
    gl.uniform1f(shaderProgram.lightMapIntensity, lightMapIntensity);
    gl.uniform3fv(shaderProgram.lightColorUnif, new Float32Array(lightColor));
    gl.uniform1f(shaderProgram.constantFalloffUnif, constantFalloff);
    gl.uniform1f(shaderProgram.linearFalloffUnif, linearFalloff);
    gl.uniform1f(shaderProgram.quadraticFalloffUnif, quadraticFalloff);

    // Pass Light 2 uniforms
    gl.uniform3fv(shaderProgram.lightPos2, new Float32Array(lightPos2));
    gl.uniform1f(shaderProgram.lightIntensity2, lightIntensity2);
    gl.uniform3fv(shaderProgram.lightColorUnif2, new Float32Array(lightColor2));
    gl.uniform1f(shaderProgram.constantFalloffUnif2, constantFalloff2);
    gl.uniform1f(shaderProgram.linearFalloffUnif2, linearFalloff2);
    gl.uniform1f(shaderProgram.quadraticFalloffUnif2, quadraticFalloff2);

    // Pass enabled state uniforms
    gl.uniform1i(shaderProgram.u_light1Enabled, light1Enabled);
    gl.uniform1i(shaderProgram.u_light2Enabled, light2Enabled);
    gl.uniform1i(shaderProgram.u_textureEnabled, textureCheckbox.checked);

    gl.drawArrays(gl.TRIANGLES, 0, imgBuffer.positionBuffer.numItems);
}

function setupImageSelector() {
    var selector = document.getElementById('image-select');

    for (var i = 0; i < images.img.length; i++) {
        var option = document.createElement('option');
        option.text = images.img[i]; 
        option.value = i;

        if (imgIdx == i) {
            option.selected = true;
        }
        
        selector.add(option, i);
    }

    var reloadButton = document.getElementById('reload-button');
    reloadButton.addEventListener('click', function() {
        var selectedIdx = selector.selectedIndex;
        var selectedOption = selector.options[selectedIdx];

        window.location.href = window.location.href.split('?')[0] + '?' + selectedOption.value;
    });
}

function hexToRgb(hex) {
    let r = 0, g = 0, b = 0;
    if (hex.length == 4) {
        r = "0x" + hex[1] + hex[1];
        g = "0x" + hex[2] + hex[2];
        b = "0x" + hex[3] + hex[3];
    } else if (hex.length == 7) {
        r = "0x" + hex[1] + hex[2];
        g = "0x" + hex[3] + hex[4];
        b = "0x" + hex[5] + hex[6];
    }
    return [Number(r)/255, Number(g)/255, Number(b)/255];
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(rgbArr) {
    const r = Math.round(rgbArr[0] * 255);
    const g = Math.round(rgbArr[1] * 255);
    const b = Math.round(rgbArr[2] * 255);
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}