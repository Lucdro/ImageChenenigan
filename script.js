const canvas_input = document.getElementById('canvas_input');
canvas_input.will
const canvas_output = document.getElementById('canvas_output');
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
const image = new Image();
var output;
var output_update;
var lastOperation;
var rGain = 0;
var gGain = 0;
var bGain = 0;
var aGain = 0;

var invertcolor = false;
var allcolors = false;

const ratio = 16/9;
const canvasW = 0.4;

canvas_input.width = canvas_output.width = window.innerWidth * canvasW;
canvas_input.height = canvas_output.height = (window.innerWidth/ratio) * canvasW;

var imgStart_X = 0;
var imgStart_Y = 0;
var scaled_W = 0;
var scaled_H = 0;

var dif_min = 10;
var search_radius = 1;

window.addEventListener('load', function() {
    setDefaults();
    window.addEventListener("resize", function () {
        canvas_input.width = canvas_output.width = window.innerWidth * canvasW;
        canvas_input.height = canvas_output.height = (window.innerWidth/ratio) * canvasW;
        drawImageScaled(image,canvas_input.getContext('2d'));
        this.clearTimeout(output_update);
        output_update = this.setTimeout(lastOperation, 2000)
    });
    image.addEventListener('load', function(){
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.clearRect(0,0,canvas.width, canvas.height);
        ctx.drawImage(image, 0,0, image.width, image.height);

        drawImageScaled(image,canvas_input.getContext('2d'));
        if(lastOperation) lastOperation();
    });
    document.getElementById('getimg')?.addEventListener('change', function(e){
        image.src = URL.createObjectURL(e.target.files[0]);
    });
    document.getElementById('getimg')?.addEventListener('drop', function(e){
        preventDefaults(e);
        if(e.dataTransfer.items){
            image.src = URL.createObjectURL(e.dataTransfer.items[0].getAsFile());
        }
    })
    this.document.getElementById('outIn')?.addEventListener('click', function(){
        if(!output) return;
        const tempCanvas = document.createElement('canvas');
        const tempctx = tempCanvas.getContext('2d');
        tempCanvas.width = output.width;
        tempCanvas.height = output.height;
        tempctx.putImageData(output,0,0);
        image.src = tempCanvas.toDataURL();
    });
    this.document.getElementById('edgeDetection')?.addEventListener('click', edgeDetection);
    this.document.getElementById('edgeDetection2')?.addEventListener('click', edgeDetection2);
    this.document.getElementById('edgeDetectionHSL')?.addEventListener('click', edgeDetectionHSL);
    this.document.getElementById('grayscale')?.addEventListener('click', grayscale);
    this.document.getElementById('quantization')?.addEventListener('click', colorQuantization);
    this.document.getElementById('colorSpread')?.addEventListener('click', colorSpread);
    this.document.getElementById('colorBlobbing')?.addEventListener('click', colorBlobbing);
    this.document.getElementById('colorBlobbingScaled')?.addEventListener('click', colorBlobbingScaled);
    this.document.getElementById('styleLumination')?.addEventListener('click', styleLumination);
    this.document.getElementById('download')?.addEventListener('click', download);
    this.document.getElementById('alterValues')?.addEventListener('click', alterValues);
    this.document.getElementById('defaultValues')?.addEventListener('click', setDefaults);
    this.document.getElementById('red')?.addEventListener('change', function(e){
        rGain = (e.target.value - 50) * 0.02;
        if(lastOperation) lastOperation();
    });
    this.document.getElementById('green')?.addEventListener('change', function(e){
        gGain = (e.target.value - 50) * 0.02;
        if(lastOperation) lastOperation();
    });
    this.document.getElementById('blue')?.addEventListener('change', function(e){
        bGain = (e.target.value - 50) * 0.02;
        if(lastOperation) lastOperation();
    });
    this.document.getElementById('alpha')?.addEventListener('change', function(e){
        aGain = (e.target.value - 50) * 0.02;
        if(lastOperation) lastOperation();
    });
    this.document.getElementById('invertColor')?.addEventListener('change', function(e){
        invertcolor = e.target.checked; 
        if(lastOperation) lastOperation();
    });
    this.document.getElementById('allColors')?.addEventListener('change', function(e){
        allcolors = e.target.checked; 
        if(lastOperation) lastOperation();
    });
    canvas_output.addEventListener('click', fullimage_output);
    canvas_input.addEventListener('click', fullimage_input);
    document.getElementById('fullscreenwrapper').addEventListener('click', function(e){
        let wrapper = document.getElementById('fullscreenwrapper');
        wrapper.classList.remove('visible');
        wrapper.classList.add('invisible');
    });
});
function preventDefaults(e){
    e.preventDefault();
    e.stopPropagation();
}
function setDefaults(){
    document.getElementById('allColors').checked = allcolors = true;
    document.getElementById('invertColor').checked = invertcolor = false;
    dif_min = 30;
    search_radius = 4;
    document.getElementById('red').value = 50;
    rGain = 0;
    document.getElementById('green').value = 50;
    gGain = 0;
    document.getElementById('blue').value = 50;
    bGain = 0;
    document.getElementById('alpha').value = 50;
    aGain = 0;
    if(lastOperation) lastOperation();
}

