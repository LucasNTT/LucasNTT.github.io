//Copyright (C) 2025 Guillaume P. Hérault (https://github.com/LucasNTT/LucasNTT.github.io)
//
//Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal
//in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following condition:
//
//The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//

// Section: global objects
var params = {
	N: 0,		// total number of elements (a power of two)
	log_N: 0,	// number of steps (N = 2^log_N)
	p: 0,		// the modulus
	w: 0,		// the primitive root of one
    values: [],	// 2-dim array that contains the values for each step
    colored: false // use different colors for each independant FFT in assembly diagrams
};

var canvas = new Canvas();
var boxes = [];

// Section: initialization
window.onload = function () {
	$.ajax({
		url: "data/diagrams.json",
		dataType: "json",
		success: function (response) {
			LoadDiagrams(response);
		}
	});
    hideFullScreen();
    $("#warning_anim").hide();
}


window.addEventListener('resize', function (event) {
    hideFullScreen();
});

function hideFullScreen() {
    if ($("#measure").outerWidth() >= 1200) {
        $("#lblFullScreen").show();
    } else {
        $("#lblFullScreen").hide();
    }
}

// Section: prototype enhancements
bigInt.prototype.modulo = function (n) {
	// prevent negative modulo
	return this.mod(n).add(n).mod(n);
};

Number.prototype.bitrev = function (n) {
	var x = this;
	var s = n;
	var b = 0;
	while (x != 0) {
		b <<= 1;
		b |= (x & 1);
		x >>= 1;
		s--;
	}
	b <<= s;
	return b;
}

// Section: interactions with UI
function LoadDiagrams(json) {
	this.json = json;
	$.each(json.categories, function (i, cat) {
		$('#category').append("<option value='" + cat.id + "'>" + cat.title + "</option>");
	});
	changeCategory(0);

	$.each(json.valueSets, function (i, values) {
		if (undefined != values.disabled && values.disabled) {
			$('#values').append("<option disabled>" + values.title + "</option>");
		}
		else {
			$('#values').append("<option value='" + i + "'>" + values.title + "</option>");
		}
	});
	changeValues(0);
}

function changeCategory(category) {
	$('#diagram').empty();
	var first;
	$.each(this.json.diagrams, function (i, diagram) {
		if (diagram.category == category) {
			$('#diagram').append("<option value='" + i + "'>" + diagram.title + "</option>");
			if (undefined == first) first = i;
		}
	});
	changeDiagram(first);
}

function changeDiagram(idx) {
	document.getElementById('diagram_json').value = JSON.stringify(this.json.diagrams[idx].content, null, 2);
}

function changeValues(idx) {
	document.getElementById('values_json').value = JSON.stringify(this.json.valueSets[idx].content, null, 2);
}

function categoryTextAreaChange(event) {
	changeCategory(event.target.value);
}

function diagramTextAreaChange(event) {
	changeDiagram(event.target.value);
}

function valuesTextAreaChange(event) {
	changeValues(event.target.value);
}

// Section: process launch
function butterflyDiagram() {
	var chosenDiagrams, chosenValues;
	try {
		// get the JSON entered in the textareas
		chosenDiagrams = JSON.parse(document.getElementById('diagram_json').value);
		chosenValues = JSON.parse(document.getElementById('values_json').value);
	} catch (e) {
		alert(e);
	}
	if (chosenValues.params.log_N > 5) {
		alert('Cannot draw a FFT with a length larger than 2^5 = 32');
		return;
    }
    if (chosenValues.params.log_N == 5) {
        $("#warning_anim").show();
    } else {
        $("#warning_anim").hide();
    }
	params.log_N = chosenValues.params.log_N;
	params.N = Math.pow(2, params.log_N);
	params.w = bigInt(chosenValues.params.w);
	params.p = chosenValues.params.p == undefined ? bigInt(257) : bigInt(chosenValues.params.p); // just to prevent errors when an empty diagram is requested
    params.values[0] = []; // index 0 contains initial values
    params.colored = (chosenValues.colored !== undefined && chosenValues.colored);

	for (var i = 0; i < params.N; i++) { 
		params.values[0][i] = chosenValues.values.length > 0 ? bigInt(chosenValues.values[i]) : undefined; // from string to bigInt. Will set to zero the missing values
	}
	// Check that N*M*M < p
	var count = 0;
	for (var i = 0; i < params.values[0].length; i++) {
		if (params.values[0][i] != undefined && params.values[0][i].square().multiply(params.N).greaterOrEquals(bigInt(params.p))) {
			count++;
		}
	}
	if (count > 0) {
		alert('Warning ! there ' + (count > 1 ? 'are ' : 'is ') + count + ' value' + (count > 1 ? 's' : '') + ' too large for this modulo! There may be an overflow and a wrong result!');
	}
    var fullScreen = document.getElementById('chkFullScreen').checked;
    if (fullScreen) {
        $("#measure").hide();
        $("#measure-fullscreen").show();
    } else {
        $("#measure").show();
        $("#measure-fullscreen").hide();
    }

    var controllerFFT = new ControllerFFT();
	
	if (controllerFFT.initialize(chosenDiagrams)) {
        controllerFFT.run(fullScreen);
	}
}
