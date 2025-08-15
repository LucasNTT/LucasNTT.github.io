//Copyright (C) 2025 Guillaume P. Hérault (https://github.com/LucasNTT/LucasNTT.github.io)
//
//Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal
//in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following condition:
//
//The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//

// Base class
function Step(parent, index, globalIndex) {
	this.parent = parent; // the diagram that owns the step
	this.top = 0; // vertical offset, where to start drawing
	this.index = index;	// index within the diagram (ie the FFT step for a FFT)
	this.globalIndex = globalIndex;	// index within all the diagrams
	params.values[globalIndex + 1] = []; // where the calculating values will be stored
    this.variables = [];
};

Step.prototype.getHeight = function () {
    if (this.parent.pattern == 'Bit-Reversal' ||
        this.parent.pattern == 'Transpose' ||
        this.parent.pattern == 'Factor')
        return 3
    else
        return 2;
}

Step.prototype.getWidth = function () {
	return 5 + 3 * params.N;
}

Step.prototype.getTitle = function () {
	return this.parent.pattern;
}

Step.prototype.getSubTitle = function () {
    if (this.parent.pattern == 'Transpose') {
        return this.parent.N2 + ' x ' + this.parent.N1 + '  =>  ' + this.parent.N1 + ' x ' + this.parent.N2;
    }
    if (this.parent.pattern == 'Factor') {
        return this.parent.N2 + ' x ' + this.parent.N1;
    }
	return undefined;
}

Step.prototype.getDescription = function () {
    return undefined;
}

Step.prototype.getArrowTooltip = function () {
    return undefined;
}

Step.prototype.getColorSet = function () {
    return -1;
}

Step.prototype.getColorStrength = function () {
    return 0;
}

Step.prototype.ifTranspose = function (i) {
    return i;
}

Step.prototype.drawArrowStep = function () {
    // Big arrow on the left
    var y = this.top;
    var h = this.getHeight();
    if (this.globalIndex == 0) {
        y--;
        h++;
    }
    canvas.addArrowStep({
        X: 0,
        Y: y,
        W: 3,
        H: h,
        isFirstDiagram: this.globalIndex == 0,
        colorSet: this.getColorSet(),
        colorStrength: this.getColorStrength(),
        title: this.getTitle(),
        subtitle: this.getSubTitle(),
        description: this.getDescription(),
        tooltip: this.getArrowTooltip()
    });
}

Step.prototype.drawValues = function () {
    for (var i = 0; i < params.N; i++) {
        var color = 2 + (this.ifTranspose(i) >> this.parent.log_N);
        if (this.globalIndex == 0) {
            // First step is responsible for drawing the initial values
            canvas.addValue({
                X: 5 + 3 * i,
                Y: 0,
                W: 3,
                H: 1,
                value: params.values[this.globalIndex][i],
                step: this.globalIndex,
                index: i,
                colorSet: color,
                colorStrength: 204
            });
        }
        else {
            if (this instanceof FFTStep) {
                canvas.changeColor(this.globalIndex, i, color, 204);
            }
        }

        // Resulting values
        canvas.addValue({
            X: 5 + 3 * i,
            Y: this.top + this.getHeight() - 1,
            W: 3,
            H: 1,
            value: params.values[this.globalIndex + 1][i],
            step: this.globalIndex + 1,
            index: i,
            tooltip: this.variables[i],
            colorSet: color,
            colorStrength: 204
        });
    }
}

Step.prototype.transpose = function (i) {
    return (i >> this.parent.log_N1) + this.parent.N2 * (i % this.parent.N1);
}

Step.prototype.factor = function (i) {
    return (i >> this.parent.log_N2) * (i % this.parent.N2);
}

Step.prototype.draw = function () {
    this.drawArrowStep();
    this.drawValues();

	// Arrows
    for (var i = 0; i < params.N; i++) {
        var j = i;
        if (this.parent.pattern == 'Bit-Reversal') j = i.bitrev(params.log_N);
        if (this.parent.pattern == 'Transpose') j = this.transpose(i);
        canvas.addArrow({
            X1: 6.5 + 3 * j,
            Y1: this.top,
            X2: 6.5 + 3 * i,
            Y2: this.top + this.getHeight() - 1,
            exp: this.parent.pattern == 'Factor' ? this.factor(i) : undefined
        });
	}
}