function alterValues(){
    dif_min = prompt('Contrast:',dif_min);
    search_radius = prompt('Line Width:', search_radius);
    if(lastOperation) lastOperation();
}

function fullimage_output(){
    if(!output) return;
    let wrapper = document.getElementById('fullscreenwrapper');
    const tempCanvas = document.createElement('canvas');
    const tempctx = tempCanvas.getContext('2d');
    wrapper?.classList.add('visible');
    wrapper?.classList.remove('invisible');
    tempCanvas.width = output.width;
    tempCanvas.height = output.height;
    tempctx.putImageData(output,0,0);
    document.getElementById('fullscreen_img').src = tempCanvas.toDataURL();

}function fullimage_input(){
    if(!image.src) return;
    let wrapper = document.getElementById('fullscreenwrapper');
    wrapper?.classList.add('visible');
    wrapper?.classList.remove('invisible');
    document.getElementById('fullscreen_img').src = image.src;
}
function edgeDetection2(){
    const scannedImage = ctx?.getImageData(0,0,canvas.width,canvas.height);
    const imageData = scannedImage.data;
    const color1 = invertcolor ? 255 : 0;
    const color2 = invertcolor ? 0 : 255;
    const edgeImage = new Uint8ClampedArray(imageData.length);
    for(let i = 0; i < imageData.length; i += 4){
        const surMax = getSUrroundingMaximus(imageData,i,scannedImage.width,scannedImage.height,search_radius)
        const r = (surMax[0] - imageData[i]) * (1 + rGain);
        const g = (surMax[1] - imageData[i + 1]) * (1 + gGain);
        const b = (surMax[2] - imageData[i + 2]) * (1 + bGain);
        const a = (surMax
            [3] - imageData[i + 3]) * (1 + aGain);
        
        let condition;
        if(allcolors){
            condition = (r + g + b + a) >= dif_min;
        }else{
            condition = Math.abs(r) >= dif_min || Math.abs(g) >= dif_min || Math.abs(b) >= dif_min 
        }
        if(condition){
            edgeImage[i] = color1;
            edgeImage[i + 1] = color1;
            edgeImage[i + 2] = color1;
            //console.log(surMax,[imageData[i],imageData[i+1],imageData[i+2],imageData[i+3]])
        }
        else{
            edgeImage[i] = color2;
            edgeImage[i + 1] = color2;
            edgeImage[i + 2] = color2;
        }
        edgeImage[i + 3] = 255;
    }
    output = new ImageData(edgeImage,scannedImage.width,scannedImage.height)
    
    outPutImage();
    lastOperation = edgeDetection2;
}
function RGBToHSL (r, g, b){
    r *= rGain+1
    g *= gGain+1
    b *= bGain+1
    r = Math.min(Math.max(r,0),255)
    g = Math.min(Math.max(g,0),255)
    b = Math.min(Math.max(b,0),255)
    r /= 255;
    g /= 255;
    b /= 255;
    const l = Math.max(r, g, b);
    const s = l - Math.min(r, g, b);
    const h = s
      ? l === r
        ? (g - b) / s
        : l === g
        ? 2 + (b - r) / s
        : 4 + (r - g) / s
      : 0;
    return [
      60 * h < 0 ? 60 * h + 360 : 60 * h,
      100 * (s ? (l <= 0.5 ? s / (2 * l - s) : s / (2 - (2 * l - s))) : 0),
      (100 * (2 * l - s)) / 2,
    ];
}
function edgeDetectionHSL(){
    const scannedImage = ctx?.getImageData(0,0,canvas.width,canvas.height);
    const imageData = scannedImage.data;
    const color1 = invertcolor ? 255 : 0;
    const color2 = invertcolor ? 0 : 255;
    const edgeImage = new Uint8ClampedArray(imageData.length);
    for(let i = 0; i < imageData.length; i += 4){
        const surMax = getSUrroundingMaximusHSL(imageData,i,scannedImage.width,scannedImage.height,search_radius)
        if(surMax >= dif_min){
            edgeImage[i] = color1;
            edgeImage[i + 1] = color1;
            edgeImage[i + 2] = color1;
            //console.log(surMax,[imageData[i],imageData[i+1],imageData[i+2],imageData[i+3]])
        }
        else{
            edgeImage[i] = color2;
            edgeImage[i + 1] = color2;
            edgeImage[i + 2] = color2;
        }
        edgeImage[i + 3] = 255;
    }
    output = new ImageData(edgeImage,scannedImage.width,scannedImage.height)
    
    outPutImage();
    lastOperation = edgeDetectionHSL;
}
function getSUrroundingMaximusHSL(imagedata,index,w,h,radius){
    const rowLength = (1 + radius * 2) * 4;
    const nextLine = w * 4
    var inicialI = index - radius * 4 - nextLine * radius;
    var finalI =  index + radius * 4 + nextLine * radius;
    //Force inicial and final to valid points
    inicialI = Math.max(inicialI,0);
    finalI = Math.min(finalI, w * h * 4)
    const centralPixel = RGBToHSL(imagedata[index],imagedata[index+1],imagedata[index+2]);// * imagedata[index+3]/255
    var surMax = RGBToHSL(imagedata[inicialI],imagedata[inicialI+1],imagedata[inicialI+2]);
    var maxDif = Math.abs(surMax[0] - centralPixel[0]);
    inicialI += 4;
    for(let y = inicialI; y < finalI; y += nextLine){
        for(let x = y; x < y + rowLength && x < finalI; x+=4){
            if(x == index)  continue;
            var current = RGBToHSL(imagedata[index],imagedata[index+1],imagedata[index+2]);
            var dif = Math.abs(current[0] - centralPixel[0]);
            if(dif > maxDif){
                maxDif = dif;
                surMax = current;
            }   
        }
    }
    return maxDif;
}
function getSUrroundingMaximus(imagedata,index,w,h,radius){
    const rowLength = (1 + radius * 2) * 4;
    const nextLine = w * 4
    var inicialI = index - radius * 4 - nextLine * radius;
    var finalI =  index + radius * 4 + nextLine * radius;
    //Force inicial and final to valid points
    inicialI = Math.max(inicialI,0);
    finalI = Math.min(finalI, w * h * 4)
    var surMax = [imagedata[inicialI],imagedata[inicialI+1],imagedata[inicialI+2],imagedata[inicialI+3]];
    inicialI += 4;
    const centralPixel = [imagedata[index],imagedata[index+1],imagedata[index+2],imagedata[index+3]];
    // let pixelIndex = 0;
    // for(let y = inicialI; y < finalI; y += nextLine){
    //     for(let x = y; x < y + rowLength && x < finalI; x++){
    //         if(x == index){x += 3; continue;}
            
    //         if(Math.abs(imagedata[x] - centralPixel[pixelIndex]) > Math.abs(surMax[pixelIndex] - centralPixel[pixelIndex])){
    //             surMax[pixelIndex] = imagedata[x];
    //         }   
            
    //         pixelIndex++;
    //         if(pixelIndex > 3) pixelIndex = 0;
    //     }
    // }
    var maxDif = 0;
    for(let y = inicialI; y < finalI; y += nextLine){
        for(let x = y; x < y + rowLength && x < finalI; x+=4){
            if(x == index)  continue;
            var dif =   Math.abs(imagedata[x] - centralPixel[0]) +
                        Math.abs(imagedata[x+1] - centralPixel[1])+
                        Math.abs(imagedata[x+2] - centralPixel[2])+
                        Math.abs(imagedata[x+3] - centralPixel[3])
            if(dif > maxDif){
                maxDif = dif;
                surMax = [imagedata[x],imagedata[x+1],imagedata[x+2],imagedata[x+3]];
            }   
        }
    }
    return surMax;
}

