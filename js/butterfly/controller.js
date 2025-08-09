//Copyright (C) 2025 Guillaume P. Hérault (https://github.com/LucasNTT/LucasNTT.github.io)
//
//Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal
//in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following condition:
//
//The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
function ControllerFFT() {
    canvas.reInit();
}

ControllerFFT.prototype.initialize = function (diagrams) {
	this.diagrams = diagrams;

	this.globalIndex = 0;
	for (var i = 0; i < diagrams.length; i++) {
		diagrams[i].steps = []; // add a step array to each diagram
        if (diagrams[i].log_N === undefined) {
            diagrams[i].log_N = params.log_N;
            if (diagrams[i].length == "N1") {
                diagrams[i].log_N = params.log_N >> 1;
            }
            if (diagrams[i].length == "N2") {
                diagrams[i].log_N = params.log_N - (params.log_N >> 1);
            }
        }
        diagrams[i].N = Math.pow(2, diagrams[i].log_N);
		switch (diagrams[i].pattern) {
            case 'FFT':
                if (diagrams[i].radix === undefined) {
                    diagrams[i].radix = 2;
                }
                if (diagrams[i].w === undefined) {
                    diagrams[i].w = params.w.modPow(Math.pow(2, params.log_N - diagrams[i].log_N), params.p);
                }
                else {
                    diagrams[i].w = bigInt(diagrams[i].w);
                }
                if (diagrams[i].transposed === undefined) {
                    diagrams[i].transposed = false;
                }
                diagrams[i].log_radix = Math.log2(diagrams[i].radix);
                if (diagrams[i].w.notEquals(0) && diagrams[i].w.modPow(diagrams[i].N, params.p).notEquals(1)) {
                    alert('This w is not a primitive N-th root of unity');
                    return false;
                }
                if (diagrams[i].log_radix !== parseInt(diagrams[i].log_radix, 10)) {
                    alert('Invalid radix! Please choose a power-of-two radix.');
                    return false;
                }
                if (diagrams[i].log_radix > diagrams[i].log_N) {
                    alert('Invalid radix! Please choose a smaller radix or a larger N.');
                    return false;
                }
                if (diagrams[i].log_N % diagrams[i].log_radix != 0) {
                    alert('Invalid length with this radix! Please choose a length which is a power of the radix.');
                    return false;
                }
                var strideIn;
                var strideOut;
                switch (diagrams[i].strideIn) {
                    case 'Up':
                    case 'Min': strideIn = 0; break;
                    case 'Down':
                    case 'Max': strideIn = diagrams[i].log_N - diagrams[i].log_radix; break;
                }
                switch (diagrams[i].strideOut) {
                    case 'Up':
                    case 'Min': strideOut = 0; break;
                    case 'Down':
                    case 'Max': strideOut = diagrams[i].log_N - diagrams[i].log_radix; break;
                }
                for (var j = 0; j < diagrams[i].log_N / this.diagrams[i].log_radix; j++) {
                    var step = this.add(FFTStep, diagrams[i]);
                    step.strideIn = diagrams[i].transposed ? strideIn + params.log_N - diagrams[i].log_N : strideIn;
                    step.strideOut = diagrams[i].transposed ? strideOut + params.log_N - diagrams[i].log_N : strideOut;
                    if (diagrams[i].strideIn == 'Up') strideIn += diagrams[i].log_radix;
                    if (diagrams[i].strideIn == 'Down') strideIn -= diagrams[i].log_radix;
                    if (diagrams[i].strideOut == 'Up') strideOut += diagrams[i].log_radix;
                    if (diagrams[i].strideOut == 'Down') strideOut -= diagrams[i].log_radix;
                }

				break;
			case 'Bit-Reversal':
            case 'Divide by N':
            case 'Square':
                this.add(Step, diagrams[i]);
                break;
            case 'Butterfly':
                this.add(ButterflyStep, diagrams[i]);
                break;
            case 'Factor':
            case 'Transpose':
                if (diagrams[i].length == "N1") {
                    diagrams[i].log_N1 = params.log_N >> 1;
                    diagrams[i].log_N2 = params.log_N - (params.log_N >> 1);
                }
                if (diagrams[i].length == "N2") {
                    diagrams[i].log_N1 = params.log_N - (params.log_N >> 1);
                    diagrams[i].log_N2 = params.log_N >> 1;
                }
                if (diagrams[i].log_N1 === undefined) {
                    diagrams[i].log_N1 = params.log_N - (params.log_N >> 1);
                    if (diagrams[i].width == "N1") {
                        diagrams[i].log_N1 = params.log_N >> 1;
                    }
                }
                if (diagrams[i].log_N2 === undefined) {
                    diagrams[i].log_N2 = params.log_N - diagrams[i].log_N1;
                }
                diagrams[i].N1 = Math.pow(2, diagrams[i].log_N1);
                diagrams[i].N2 = Math.pow(2, diagrams[i].log_N2);
                if (diagrams[i].w === undefined) {
                    diagrams[i].w = params.w;
                }
                else {
                    diagrams[i].w = bigInt(diagrams[i].w);
                }
                this.add(Step, diagrams[i]);
                break;
			default:
				alert('Unknown pattern: ' + diagrams[i].pattern + '\n\nThe only valid patterns are: FFT, Bit-Reversal, Divide by N, Square, Transpose, Factor, Butterfly');
				return false;
		}
	}
    return true;
}

ControllerFFT.prototype.add = function (StepFunction, diagram) {
	// initialize step
	var step = new StepFunction(diagram, diagram.steps.length, this.globalIndex++);

	// prepare canvas width and height
	if (canvas.canvasWidth < step.getWidth()) {
		canvas.canvasWidth = step.getWidth();
	}
	step.top = canvas.canvasHeight;
	canvas.canvasHeight += step.getHeight();

	// add step to diagram
    diagram.steps[diagram.steps.length] = step;
    return step;
}

ControllerFFT.prototype.run = function (fullScreen) {
	// cleanup previous drawing
	if (tool != null) {
		tool.remove();
	}
	if (view != null) {
		view.remove();
	}
	if (project != null) {
		project.remove();
	}
	
	// setup new drawing
    canvas.setup(fullScreen ? '-fullscreen': '');
    //canvas.drawGrid(); // optionally draw the grid
	
    // calc and draw each step
	for (var i = 0; i < this.diagrams.length; i++) {
		for (var j = 0; j < this.diagrams[i].steps.length; j++) {
			this.diagrams[i].steps[j].calc();
			this.diagrams[i].steps[j].draw();
		}
    }
    
    // render
	view.draw();
    
    // setup mouse events for animations
    if (params.N < 32) {
        canvas.eventHandlers();
    }
}