Step.prototype.calc = function () {
	for (var i = 0; i < params.N; i++) {
		if (params.values[this.globalIndex][i] == undefined)
			params.values[this.globalIndex + 1][i] = undefined;
		else {
			switch (this.parent.pattern) {
				case 'Bit-Reversal':
					params.values[this.globalIndex + 1][i] = params.values[this.globalIndex][i.bitrev(params.log_N)];
					break;
				case 'Divide by N':
					var inv_N = bigInt(params.N).modInv(params.p); 
					params.values[this.globalIndex + 1][i] = params.values[this.globalIndex][i].multiply(inv_N).modulo(params.p);
					break;
				case 'Square':
					params.values[this.globalIndex + 1][i] = params.values[this.globalIndex][i].multiply(params.values[this.globalIndex][i]).modulo(params.p);
					break;
                case 'Transpose':
                    params.values[this.globalIndex + 1][i] = params.values[this.globalIndex][this.transpose(i)];
                    break;
                case 'Factor':
                    params.values[this.globalIndex + 1][i] = params.values[this.globalIndex][i].multiply(this.parent.w.modPow(this.factor(i), params.p)).modulo(params.p);
                    break;
			}
		}
	}
}

// Butterfly step (inherits from Step)
function ButterflyStep(parent, index, globalIndex) {
	Step.call(this, parent, index, globalIndex);
};

ButterflyStep.prototype = Object.create(Step.prototype);

ButterflyStep.prototype.getHeight = function () {
	return 6;
}

ButterflyStep.prototype.getWidth = function () {
	return 13;
}

ButterflyStep.prototype.calc = function () {
    this.butterflies = [];
    this.butterflies[0] = { in: [], out: [] };
    this.butterflies[0].in[0] = 0;
    this.butterflies[0].in[1] = 1;
    this.butterflies[0].out[0] = 0;
    this.butterflies[0].out[1] = 1;
    params.values[0][0] = 'u';
    params.values[0][1] = 'v';
    if (this.parent.DIF) {
        params.values[1][0] = 'u + v';
        params.values[1][1] = '(u - v)w^k';
    }
    else {
        params.values[1][0] = 'u + vw^k';
        params.values[1][1] = 'u - vw^k';
    }
}

ButterflyStep.prototype.draw = function () {
    this.drawArrowStep();
    canvas.addValue({
        X: 5,
        Y: 0,
        W: 3,
        H: 1,
        value: params.values[0][0],
        step: 0,
        index: 0,
        colorSet: 2,
        colorStrength: 204
    });
    canvas.addValue({
        X: 10,
        Y: 0,
        W: 3,
        H: 1,
        value: params.values[0][1],
        step: 0,
        index: 1,
        colorSet: 2,
        colorStrength: 204
    });
    canvas.addValue({
        X: 5,
        Y: this.getHeight(),
        W: 3,
        H: 1,
        value: params.values[1][0],
        step: 1,
        index: 0,
        colorSet: 2,
        colorStrength: 204
    });
    canvas.addValue({
        X: 10,
        Y: this.getHeight(),
        W: 3,
        H: 1,
        value: params.values[1][1],
        step: 1,
        index: 1,
        colorSet: 2,
        colorStrength: 204
    });
    canvas.addButterfly({
        X: 7,
        Y: 3,
        W: 4,
        H: 1,
        value: 'Butterfly ' + (this.parent.DIF ? 'DIF ' : 'DIT '),
        DIF: this.parent.DIF,
        exp: 'k',
        step: 0,
        in: this.butterflies[0].in,
        out: this.butterflies[0].out,
        colorSet: 2,
        colorStrength: 160
    });
    canvas.addArrow({
        X1: 6.5,
        Y1: 1,
        X2: 7.5,
        Y2: 3
    });
    canvas.addArrow({
        X1: 11.5,
        Y1: 1,
        X2: 10.5,
        Y2: 3
    });
    canvas.addArrow({
        X1: 7.5,
        Y1: 4,
        X2: 6.5,
        Y2: 6
    });
    canvas.addArrow({
        X1: 10.5,
        Y1: 4,
        X2: 11.5,
        Y2: 6
    });
}