function colorQuantization(){
    const scannedImage = ctx?.getImageData(0,0,canvas.width,canvas.height);
    const imageData = scannedImage.data;
    const quantizazas = new Uint8ClampedArray(imageData.length);
    const divNumb = Math.floor(256/dif_min)
    let pixelIndex = 0;
    for(let i = 0; i < imageData.length; i += 1){
        if(pixelIndex == 3) 
            quantizazas[i] = 255;
        else
            quantizazas[i] = Math.floor(imageData[i]/divNumb)*divNumb;
        pixelIndex++;
        if(pixelIndex > 3) pixelIndex = 0;
    }
    output = new ImageData(quantizazas,scannedImage.width,scannedImage.height)
    
    outPutImage();
    lastOperation = colorQuantization;
}
function colorBlobbing(){
    const scannedImage = ctx?.getImageData(0,0,canvas.width,canvas.height);
    const imageData = scannedImage.data;
    const out = new Uint8ClampedArray(imageData.length);
    for(let i = 0; i < imageData.length; i += 4){
        const mostCommon = surroundingMostCommon(imageData,i,canvas.width,canvas.height,search_radius);
        out[i] = mostCommon[0];
        out[i+1] = mostCommon[1];
        out[i+2] = mostCommon[2];
        out[i+3] = 255//mostCommon[3];
    }
    
    output = new ImageData(out,canvas.width,canvas.height);
    
    outPutImage();
    lastOperation = colorBlobbing;
}
function colorBlobbingScaled(){
    const scannedImage = ctx?.getImageData(0,0,canvas.width,canvas.height);
    const smolImg = Scale(scannedImage,640,360);
    const smolData = smolImg.data;
    const smolOut = new Uint8ClampedArray(smolData.length);
    for(let i = 0; i < smolData.length; i += 4){
        const mostCommon = surroundingMostCommon(smolData,i,smolImg.width,smolImg.height,search_radius);
        smolOut[i] = mostCommon[0];
        smolOut[i+1] = mostCommon[1];
        smolOut[i+2] = mostCommon[2];
        smolOut[i+3] = 255//mostCommon[3];
    }
    
    output = Scale(new ImageData(smolOut,smolImg.width,smolImg.height),scannedImage.width,scannedImage.height);
    
    outPutImage();
    lastOperation = colorBlobbingScaled;
}

