//Copyright (C) 2025 Guillaume P. Hérault (https://github.com/LucasNTT/LucasNTT.github.io)
//
//Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal
//in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following condition:
//
//The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
function AnalyzeNTT() { };

	AnalyzeNTT.worker;
	AnalyzeNTT.ul;
	AnalyzeNTT.li;
	AnalyzeNTT.steps;
	AnalyzeNTT.currentStep;
	
	AnalyzeNTT.Process = function () {
		if (!window.Worker) {
			alert('Unfortunately your web browser is not compatible. Please use a modern browser!');
			return false;
		}
		
		// Initializations
		document.getElementById('proceed').style.visibility = 'visible';
		document.getElementById('waiting').style.visibility = 'visible';
		document.getElementById('results').style.visibility = 'hidden';
	
		AnalyzeNTT.currentStep = 0;
		AnalyzeNTT.steps = ['Parsing the Input Parameter', 
							'Checking Primality of p', 
							'Extracting the Prime Factors of (p-1)', 
							'Finding the Deepest Primitive Root',
							'Finding the Primitive Root of Two'];

		AnalyzeNTT.ul = document.getElementById('tasks');
		while (AnalyzeNTT.ul.firstChild) {
			AnalyzeNTT.ul.removeChild(AnalyzeNTT.ul.firstChild);
		}

		// Create the worker that will compute everything in the background
		AnalyzeNTT.worker = new Worker('js/nttanalysis/ntt.js');

		AnalyzeNTT.worker.onmessage = function(e) {
			AnalyzeNTT.StepCompleted(e);
		}

		// Initiate the first step
		AnalyzeNTT.CreateNewStep();
		
		// Start the worker
		AnalyzeNTT.worker.postMessage(document.getElementById('modulus').value);

		return true;
	};
	
	AnalyzeNTT.StepCompleted = function (e) {
		if (e.data[1]) {
			// Step is passed
			AnalyzeNTT.li.setAttribute('class','passed-item');
			AnalyzeNTT.currentStep++;
			if (AnalyzeNTT.currentStep < AnalyzeNTT.steps.length) {
				AnalyzeNTT.CreateNewStep();
			}
			else {
				document.getElementById('waiting').style.visibility = 'hidden';
				AnalyzeNTT.Terminate('visible', e.data[2]);
			}
		}
		else {
			// Step is failed
			AnalyzeNTT.li.setAttribute('class','failed-item');
			AnalyzeNTT.Terminate('visible', e.data[2]);
		}
	};
	
	AnalyzeNTT.CreateNewStep = function () {
		AnalyzeNTT.li = document.createElement('li');
		AnalyzeNTT.li.appendChild(document.createTextNode(AnalyzeNTT.steps[AnalyzeNTT.currentStep]));
		AnalyzeNTT.ul.appendChild(AnalyzeNTT.li);
	};
	
	AnalyzeNTT.Terminate = function (visibility, html) {
		document.getElementById('waiting').style.visibility = 'hidden';
		document.getElementById('results').style.visibility = visibility;
		document.getElementById('calc_results').innerHTML = html;
		AnalyzeNTT.worker.terminate();
	};
	
	AnalyzeNTT.Cancel = function () {
		AnalyzeNTT.Terminate('hidden', '');
		return false;
	};