// FFT step (inherits from ButterflyStep)
function FFTStep(parent, index, globalIndex) {
    ButterflyStep.call(this, parent, index, globalIndex);
    this.w = parent.forward || parent.w.equals(0) ? parent.w : parent.w.modInv(params.p);
};

FFTStep.prototype = Object.create(ButterflyStep.prototype);

FFTStep.prototype.getWidth = function () {
    return Step.prototype.getWidth.call(this);
}

FFTStep.prototype.getTitle = function () {
    return 'FFT step ' + (this.index + 1);
}

FFTStep.prototype.getSubTitle = function () {
    return (this.parent.forward) ? '' : 'Backward';
}

FFTStep.prototype.getColorSet = function () {
    return 0;
}

FFTStep.prototype.getColorStrength = function () {
    return this.index;
}

FFTStep.prototype.getDescription = function () {
    var result = '';
    if (this.parent.N != params.N) {
        result = (params.N / this.parent.N) + ' x FFT-' + this.parent.N + '\n';
    }
    result += 'Strides:\n';
    result += '  Read = ' + Math.pow(2, this.strideIn) + '\n';
    result += '  Write = ' + Math.pow(2, this.strideOut);
    return result;
}

FFTStep.prototype.getArrowTooltip = function () {
    return 'Values are taken by pair\nwith a stride of ' + Math.pow(2, this.strideIn) +
        '.\n\nThe results of the butterfly\nare written back in memory\nwith a stride of ' + Math.pow(2, this.strideOut) + '.';
}

FFTStep.prototype.ifTranspose = function (i) {
    if (this.parent.transposed) {
        return (i >> (params.log_N - this.parent.log_N)) + this.parent.N * (i % (params.N / this.parent.N));
    } else {
        return i;
    }
}