function surroundingMostCommon(imagedata,index,w,h,radius,includecenter = false){
    const rowLength = (1 + radius * 2) * 4;
    const nextLine = w * 4
    var inicialI = index - radius * 4 - nextLine * radius;
    var finalI =  index + radius * 4 + nextLine * radius;
    //Force inicial and final to valid points
    inicialI = Math.max(inicialI,0);
    finalI = Math.min(finalI, w * h * 4)
    let pixelIndex = 0;
    const colors = []
    for(let y = inicialI; y < finalI; y += nextLine){
        for(let x = y; x < y + rowLength && x < finalI; x += 4){
            if (x == index && !includecenter){continue;}

            const pixel = [imagedata[x],imagedata[x+1],imagedata[x+2],imagedata[x+3]];
            const existing = colors.find((o) => luminanceDiference(o.color,pixel) <= dif_min);
            if(existing === undefined){
                colors.push(
                    {
                        color:pixel,
                        count:1
                    })
            }
            else{existing.count++}

            if(pixelIndex > 3) {pixelIndex = 0};
            pixelIndex++;
        }
    }
    var mostCommon;
    colors.forEach(color => {
        if(mostCommon === undefined || color.count > mostCommon.count){
            mostCommon = color;
        }
    })
    return mostCommon.color;
}

function luminanceDiference(a,b){
    return Math.abs((a[0]+a[1]+a[2]+a[3])-(b[0]+b[1]+b[2]+b[3]))
}

function colorDiference(a,b){
    return [
        Math.abs(a[0]-b[0]),
        Math.abs(a[1]-b[1]),
        Math.abs(a[2]-b[2]),
        Math.abs(a[3]-b[3])
    ]
}

function edgeDetection(){
    const scannedImage = ctx?.getImageData(0,0,canvas.width,canvas.height);
    const imageData = scannedImage.data;
    const color1 = invertcolor ? 255 : 0;
    const color2 = invertcolor ? 0 : 255;
    const edgeImage = new Uint8ClampedArray(imageData.length);
    for(let i = 0; i < imageData.length; i += 4){
        const avarage = surroundingAvarage(imageData,i,scannedImage.width,scannedImage.height,search_radius);

        const r = (avarage[0] - imageData[i]) * (1 + rGain);
        const g = (avarage[1] - imageData[i + 1]) * (1 + gGain);
        const b = (avarage[2] - imageData[i + 2]) * (1 + bGain);
        const a = (avarage[3] - imageData[i + 3]) * (1 + aGain);
        
        let condition;
        if(allcolors){
            condition = (r + g + b + a) >= dif_min;
        }else{
            condition = Math.abs(r) >= dif_min || Math.abs(g) >= dif_min || Math.abs(b) >= dif_min 
        }
        if(condition){
            edgeImage[i] = color1;
            edgeImage[i + 1] = color1;
            edgeImage[i + 2] = color1;
        }
        else{
            edgeImage[i] = color2;
            edgeImage[i + 1] = color2;
            edgeImage[i + 2] = color2;
        }
        edgeImage[i + 3] = 255;
    }
    output = new ImageData(edgeImage,scannedImage.width,scannedImage.height)
    
    outPutImage();
    lastOperation = edgeDetection;
}

function grayscale(){
    const scannedImage = ctx?.getImageData(0,0,canvas.width,canvas.height);
    const imageData = scannedImage.data;
    const novaimagem = new Uint8ClampedArray(imageData.length);
    for(let i = 0; i < imageData.length; i += 4){
        const avarage = (imageData[i] * (1 + rGain) + imageData[i + 1] * (1 + gGain) + imageData[i + 2] * (1 + bGain))/3;
        novaimagem[i] = avarage;
        novaimagem[i + 1] = avarage;
        novaimagem[i + 2] = avarage;
        novaimagem[i + 3] = 255;
    }
    output = new ImageData(novaimagem,scannedImage.width,scannedImage.height)
    
    outPutImage();
    lastOperation = grayscale;
}