FFTStep.prototype.calc = function () {
    this.butterflies = [];
    for (var i = 0; i < params.N / this.parent.radix; i++) {
        this.butterflies[i] = { in: [], out: []};
        var x = [];

        var idx_in = i % Math.pow(2, this.strideIn) + ((i >> this.strideIn) << (this.strideIn + this.parent.log_radix));
        var idx_out = i % Math.pow(2, this.strideOut) + ((i >> this.strideOut) << (this.strideOut + this.parent.log_radix));

        for (var j = 0; j < this.parent.radix; j++) {
            this.butterflies[i].in[j] = idx_in;
            x[j] = params.values[this.globalIndex][this.butterflies[i].in[j]];
            idx_in += Math.pow(2, this.strideIn);
            this.butterflies[i].out[j] = idx_out;
            idx_out += Math.pow(2, this.strideOut);
        }

        var idxButterfly = this.parent.transposed ?
                (i >> (params.log_N - this.parent.log_N)) % (this.parent.N / this.parent.radix) :
                i % (this.parent.N / this.parent.radix);
        if (this.parent.bitRevW) {
            idxButterfly = idxButterfly.bitrev(this.parent.log_N - 1);
        }

        var idx = this.index * this.parent.log_radix;
        var reversed_idx = (this.parent.log_N / this.parent.log_radix - this.index - 1) * this.parent.log_radix;
        if (!this.parent.DIF) {
            var tmp = idx;
            idx = reversed_idx;
            reversed_idx = tmp;
        }
        var exp;
        if (this.parent.groupW) {
            exp = (idxButterfly >> idx) << idx;
        }
        else {
            exp = Math.pow(2, idx) * (idxButterfly % Math.pow(2, reversed_idx));
        }
        exp = exp % params.N;
        this.butterflies[i].exp = exp;
        var root = this.w.modPow(this.parent.N / this.parent.radix, params.p);

        if (x[0] === undefined) { // handle the case where we draw an empty diagram without values
            for (var j = 0; j < this.parent.radix; j++) {
                params.values[this.globalIndex + 1][this.butterflies[i].out[j]] = undefined;
            }
        }
        else { // Butterfly calculation
            if (!this.parent.DIF) { // twiddle factor first
                for (var j = 0; j < this.parent.radix; j++) {
                    x[j] = x[j].multiply(this.w.modPow(exp * j, params.p)).modulo(params.p);
                }
            }
            // then a small DFT for each butterfly
            for (var j = 0; j < this.parent.radix; j++) {
                var y = bigInt(0);
                for (var k = 0; k < this.parent.radix; k++) {
                    y = y.add(x[k].multiply(root.modPow((j * k) % params.N, params.p))).modulo(params.p);
                }
                // twiddle factor last 
                if (this.parent.DIF) {
                    y = y.multiply(this.w.modPow(exp * j, params.p)).modulo(params.p);
                }
                params.values[this.globalIndex + 1][this.butterflies[i].out[j]] = y;
            }
        }
        // End of the calculation
        // Now store the variables used for the calculation, in order to show the calculation details
        if (this.parent.radix == 2) { // we only do that for radix-2 because radix-4 formulas are too large to be drawn
            this.variables[this.butterflies[i].out[0]] = [];
            this.variables[this.butterflies[i].out[0]].push(
                {
                    key: 'formula',
                    value: this.parent.DIF ? 'u + v  (mod p)' : 'u + vw^k  (mod p)'
                });
            this.variables[this.butterflies[i].out[1]] = [];
            this.variables[this.butterflies[i].out[1]].push(
                {
                    key: 'formula',
                    value: this.parent.DIF ? '(u - v)w^k  (mod p)' : 'u - vw^k  (mod p)'
                });
            for (var j = 0; j < this.parent.radix; j++) {
                if (x[0] === undefined) {
                    if (!this.parent.DIF || j != 0)
                        this.variables[this.butterflies[i].out[j]].push({ key: 'k', value: exp.toString() });
                } else {
                    this.variables[this.butterflies[i].out[j]].push({ key: 'u', value: params.values[this.globalIndex][this.butterflies[i].in[0]].toString() });
                    this.variables[this.butterflies[i].out[j]].push({ key: 'v', value: params.values[this.globalIndex][this.butterflies[i].in[1]].toString() });
                    if (!this.parent.DIF || j != 0) {
                        this.variables[this.butterflies[i].out[j]].push({ key: 'w', value: this.w.toString() });
                        this.variables[this.butterflies[i].out[j]].push({ key: 'k', value: exp.toString() });
                    }
                    this.variables[this.butterflies[i].out[j]].push({ key: 'p', value: params.p.toString() });
                }
            }
        }
    }
}

FFTStep.prototype.draw = function () {
    this.drawArrowStep(); // draw big arrow on the left
    this.drawValues(); // draw values

    for (var i = 0; i < this.butterflies.length; i++) {
        var width = 3 * this.parent.radix - 2;
        var left = 6 + i * (width + 2);
        var idxButterfly = this.parent.transposed ? i >> (params.log_N - this.parent.log_N) : i;
        var color = this.parent.transposed ? i % (params.N / this.parent.N) : i >> (this.parent.log_N - this.parent.log_radix);
        // now draw butterflies
        canvas.addButterfly({
            X: left,
            Y: this.top + 2,
            W: width,
            H: 1,
            value: 'Butterfly ' + (1 + (idxButterfly % (this.parent.N / this.parent.radix))),
            DIF: this.parent.DIF,
            exp: this.butterflies[i].exp,
            step: this.globalIndex,
            in: this.butterflies[i].in,
            out: this.butterflies[i].out,
            colorSet: 2 + color,
            colorStrength: 160
        });
        // and arrows
        if (this.butterflies[i].in.length == this.butterflies[i].out.length) { // just an assertion, it cannot be different
            for (var j = 0; j < this.butterflies[i].in.length; j++) {
                // arrows above the butterfly
                canvas.addArrow({
                    X1: 6.5 + 3 * this.butterflies[i].in[j],
                    Y1: this.top,
                    X2: left + 0.5 + j * 3,
                    Y2: this.top + 2
                });
                // arrows below the butterfly
                canvas.addArrow({
                    X1: left + 0.5 + j * 3,
                    Y1: this.top + 3,
                    X2: 6.5 + 3 * this.butterflies[i].out[j],
                    Y2: this.top + 5
                });
            }
        }
    }
}