function colorSpread(){
    const scannedImage = ctx?.getImageData(0,0,canvas.width,canvas.height);
    const imageData = scannedImage.data;
    const novaimagem = new Uint8ClampedArray(imageData.length);
    for(let i = 0; i < imageData.length; i += 4){
        spreadcolor(novaimagem, [imageData[i],imageData[i+1],imageData[i+2],imageData[i+3]],i,search_radius,true);
    }
    output = new ImageData(novaimagem,scannedImage.width,scannedImage.height)
    outPutImage();
    lastOperation = colorSpread;
}
function styleLumination(){
    const scannedImage = ctx?.getImageData(0,0,canvas.width,canvas.height);
    const imageData = scannedImage.data;
    const novaimagem = new Uint8ClampedArray(imageData.length);
    for(let i = 0; i < imageData.length; i += 4){
        const hsl = RGBToHSL(imageData[i],imageData[i+1],imageData[i+2]);
        if(hsl[2] < 20){
            novaimagem[i] = imageData[i];
            novaimagem[i+1] = imageData[i+1];
            novaimagem[i+2] = addColor(imageData[i+2],40*(1+bGain));
            novaimagem[i+3] = imageData[i+3];
        }else if(hsl[2] > 50){
            novaimagem[i] = addColor(imageData[i],40 * (1+rGain));
            novaimagem[i+1] = imageData[i+1];
            novaimagem[i+2] = imageData[i+2];
            novaimagem[i+3] = imageData[i+3];
        }else{
            novaimagem[i] = imageData[i];
            novaimagem[i+1] = imageData[i+1];
            novaimagem[i+2] = imageData[i+2];
            novaimagem[i+3] = imageData[i+3];
        }
    }
    output = new ImageData(novaimagem,scannedImage.width,scannedImage.height)
    outPutImage();
    lastOperation = styleLumination;
}

function HSLToRGB(h, s, l){
    s /= 100;
    l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n =>
      l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [255 * f(0), 255 * f(8), 255 * f(4)];
  };

function spreadcolor(destination, pixel, index, radius,includecenter = true){
    radius--;
    const w = canvas.width;
    const h = canvas.height;
    let pixelcount = index/4;
    const centerY = Math.floor(pixelcount/w);
    const centerX = pixelcount - centerY * w;
    const finalY = centerY + radius;
    const finalX = centerX + radius;
    const area = (1 + radius + radius)**2;
    const r = (pixel[0]/area) * (1 + rGain);
    const g = (pixel[1]/area) * (1 + gGain);
    const b = (pixel[2]/area) * (1 + bGain);
    const a = (pixel[3]/area) * (1 + aGain);
    // const r = pixel[0];
    // const g = pixel[1];
    // const b = pixel[2];
    // const a = pixel[3];
    for(let y = centerY - radius; y < h && y <= finalY; y++){
        if(y < 0) continue;
        for(let x = centerX - radius ; x < w && x <= finalX; x++){
            if(x < 0) continue;
            if((centerX == x && centerY == y) && !includecenter) continue;
            const i = (y * w + x) * 4;
            destination[i] = addColor(destination[i],r);
            destination[i+1] = addColor(destination[i+1],g);
            destination[i+2] = addColor(destination[i+2],b);
            destination[i+3] = addColor(destination[i+3],a);;
        }
    }
}

function addColor(a,b){
    return Math.max(0,Math.min(255, a + b));
}

function outPutImage(){
    const scaled = Scale(output, canvas_output.width, canvas_output.height);
    const ctx_out = canvas_output.getContext('2d');
    ctx_out.clearRect(0,0,canvas_output.width, canvas_output.height);
    const img = new Image();
    const tempCanvas = document.createElement('canvas');
    const tempctx = tempCanvas.getContext('2d');
    tempCanvas.width = scaled.width;
    tempCanvas.height = scaled.height;
    tempctx.putImageData(scaled,0,0);
    img.src = tempCanvas.toDataURL();
    img.addEventListener('load', function(){
        ctx_out.drawImage(img, 0,0, img.width, img.height,
        imgStart_X,imgStart_Y, scaled_W, scaled_H);  
        var a = document.getElementById('download'); //Create <a>
        a.href = img.src; //Image Base64 Goes here
        a.download = "Image.png"; //File name Here
    })
}

function download(){
    
}

function Scale(imagedata,nw,nh){
    const data = imagedata.data;
    const ow = imagedata.width;
    const oh = imagedata.height;
    const jx = ow/nw; 
    const jy = oh/nh;
    const newImage = new Uint8ClampedArray(nw*nh*4);
    const nextLine = nw * 4
    for(let y = 0, row = 0; row < nh; y += nextLine, row++){
        const limX = y + nextLine;
        const mapRow = Math.min(Math.round(jy * row), oh);
        for(let x = y, pixel = 0; x < limX; x += 4, pixel++){
            var closestIndex = mapRow*ow + Math.round(pixel * jx);
            closestIndex *= 4
            newImage[x] = data[closestIndex];
            newImage[x + 1] = data[closestIndex + 1];
            newImage[x + 2] = data[closestIndex + 2];
            newImage[x + 3] = data[closestIndex + 3];
        }
    }
    return new ImageData(newImage,nw,nh);
}

function surroundingAvarage(imagedata,index,w,h,radius,includecenter = false){
    const rowLength = (1 + radius * 2) * 4;
    const nextLine = w * 4
    var inicialI = index - radius * 4 - nextLine * radius;
    var finalI =  index + radius * 4 + nextLine * radius;
    //Force inicial and final to valid points
    inicialI = Math.max(inicialI,0);
    finalI = Math.min(finalI, w * h * 4)
    const avaragePixel = [0,0,0,0];
    let pixelIndex = 0;
    let pixelCount = 0;
    for(let y = inicialI; y < finalI; y += nextLine){
        for(let x = y; x < y + rowLength && x < finalI; x++){
            if(pixelIndex >= 4) {
                pixelIndex = 0;
                pixelCount++;
            };
            if (x == index && !includecenter){
                x += 3;
                continue;
            }
            avaragePixel[pixelIndex] += imagedata[x];
            pixelIndex++;
        }
    }
    if(pixelIndex == 3) pixelCount++;
    avaragePixel[0] = avaragePixel[0]/pixelCount;
    avaragePixel[1] = avaragePixel[1]/pixelCount;
    avaragePixel[2] = avaragePixel[2]/pixelCount;
    avaragePixel[3] = avaragePixel[3]/pixelCount;
    return avaragePixel;
}

function drawImageScaled(img, ctx) {
    var canvas = ctx.canvas ;
    var hRatio = canvas.width  / img.width    ;
    var vRatio =  canvas.height / img.height  ;
    var ratio  = Math.min ( hRatio, vRatio );
    scaled_W = img.width*ratio;
    scaled_H = img.height*ratio;
    imgStart_X = ( canvas.width - scaled_W ) / 2;
    imgStart_Y = ( canvas.height - scaled_H ) / 2;  


    ctx.clearRect(0,0,canvas.width, canvas.height);
    ctx.drawImage(img, 0,0, img.width, img.height,
        imgStart_X,imgStart_Y, scaled_W, scaled_H);  
}

function getSurroundingPixels(imagedata,index,w,h,radius){
    const surroundingPixels = [];

    const rowLength = (1 + radius * 2) * 4;
    const nextLine = w * 4

    var inicialI = index - radius * 4 - nextLine * radius;
    var finalI =  index + radius * 4 + nextLine * radius;
    //Force inicial and final to valid points
    inicialI = Math.max(inicialI,0);
    finalI = Math.min(finalI, w * h * 4)

    for(let y = inicialI; y < finalI; y += nextLine){
        for(let x = y; x < y + rowLength && x < finalI; x++){
            if (x == index){
                x += 3;
                continue;
            }
            surroundingPixels.push(imagedata[x]);
        }
    }
    
    return surroundingPixels;
}